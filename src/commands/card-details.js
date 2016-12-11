"use strict";

fs = require("fs");

var _ = require("underscore");

var __ = function(program, output, logger, config, trello, translator, trelloApiCommands) {
    logger.info("Showing lists belonging to the specified board");

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {
        logger.info("Showing details about the specified card");

        var cardId = options.cardId.replace(/[https:\/\/|http:\/\/]*trello.com\/c\//gi, "");

        trello.get("/1/cards/" + cardId + "", {"fields": "all", "member_fields": "all"}, function(err, data) {
            if (err) throw err;

            output.normal(data);
        });
    }

    trelloApiCommand.nomnomProgramCall = function () {
        program
            .command("card-details")
            .help("Show details about a specified card")
            .options({
                "cardId": {
                    abbr: 'c',
                    metavar: 'CARD',
                    help: "The short URL or ID of the card to display information about",
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
