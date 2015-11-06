"use strict";

var __ = function (program, output, logger, config, trello, translator, trelloApiCommands) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {

        logger.info("Adding new list...");

        // find board ID
        var boardId;

        try {
            boardId = translator.getBoardIdByName(options.boardName);
        } catch (err) {
            if (err.message == "Unknown Board") {
                if (options.force && !options.triedCreate) {
                    logger.info("Board doesn't exist, creating...");
                    options.triedCreate = true;
                    trelloApiCommands["add-board"].makeTrelloApiCall(options, function () { trelloApiCommands["add-list"].makeTrelloApiCall(options, null); });
                    return;
                } else {
                    logger.error("Board '" + options.boardName + "' does not exist.  Exitting.");
                    process.exit(1);
                }
            } else {
                log.error("Unknown error:");
                throw err;
            }
        }
        boardId = translator.getBoardIdByName(options.boardName);

        // Build up arguments to send
        var params = {
            "name": options.listName,
            "idBoard": boardId,
            "pos" : ['top', 'bottom'].indexOf(options.position) > -1 ? options.position : "top"
        };

        trello.post("/1/lists", params, function (err, data) {
            if (err) {
                throw err;
            }

            if (options.verbose) {
                logger.warning(data);
            }

            logger.info("List added, new ID: " + data.id);

            trelloApiCommands["refresh"].makeTrelloApiCall(null);
        });
    };


    trelloApiCommand.nomnomProgramCall = function () {

        program
            .command("add-list")
            .help("Adds a new list to the spcified board with the specified name")
            .options({
                "boardName": {
                      abbr: 'b',
                      metavar: 'BOARD',
                      help: "The name of the board to add the list to",
                      required: true
                },
                "listName": {
                      abbr: 'l',
                      metavar: 'LIST',
                      help: "The name of the new list",
                      required: true
                },
                "position": {
                      abbr: 'p',
                      metavar: 'POS',
                      help: "The position of the new list: acceptable values are 'top' or 'bottom' (default: top)",
                      required: false
                },
                "force": {
                      abbr: 'f',
                      help: "Force - will creae the board if it doesn't already exist",
                      flag: true,
                      required: false
                },
                "verbose": {
                      abbr: 'v',
                      help: "Turn on increased error reporting",
                      required: false,
                      flag: true
                }
            })
            .callback(function (options) {
                trelloApiCommand.makeTrelloApiCall(options);
            });
    };

    return trelloApiCommand;
}

module.exports = __;
