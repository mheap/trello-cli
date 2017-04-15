"use strict";

var __ = function(program, output, logger, config, trello, translator, trelloApiCommands) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
        logger.info("Adding new board...");

        // Build up arguments to send
        var params = {
            "name": options.boardName,
            "desc": options.description ? options.description : "",
            "prefs_cardCovers": options.cardCoverImages ? "false" : "true",
            "prefs_cardAging": options.cardAging ? "pirate" : "regular"
        };

        // console.log(params);

        trello.post("/1/boards", params, function(err, data) {
            if (err) {
                throw err;
            }
            // console.log(data);
            logger.info("Board added, new URL: " + data.url);

            trelloApiCommands["refresh"].makeTrelloApiCall({"type":"lists"}, onComplete);
        });
    };

    trelloApiCommand.nomnomProgramCall = function() {
        program
            .command("add-board")
            .help("Adds a new board with the specified name")
            .options({
                "boardName": {
                    abbr: 'b',
                    metavar: 'BOARD',
                    help: "The name of the new board",
                    required: true
                },
                "description": {
                    abbr: 'd',
                    metavar: 'DESC',
                    help: "The description of the board",
                    required: false
                },
                "cardAging": {
                    abbr: 'a',
                    help: "Turns card aging on for the new board (default is off)",
                    required: false,
                    flag: true
                },
                "cardCoverImages": {
                    abbr: 'c',
                    help: "Turns off the showing of images on the front of cards (default is on)",
                    required: false,
                    flag: true
                },
                "verbose": {
                    abbr: 'v',
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
}

module.exports = __;