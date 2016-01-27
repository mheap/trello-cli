"use strict";

fs = require("fs");

var __ = function(program, output, logger, config, trello, translator, trelloApiCommands) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {
        logger.info("Showing cards belonging to the specified list");

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
        var listId = translator.getListIdByBoardNameAndListName(options.board, options.list);

        trello.get("/1/lists/" + listId + "", {"cards": "open"}, function(err, data) {
            if (err) throw err;

            if (data.cards.length > 0) {
                output.normal(translator.getBoard(data.cards[0].idBoard).underline);
            }
            for (var i in data.cards) {
                var formattedCardName = data.cards[i].name.replace(/\n/g, "");
                output.normal("* " + formattedCardName);
            }
        });
    }

    trelloApiCommand.nomnomProgramCall = function () {
        program
            .command("show-cards")
            .help("Show the cards on a list")
            .options({
                "board": {
                    abbr: 'b',
                    metavar: 'BOARD',
                    help: "The board name which contains the list of cards to show",
                    required: true
                },
                "list": {
                    abbr: 'l',
                    metavar: 'LIST',
                    help: "The name of the list whose cards to show",
                    required: true
                }
            })
            .callback(function (options) {
                trelloApiCommand.makeTrelloApiCall(options);
            });
        }

    return trelloApiCommand;
}
module.exports = __;
