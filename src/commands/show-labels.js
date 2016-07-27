"use strict";

fs = require("fs");

var __ = function(program, output, logger, config, trello, translator, trelloApiCommands) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {
        logger.info("Showing labels belonging to the specified board");

        // Grab our boards etc
        try {
            var boardId = translator.getBoardIdByName(options.board);
        } catch (err) {
            if (err.message == "Unknown Board") {
                logger.warning("Unknown board.  Perhaps you have a typo?");

                output.normal("\nYou have the following open boards:\n");
                trelloApiCommands["show-boards"].makeTrelloApiCall({ includeClosed : false, hideIds : true}, null);
                return;
            }
        }

        trello.get("/1/boards/" + boardId + "/labels", function(err, data) {
            if (err) throw err;

            for (var i in data) {
              var formattedLabel = data[i].color;

              if (data[i].name.length > 0) {
                formattedLabel += ' (' + data[i].name + ')';
              }

              if (options.showUses) {
                formattedLabel += ', ' + data[i].uses;
              }

              if (options.showIds) {
                formattedLabel += ' (ID: ' + data[i].id + ')';
              }

              output.normal(formattedLabel);
            }
        });
    }

    trelloApiCommand.nomnomProgramCall = function () {
        program
            .command("show-labels")
            .help("Show labels defined on a board")
            .options({
                "board": {
                    abbr: 'b',
                    metavar: 'BOARD',
                    help: "The board name which contains the labels to show",
                    required: true
                },
                "showIds": {
                      abbr: 'i',
                      help: "Show label IDs in the output (default is to omit IDs)",
                      required: false,
                      flag: true,
                      default: false
                },
                "showUses": {
                      abbr: 'u',
                      help: "Show how many times a label has been used",
                      required: false,
                      flag: true,
                      default: false
                }
            })
            .callback(function (options) {
                trelloApiCommand.makeTrelloApiCall(options);
            });
        }

    return trelloApiCommand;
}
module.exports = __;
