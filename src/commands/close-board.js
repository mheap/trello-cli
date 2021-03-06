"use strict";

var async = require("async");

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
    var boardsToDelete = translator.getBoardsByName(
      options.boardNameMatch,
      function (boardNameToTest, match) {
        return boardNameToTest.indexOf(match) != -1;
      }
    );

    if (boardsToDelete.length == 0) {
      output.normal("No boards match search string; exitting.");
    } else {
      output.normal("Boards which will be closed:");
      boardsToDelete.forEach(function (boardToDelete) {
        output.normal("    " + boardToDelete.name);
      });

      // prompt for continue
      output.normal(
        "Do you want to continue with closing the boards? Type 'yes' to continue"
      );

      process.stdin.once("data", function (userInput) {
        if (userInput.toString().indexOf("yes") == 0) {
          logger.info("Closing boards...");

          async.each(
            boardsToDelete,
            function (boardToDelete, callback) {
              trello.put(
                "/1/boards/" + boardToDelete.id + "/closed",
                {
                  value: true,
                },
                function (err, data) {
                  if (err) {
                    throw err;
                  }
                  callback();
                }
              );
            },
            function (err) {
              logger.info("Boards closed");
              process.stdin.unref();
            }
          );
        } else {
          logger.info("Exiting");
          process.stdin.unref();
        }
      });
    }
  };

  trelloApiCommand.nomnomProgramCall = function () {
    program
      .command("close-board")
      .help(
        "Closes those board(s) where the specified text occurs in their name"
      )
      .options({
        boardNameMatch: {
          abbr: "b",
          metavar: "BOARD",
          help:
            "The text to search for in the board name; all boards with the specified text in their name will be closed.",
          required: true,
        },
        verbose: {
          abbr: "v",
          help: "Turn on increased error reporting",
          required: false,
          flag: true,
        },
      })
      .callback(function (options) {
        trelloApiCommand.makeTrelloApiCall(options);
      });
  };

  return trelloApiCommand;
};

module.exports = __;
