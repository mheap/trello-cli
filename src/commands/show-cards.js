"use strict";

fs = require("fs");

var _ = require("underscore");

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
    logger.info("Showing cards belonging to the specified list");

    // Grab our boards etc
    try {
      var boardId = translator.getBoardIdByName(options.board);
    } catch (err) {
      if (err.message == "Unknown Board") {
        logger.warning("Unknown board.  Perhaps you have a typo?");

        output.normal("\nYou have the following open boards:\n");
        trelloApiCommands["show-boards"].makeTrelloApiCall(
          {
            includeClosed: false,
            hideIds: true
          },
          null
        );
        return;
      }
    }

    var listIds = [];

    if (options.list) {
      listIds.push(
        translator.getListIdByBoardNameAndListName(options.board, options.list)
      );
    } else {
      _.each(translator.cache.translations.lists, function(oneList, listId) {
        if (listId != "undefined" && oneList["board"] == boardId) {
          // oneList: [ boardId, listName ]
          listIds.push(listId);
        }
      });
    }

    listIds.forEach(function(listId) {
      trello.get(
        "/1/lists/" + listId + "",
        {
          cards: "open"
        },
        function(err, data) {
          if (err) {
            throw err;
          }

          if (data.cards.length > 0 && !options.disableHeader) {
            if (options.showListName || !options.list) {
              output.underline(translator.getList(data.cards[0].idList));
            } else {
              output.underline(translator.getBoard(data.cards[0].idBoard));
            }
          }
          for (var i in data.cards) {
            var formattedCardName = data.cards[i].name.replace(/\n/g, "");
            if (!options.hideIds) {
              formattedCardName =
                data.cards[i].shortLink + " - " + formattedCardName;
            }
            output.normal("* " + formattedCardName);
          }
          output.normal("");
        }
      );
    });
  };

  trelloApiCommand.nomnomProgramCall = function() {
    program
      .command("show-cards")
      .help("Show the cards on a list")
      .options({
        board: {
          abbr: "b",
          metavar: "BOARD",
          help: "The board name which contains the list of cards to show",
          required: true
        },
        list: {
          abbr: "l",
          metavar: "LIST",
          help: "The name of the list whose cards to show",
          required: false
        },
        showListName: {
          abbr: "n",
          help:
            "Show list name in title, in addtion to board name, if specific list specified",
          required: false,
          flag: true,
          default: true
        },
        disableHeader: {
          abbr: "g",
          help: "Disable the header",
          required: false,
          flag: true,
          default: false,
        },
        hideIds: {
          abbr: "i",
          help:
            "Do not include the card IDs in the output (default is to print IDs)",
          required: false,
          flag: true,
          default: false
        }
      })
      .callback(function(options) {
        trelloApiCommand.makeTrelloApiCall(options);
      });
  };

  return trelloApiCommand;
};
module.exports = __;
