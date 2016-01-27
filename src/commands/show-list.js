"use strict";

var __ = function(program, output, logger, config, trello, translator, trelloApiCommands) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {

        trelloApiCommands["show-cards"].makeTrelloApiCall(options, onComplete);

    }

    trelloApiCommand.nomnomProgramCall = function () {
        program
            .command("show-list")
            .help("DEPRECATED.  Show cards on a list (use 'show-cards' instead; command retained for backwards compatibility)")
            .options({
                "board": {
                    abbr: 'b',
                    metavar: 'BOARD',
                    help: "The board name which contains the list to show",
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
