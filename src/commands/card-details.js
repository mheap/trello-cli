"use strict";

fs = require("fs");

var _ = require("underscore");

var __ = function(program, output, logger, config, trello, translator, trelloApiCommands) {
    logger.info("Showing lists belonging to the specified board");

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
        logger.info("Showing details about the specified card");

        var cardId = options.cardId.replace(/[https:\/\/|http:\/\/]*trello.com\/c\//gi, "");

        trello.get("/1/cards/" + cardId + "", {
            "fields": "all",
            "member_fields": "all"
        }, function(err, data) {
            if (err) throw err;

            var name = translator.getList(data.idList) + " > " + data.name;
            if (data.closed == true) {
                output.bold(name.red);
                output.bold("This card is archived.".red);
            } else {
                output.bold(name);
            }
            if (data.labels.length > 0) {
                var x = [];
                data.labels.forEach(function(e) {
                    var c = "";
                    switch (e.color) {
                        case 'purple':
                        case 'pink':
                            c = 'magenta';
                            break;
                        case 'sky':
                        case 'lime':
                            c = 'cyan';
                            break;
                        case 'orange':
                            c = 'yellow';
                            break;
                        default:
                            c = e.color;
                            break;
                    }
                    if (c && output.hasOwnProperty(c)) x.push(e.name[c])
                    else x.push(e.name)
                });
                output.normal("Labels: " + x.join(", "));
            }
            if (data.due != null) output.normal("Due " + data.due);
            output.italic("\n" + data.desc + "\n");

            output.normal(data); // Temporary until command finished
        });
    }

    trelloApiCommand.nomnomProgramCall = function() {
        program
            .command("card-details")
            .help("Show details about a specified card")
            .options({
                "cardId": {
                    position: 1,
                    help: "The short URL or ID of the card to display information about",
                    required: true
                }
            })
            .callback(function(options) {
                trelloApiCommand.makeTrelloApiCall(options);
            });
    }

    return trelloApiCommand;
}
module.exports = __;