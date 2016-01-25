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
                logger.error("Unknown error:");
                throw err;
            }
        }
        boardId = translator.getBoardIdByName(options.boardName);

        // Build up arguments to send
        var params = {
            "name": options.listName,
            "idBoard": boardId,
            "pos" : ['top', 'bottom'].indexOf(options.listPosition) > -1 ? options.listPosition : "top"
        };

        if (options.verbose) {
            logger.info("Sending the following to Trello at /1/lists: ");
            logger.info(params);
        }

        trello.post("/1/lists", params, function (err, data) {
            if (err) {
                throw err;
            }

            if (options.verbose) {
                logger.info("Result from Trello: ");
                logger.info(data);
            }

            if (data == "invalid value for name") {
                logger.error("Invalid value for list name");
            } else if (data == "Rate limit reached") {
                logger.error("Error: rate limited reached");
            } else {
                logger.info("List added, new ID: " + data.id);
            }

            if (options.refreshCache) {
                trelloApiCommands["refresh"].makeTrelloApiCall(null, onComplete);
            } else {
                if (typeof onComplete == 'function') {
                    onComplete();
                }
            }
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
                "listPosition": {
                      abbr: 'p',
                      metavar: 'LISTPOS',
                      help: "The position of the new list: acceptable values are 'top' or 'bottom' (default: top)",
                      required: false
                },
                "force": {
                      abbr: 'f',
                      help: "Force - will create the board if it doesn't already exist",
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
