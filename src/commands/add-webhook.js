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
    logger.info("Adding webhook...");

    // get or create the board
    try {
      var boardId = translator.getBoardIdByName(options.boardName);
    } catch (err) {
      if (err.message == "Unknown Board") {
        if (options.force && !options.triedToCreateBoard) {
          logger.info("Board doesn't exist, creating...");
          options.triedToCreateBoard = true;
          trelloApiCommands["add-board"].makeTrelloApiCall(options, function() {
            trelloApiCommands["add-webhook"].makeTrelloApiCall(options, null);
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

    // Build up arguments to send
    var params = {
      idModel: boardId,
      description: options.description,
      callbackURL: options.callbackURL
    };

    trello.post("/1/webhooks", params, function(err, data) {
      if (err) {
        throw err;
      }

      if (options.verbose) {
        logger.info("Result from Trello: ");
        logger.info(data);
      }

      if (data == "invalid value for desc") {
        logger.warning("Invalid value for webhook description");
      } else if (data == "Rate limit reached") {
        logger.warning("Error: rate limited reached");
      } else {
        logger.info("Webhook created");
      }
    });
  }; // end of trelloApiCommand.makeTrelloApiCall

  trelloApiCommand.nomnomProgramCall = function() {
    program
      .command("add-webhook")
      .help("Add a webhook to a board")
      .options({
        description: {
          abbr: "d",
          metavar: "DESCRIPTION",
          help: "The webhook's description",
          required: false,
          default: "",
          list: false
        },
        boardName: {
          abbr: "b",
          metavar: "BOARD",
          help: "The board name to add a webhook to",
          required: true
        },
        callbackURL: {
          abbr: "c",
          metavar: "CALLBACK_URL",
          help: "The URL to connect to",
          required: true
        },
        force: {
          abbr: "f",
          metavar: "FORCE",
          help: "Create the board if it doesn't exist",
          required: false,
          default: false
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
