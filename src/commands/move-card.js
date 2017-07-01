"use strict";

var __ = function(program, output, logger, config, trello, translator) {
  var trelloApiCommand = {};

  trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
    const card_re = /(?:(?:https?:\/\/)?(?:www\.)?trello\.com\/c\/)?([a-z0-9]+)\/?.*/i;
    const board_re = /(?:(?:https?:\/\/)?(?:www\.)?trello\.com\/b\/)?([a-z0-9]+)\/?.*/i;

    var cardId = card_re.test(options.card)
      ? card_re.exec(options.card)[1]
      : null;
    var boardId =
      options.board && board_re.test(options.board)
        ? board_re.exec(options.board)[1]
        : null;

    var pos =
      options.pos ||
      (/^\d+$/.test(options.board)
        ? (function() {
            boardId = null;
            return options.board;
          })()
        : null);

    var posFunc = pos
      ? position => {
          trello.put(
            "/1/cards/" + cardId + "/pos",
            { value: position },
            function(err, data) {
              if (err) {
                console.error(err, data);
              } else {
                console.log("Card moved to position", position);
              }
            }
          );
        }
      : null;

    if (!cardId) {
      console.error(
        "Could not parse card ID, example: https://trello.com/c/<ID> or <ID>"
      );
      return;
    }

    trello.put(
      "/1/cards/" + cardId + "/" + (boardId == null ? "idList" : "idBoard"),
      boardId == null
        ? { value: options.list }
        : { value: boardId, idList: options.list },
      function(err, data) {
        if (err) {
          console.error(err, data);
        } else {
          console.log("Card moved");
          if (posFunc) {
            console.log("Positioning card...");
            posFunc(pos);
          }
        }
      }
    );
  };

  trelloApiCommand.nomnomProgramCall = function() {
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
          help:
            "The board name/id/url to move the card to (if the list is in another board)",
          required: false
        },
        pos: {
          position: 4,
          abbr: "p",
          metavar: "<pos>",
          help: "Position of the new card",
          required: false
        }
      })
      .callback(function(options) {
        trelloApiCommand.makeTrelloApiCall(options);
      });
  };

  return trelloApiCommand;
};
module.exports = __;
