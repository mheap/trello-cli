var __ = function(program, output, logger, config, trello, translator) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
        logger.info("Moving cards");

        // Grab our boards etc
        var sourceListId, destinationBoardId, destinationListId;

        try {
            sourceListId = translator.getListIdByBoardNameAndListName(options.sourceBoard, options.sourceList);
            destinationBoardId = translator.getBoardIdByName(options.destinationBoard);
            destinationListId = translator.getListIdByBoardNameAndListName(options.destinationBoard, options.destinationList);
        } catch (err) {
            logger.error(err.message + " (try refreshing the cache with 'refresh' command, or check spelling).");
            if (!options.verbose) {
                process.exit(1);
            } else {
                throw err;
            }
        }

        // Build up arguments to send
        var params = {
            "idBoard": destinationBoardId,
            "idList": destinationListId
        };

        trello.post("/1/lists/" + sourceListId + "/moveAllCards", params, function(err, data) {
            if (err) {
                throw err;
            }
            logger.info(data.length + (data.length == 1 ? " card moved" : " cards moved"));
        });
    }

    trelloApiCommand.nomnomProgramCall = function() {
        program
            .command("move-all-cards")
            .help("Move all cards from one list to another")
            .options({
                "sourceBoard": {
                    abbr: 'b',
                    metavar: 'BOARD',
                    help: "The board containing the list to move",
                    required: true
                },
                "sourceList": {
                    abbr: 'l',
                    metavar: 'LIST',
                    help: "The list containing the cards to move",
                    required: true
                },
                "destinationBoard": {
                    abbr: 'c',
                    metavar: 'BOARD',
                    help: "The destination board",
                    required: true
                },
                "destinationList": {
                    abbr: 'd',
                    metavar: 'LIST',
                    help: "The destination list",
                    required: true
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