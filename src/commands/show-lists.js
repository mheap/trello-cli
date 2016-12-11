"use strict";

var _ = require("underscore");

var __ = function (program, output, logger, config, trello, translator, trelloApiCommands) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {

        // Grab our boards etc
        if (options.board) {
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
        }

        var listOfLists = [];

        _.each(translator.cache.translations.lists, function (oneList, listId) {
            if (listId != "undefined" && oneList.length == 2 && options.board ? oneList[0] == boardId : true) {
                // oneList: [ boardId, listName ]
                listOfLists.splice(
                    _.sortedIndex(listOfLists, { id : listId, name : oneList[1] }, 'name'),
                    0,
                    { id : listId, name : oneList[1] });
            }
        });

        _.each(listOfLists, function printBoardObject(list) {
            output.normal(list.name + (options.hideIds ? "" : (" (ID: " + list.id + ")")));
        });
    };


    trelloApiCommand.nomnomProgramCall = function () {
        program
            .command("show-lists")
            .help("Show the list of cached lists")
            .options({
                "board": {
                    abbr: 'b',
                    metavar: 'BOARD',
                    help: "The board name which contains the list of lists to show",
                    required: false
                },
                // "includeClosed": {
                //       abbr: 'c',
                //       help: "Include closed lists in the list (default: no)",
                //       required: false,
                //       flag: true,
                //       default: false
                // },
                "hideIds": {
                      abbr: 'i',
                      help: "Do not include the list IDs in the output (default is to print IDs)",
                      required: false,
                      flag: true,
                      default: false
                }
            })
            .callback(function (options) {
                trelloApiCommand.makeTrelloApiCall(options);
            });
    };

    return trelloApiCommand;
}

module.exports = __;
