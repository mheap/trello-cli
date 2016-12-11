"use strict";

fs = require("fs");

var __ = function(program, output, logger, config, trello, translator, trelloApiCommands) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {
        logger.info("Showing lists belonging to the specified board");

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
        var boardId = translator.getBoardIdByName(options.board);

        trello.get("/1/boards/" + boardId + "/lists",
						{}, function(err, data) {
            if (err) throw err;

						if ((!!data) && data.length > 0) {
							if (options.showListName) {
								output.normal(translator.getList(data[0].id).underline);
							} else {
								output.normal(translator.getBoard(data[0].idBoard).underline);
							}
							for (var i = 0 ; i < data.length ; i++) {
									var formattedCardName = data[i].name.replace(/\n/g, "");
									output.normal("* " + formattedCardName);
							}
						}

        });
    }

    trelloApiCommand.nomnomProgramCall = function () {
        program
            .command("show-lists")
            .help("Show the lists on a board")
            .options({
                "board": {
                    abbr: 'b',
                    metavar: 'BOARD',
                    help: "The board name which contains the list of lists to show",
                    required: true
                },
                "showListName": {
                      abbr: 'n',
                      help: "Show list name in title, in addtion to board name",
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
