"use strict";

fs = require("fs");

var _ = require("underscore");

var __ = function (
  program,
  output,
  logger,
  config,
  trello,
  translator,
  trelloApiCommands
) {
  var trelloApiCommand = {};

  trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {
    logger.info("Showing lists belonging to the specified board");

    var boardIds = [];

    // Grab our boards etc
    if (options.board) {
      try {
        boardIds.push(translator.getBoardIdByName(options.board));
      } catch (err) {
        if (err.message == "Unknown Board") {
          logger.warning("Unknown board.  Perhaps you have a typo?");

          output.normal("\nYou have the following open boards:\n");
          trelloApiCommands["show-boards"].makeTrelloApiCall(
            {
              includeClosed: false,
              hideIds: true,
            },
            null
          );
          return;
        }
      }
    } else {
      _.each(
        translator.cache.translations.boards,
        function (oneBoard, boardId) {
          if (boardId != "undefined") {
            boardIds.push(boardId);
          }
        }
      );
    }

    boardIds.forEach(function (boardId) {
      var listOfLists = [];
      _.each(translator.cache.translations.lists, function (oneList, listId) {
        if (listId != "undefined" && oneList["board"] == boardId) {
          // oneList: [ boardId, listName ]
          listOfLists.splice(
            _.sortedIndex(
              listOfLists,
              {
                id: listId,
                name: oneList["name"],
              },
              "name"
            ),
            0,
            {
              id: listId,
              name: oneList["name"],
            }
          );
        }
      });

      if (options.showBoardName || !options.board) {
        output.underline(translator.getBoard(boardId));
      }

      _.each(listOfLists, function printBoardObject(list) {
        output.normal(
          list.name + (options.hideIds ? "" : " (ID: " + list.id + ")")
        );
      });

      output.normal("");
    });
  };

  trelloApiCommand.nomnomProgramCall = function () {
    program
      .command("show-lists")
      .help("Show the list of cached lists")
      .options({
        board: {
          abbr: "b",
          metavar: "BOARD",
          help: "The board name which contains the list of lists to show",
          required: false,
        },
        showBoardName: {
          abbr: "n",
          help: "Show board name in title if specific board specified",
          required: false,
          flag: true,
          default: true,
        },
        hideIds: {
          abbr: "i",
          help: "Do not include the list IDs in the output (default is to print IDs)",
          required: false,
          flag: true,
          default: false,
        },
      })
      .callback(function (options) {
        trelloApiCommand.makeTrelloApiCall(options);
      });
  };

  return trelloApiCommand;
};

module.exports = __;
