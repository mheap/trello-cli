"use strict";

var __ = function(
  program,
  output,
  logger,
  config,
  trello,
  translator,
  trelloApiCommands
) {
  var trelloApiCommand = {};

  trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
    logger.info("Adding card...");

    var boardId, listId;

    // get or create the board
    try {
      boardId = translator.getBoardIdByName(options.boardName);
    } catch (err) {
      if (err.message == "Unknown Board") {
        if (options.force && !options.triedToCreateBoard) {
          logger.info("Board doesn't exist, creating...");
          options.triedToCreateBoard = true;
          trelloApiCommands["add-board"].makeTrelloApiCall(options, function() {
            trelloApiCommands["add-card"].makeTrelloApiCall(options, null);
          });
          return;
        } else {
          logger.error(
            "Board '" + options.boardName + "' does not exist.  Exiting."
          );
          process.exit(1);
        }
      } else {
        logger.error("Unknown error:");
        throw err;
      }
    }
    //boardId = translator.getBoardIdByName(options.boardName);

    // get or create the list
    try {
      listId = translator.getListIdByBoardNameAndListName(
        options.boardName,
        options.listName
      );
    } catch (err) {
      if (err.message == "Unknown List") {
        if (options.force && !options.triedToCreateList) {
          logger.info("List doesn't exist, creating...");
          options.triedToCreateList = true;
          //options.refreshCache =
          trelloApiCommands["add-list"].makeTrelloApiCall(options, function() {
            // This is hacky; but sometimes the request to refresh seems to happen too quick for Trello's servers, and they don't
            // return the newly created list.  This mitigates that problem.
            setTimeout(function() {
              trelloApiCommands[
                "refresh"
              ].makeTrelloApiCall(options, function() {
                trelloApiCommands["add-card"].makeTrelloApiCall(options, null);
              });
            }, 1500);
          });
          return;
        } else {
          logger.error(
            "List '" + options.listName + "' does not exist.  Exiting."
          );
          process.exit(1);
        }
      } else {
        logger.error("Unknown error:");
        throw err;
      }
    }
    //listId = translator.getListIdByBoardNameAndListName(options.boardName, options.listName);

    // Build up arguments to send
    var params = {
      name: options.title,
      idList: listId,
      desc: options.description ? options.description : "",
      pos:
        ["top", "bottom"].indexOf(options.cardPosition) > -1
          ? options.cardPosition
          : "bottom",
      idLabels: options.labels ? options.labels.replace(/\s+/g, "") : ""
    };

    trello.post("/1/cards", params, function(err, data) {
      if (err) {
        throw err;
      }

      if (options.verbose) {
        logger.info("Result from Trello: ");
        logger.info(data);
      }

      if (data == "invalid value for name") {
        logger.warning("Invalid value for card name");
      } else if (data == "invalid value for desc") {
        logger.warning("Invalid value for card description");
      } else if (data == "Rate limit reached") {
        logger.warning("Error: rate limited reached");
      } else {
        logger.info("Card created");
      }
    });
  }; // end of trelloApiCommand.makeTrelloApiCall

  trelloApiCommand.nomnomProgramCall = function() {
    program
      .command("add-card")
      .help("Add a card to a board")
      .options({
        title: {
          position: 1,
          help: "The card's title",
          list: false,
          required: true
        },
        description: {
          position: 2,
          help: "The card's description",
          list: false
        },
        boardName: {
          abbr: "b",
          metavar: "BOARD",
          help: "The board name to add a card to",
          required: true
        },
        listName: {
          abbr: "l",
          metavar: "LIST",
          help: "The list name to add a card to",
          required: true
        },
        cardPosition: {
          abbr: "q",
          metavar: "POS",
          help:
            "The position of the new card: acceptable values are 'top' or 'bottom' (default: bottom)",
          required: false
        },
        labels: {
          abbr: "g",
          metavar: "LABELS",
          help:
            "Comma-separated list of labels to assign to the card (requires IDs, see show-labels command)",
          required: false
        },
        force: {
          abbr: "f",
          help:
            "Force - will create the board and/or list if they don't already exist",
          flag: true,
          required: false
        },
        verbose: {
          abbr: "v",
          help: "Turn on increased error reporting",
          required: false,
          flag: true
        }
      })
      .callback(function(options) {
        trelloApiCommand.makeTrelloApiCall(options);
      });
  };

  return trelloApiCommand;
};

module.exports = __;
