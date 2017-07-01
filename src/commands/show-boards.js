"use strict";

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
    var listOfBoards = [];

    _.each(translator.cache.translations.boards, function(oneBoard, boardId) {
      if (
        boardId != "undefined" && options.includeClosed
          ? true
          : oneBoard["closed"] == false
      ) {
        // oneBoard: [ organisationId, boardName, closed (not guaranteed available) ]
        listOfBoards.splice(
          _.sortedIndex(
            listOfBoards,
            {
              id: boardId,
              name: oneBoard["name"],
              closed: oneBoard["closed"]
            },
            "name"
          ),
          0,
          {
            id: boardId,
            name: oneBoard["name"],
            closed: oneBoard["closed"]
          }
        );
      }
    });

    _.each(listOfBoards, function printBoardObject(board) {
      output.normal(
        board.name + (options.hideIds ? "" : " (ID: " + board.id + ")")
      );
    });
  };

  trelloApiCommand.nomnomProgramCall = function() {
    program
      .command("show-boards")
      .help("Show the list of cached boards")
      .options({
        includeClosed: {
          abbr: "c",
          help: "Include closed boards in the list (default: no)",
          required: false,
          flag: true,
          default: false
        },
        hideIds: {
          abbr: "i",
          help:
            "Do not include the board IDs in the output (default is to print IDs)",
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
