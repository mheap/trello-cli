"use strict";

var List = require("term-list");
var prompt = require("prompt");

var __ = function(program, output, logger, config, trello, translator) {
  var trelloApiCommand = {};

  trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
    logger.info("Archiving card");

    // Grab our boards etc
    var boardId = translator.getBoardIdByName(options.board);
    var listId = translator.getListIdByBoardNameAndListName(
      options.board,
      options.list
    );

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

        //if no title provided, then add every card OR
        //if (title provided and) options=exact and card name = title value
        if (!options.title) {
          foundCards.push(card);
        } else if (
          (!options.match || options.match == "exact") &&
          card.name == options.title
        ) {
          foundCards.push(card);
        } else if (
          options.match == "contains" &&
          card.name.includes(options.title)
        ) {
          foundCards.push(card);
        }
      }

      if (
        foundCards.length > 1 &&
        (!options.match || options.match == "exact")
      ) {
        promptListSelection(foundCards);
      } else if (foundCards.length > 1 && options.match == "contains") {
        if (options.force) {
          foundCards.forEach(card => archiveCard(card));
          return;
        } else {
          console.log("Matching cards:");
          foundCards.forEach(function(card) {
            console.log(' "' + card.name + '"');
          });
          promptConfirmation()
            .then(function() {
              foundCards.forEach(card => archiveCard(card));
            })
            .catch(function(err) {
              logger.warning(err);
            });
        }
      } else if (foundCards.length == 1) {
        var card = foundCards[0];
        if (options.title || options.force) {
          archiveCard(foundCards[0]);
        } else {
          //when would this else happen?
          //no title was provided, and the list has only one card
          // why would we even prompt the user if it's just one card? (same happens in other functions, eg delete-card)
          promptListSelection(foundCards);
        }
      } else {
        logger.warning("That card does not exist");
      }

      function promptConfirmation() {
        return new Promise((resolve, reject) => {
          prompt.start();
          var property = {
            name: "yesno",
            message: "Continue (y/n)?",
            validator: /y[es]*|n[o]?/,
            warning: "Must respond y or n",
            default: "n"
          };

          prompt.get(property, function(err, result) {
            logger.debug("Command-line input received:" + result.yesno);
            if (result.yesno == "n") {
              reject("Abort");
            } else if (result.yesno == "y") {
              logger.debug("y");
              resolve();
            }
          });
        });
      }

      function promptListSelection(cardList) {
        if (options.force) {
          cardList.forEach(function(card) {
            archiveCard(card);
          });
          return;
        }

        var list = new List({
          marker: "›".red + " ",
          markerLength: 1
        });
        cardList.forEach(function(card) {
          var content = card.name;
          if (card.desc) {
            content += " [" + card.desc + "]";
          }
          list.add(card, content);
        });
        list.add(null, "[Cancel]");

        list.on("keypress", function(key, item) {
          switch (key.name) {
            case "return":
              list.stop();
              //if user selects 'Cancel' , item=null
              if (item) {
                archiveCard(item);
              }
              break;
          }
        });

        list.start();
      }
    });

    function archiveCard(card) {
      logger.debug("archiveCard:" + card.id);
      if (!card || !card.id) {
        return;
      }
      trello.put("/1/cards/" + card.id + "/closed", { value: true }, function(
        err,
        data
      ) {
        if (err) {
          throw err;
        }
        logger.debug("Card archived: " + card.id + ":" + card.name);
      });
    }
  };

  trelloApiCommand.nomnomProgramCall = function() {
    program
      .command("archive-card")
      .help("Archive a card from a board")
      .options({
        title: {
          position: 1,
          help: "The card's title. If omitted, implies all cards found",
          list: true
        },
        board: {
          abbr: "b",
          metavar: "BOARD",
          help: "The board name to add a card to",
          required: true
        },
        list: {
          abbr: "l",
          metavar: "LIST",
          help: "The list name to add a card to",
          required: true
        },
        match: {
          abbr: "m",
          metavar: "MATCH",
          help: "[exact | contains] : how to match the title given",
          required: false
        },
        force: {
          abbr: "f",
          flag: true,
          help: "Do not prompt user"
        }
      })
      .callback(function(options) {
        trelloApiCommand.makeTrelloApiCall(options);
      });
  };

  return trelloApiCommand;
};

module.exports = __;
