"use strict";

var __ = function (
    program,
    output,
    logger,
    config,
    trello,
    translator,
    trelloApiCommands
) {
    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {
        const card_re = /(?:(?:https?:\/\/)?(?:www\.)?trello\.com\/c\/)?([a-z0-9]+)\/?.*/i
        const board_re = /(?:(?:https?:\/\/)?(?:www\.)?trello\.com\/b\/)?([a-z0-9]+)\/?.*/i

        var cardId = card_re.test(options.card) ? card_re.exec(options.card)[1] : null
        var boardId = options.board && board_re.test(options.board) ? board_re.exec(options.board)[1] : null;

        var pos = options.pos || (
            /^\d+$/.test(options.board) ? (function() {boardId = null; return options.board})() : null
        );

        var posFunc = pos ? position => {
            trello.put(
                `/1/cards/${cardId}/pos`,
                { value: position },
                function (err, data) {
                    if (err) {
                        console.error(err, data)
                    } else {
                        console.log("Card moved to position", position)
                    }
                }
            )
        } : null

        if (!cardId) {
            console.error("Could not parse card ID, example: https://trello.com/c/<ID> or <ID>")
            return
        }

        trello.put(
            `/1/cards/${cardId}/` + (
                boardId == null ? `idList` : `idBoard`
            ),
            boardId == null ?
                { value: options.list } : { value: boardId, idList: options.list },
            function (err, data) {
                if (err) {
                    console.error(err, data)
                } else {
                    console.log("Card moved")
                    if (posFunc) {
                        console.log("Positioning card...")
                        posFunc(pos)
                    }
                }
            }
        )
    };

    trelloApiCommand.nomnomProgramCall = function () {
        program
            .command("move-card")
            .help("Move a card on a board")
            .options({
                card: {
                    position: 1,
                    abbr: "c",
                    metavar: "<card>",
                    help: "The card's name/id/url to move",
                    required: true
                },
                list: {
                    position: 2,
                    abbr: "l",
                    metavar: "<list>",
                    help: "The list name/id to move the card to",
                    required: true
                },
                board: {
                    position: 3,
                    abbr: "b",
                    metavar: "<board>",
                    help: "The board name/id/url to move the card to (only needed if the list is in another board)",
                    required: false
                },
                pos: {
                    position: 4,
                    abbr: "p",
                    metavar: "<pos>",
                    help: "Position of the new card",
                    required: false
                },

            })
            .callback(function (options) {
                if (!options.list || !options.card) return
                trelloApiCommand.makeTrelloApiCall(options);
            });
    };

    return trelloApiCommand;
};
module.exports = __;

/*
t = new (require("node-trello"))('3cd7455f8b88607731a90f97dc930711', 'cd4a22ce26cbc4823bbc3464ab33aed7dd884550126130a95f8035490a676c7b')

cardID = "O65rVwqU"
listID = "586f08eab972b268b954866f"

orginal = "584cb8faba4fd097d57d7c6d"
"5848c8a36d1498b43b66df6d"

t.put(
  `/1/cards/${cardID}/idList`,
  {
    value: listID
  },
  function (err, data) {
    if (err) {
      throw err;
    }
    console.log(data)
  }
)
 */