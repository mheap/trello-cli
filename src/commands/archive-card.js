"use strict";

var List = require('term-list');
  var prompt = require('prompt');

var __ = function(program, output, logger, config, trello, translator) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
        if (!options.match) {
            options.match = 'exact';
            logger.warning('--match parameter not specified, defaulting to exact title match');
        }
        logger.info("Adding card");

        // Grab our boards etc
        var boardId = translator.getBoardIdByName(options.board);
        var listId = translator.getListIdByBoardNameAndListName(options.board, options.list);

        // Get a list of cards on a board
        trello.get("/1/boards/" + boardId + "/cards/visible", function(err, data) {

            if (err) {
                throw err;
            }
            if (data.indexOf("Trello is down") !== -1) {
                logger.error("Trello is currently unavailable");
                process.exit(1);
            }

            var foundCards = [];
            for (var i in data) {
                var card = data[i];

                // We only want cards from the list we specified
                if (card.idList != listId) {
                    continue;
                }

                if (options.match == 'exact') {
                    if (card.name == options.title || !options.title){
                            foundCards.push(card);
                    }
                } else if (options.match == 'contains') {
                    if (card.name.includes(options.title)) {
                            foundCards.push(card);
                    }
                }
            }

            if (foundCards.length > 1 && options.match == 'exact') {
                var list = new List({
                    marker: ('›'.red) + " ",
                    markerLength: 1
                });
                foundCards.forEach(function(card) {
                    var content = card.name;
                    if (card.desc) {
                        content += " [" + card.desc + "]";
                    }
                    list.add(card, content);
                });
                list.add(null, "[Cancel]");

                list.on('keypress', function(key, item) {
                    switch (key.name) {
                        case 'return':
                            list.stop();
                            archiveCard(item);
                    }
                });

                list.start();
            } else if (foundCards.length > 1 && options.match == 'contains'){
                console.log("Matching cards:");
                foundCards.forEach(function(card){
                    console.log('- "' + card.name + '"');
                });

                prompt.start();
                var property = {
                    name: 'yesno',
                    message: 'Continue (y/n)?',
                    validator: /y[es]*|n[o]?/,
                    warning: 'Must respond y or n',
                    default: 'n'
                };

                prompt.get(property, function (err, result) {
                    logger.debug('Command-line input received:' + result.yesno);
                    if (result.yesno == 'n') {
                        console.log('Abort');
                    } else if (result.yesno == 'y') {
                        logger.debug('y');
                        foundCards.forEach(function(card) {
                            archiveCard(card);
                        });
                    }
                });

            } else if (foundCards.length == 1) {
                var card = foundCards[0];
                if (options.title) {
                    archiveCard(card);
                } else {
                    var list = new List({
                        marker: ('›'.red) + " ",
                        markerLength: 1
                    });
                    list.add(card, card.name);
                    list.add(null, "[Cancel]");
                    list.on('keypress', function(key, item) {
                        switch (key.name) {
                            case 'return':
                                list.stop();
                                archiveCard(item);
                        }
                    });
                    list.start();
                }
            } else {
                logger.warning("That card does not exist");
            }

        });

        function archiveCard(card){
            logger.debug('archiveCard:' + card.id);
            if (!card || !card.id){
                return;
            }
            trello.put("/1/cards/"+card.id+"/closed", {value: true}, function(err, data){
                if (err){ throw err; }
                logger.debug("Card archived: " + card.id + ":" + card.name);
            });
        }
    };

    trelloApiCommand.nomnomProgramCall = function() {
        program
            .command("archive-card")
            .help("Archive a card from a board")
            .options({
                "title": {
                    position: 1,
                    help: "The card's title",
                    list: true
                },
                "board": {
                    abbr: 'b',
                    metavar: 'BOARD',
                    help: "The board name to add a card to",
                    required: true
                },
                "list": {
                    abbr: 'l',
                    metavar: 'LIST',
                    help: "The list name to add a card to",
                    required: true
                },
                "match": {
                    abbr: 'm',
                    metavar: 'MATCH',
                    help: "[exact | contains] : how to match the title given",
                    required: false
                }
            })
            .callback(function(options) {
                trelloApiCommand.makeTrelloApiCall(options);
            });

    };

    return trelloApiCommand;
}

module.exports = __;
