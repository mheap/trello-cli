"use strict";

var __ = function (program, output, logger, config, trello, translator, trelloApiCommands) {

  program
  .command("add-board")
  .help("Adds a new board with the specified name")
  .options({
    "boardName": {
      abbr: 'b',
      metavar: 'BOARD',
      help: "The name of the new board",
      required: true
    },
    "description": {
      abbr: 'd',
      metavar: 'DESC',
      help: "The description of the board",
      required: false
    },
    "cardAging": {
      abbr: 'a',
      help: "Turns card aging on for the new board (default is off)",
      required: false,
      flag: true
    },
    "cardCoverImages": {
      abbr: 'c',
      help: "Turns off the showing of images on the front of cards (default is on)",
      required: false,
      flag: true
    },
    "verbose": {
      abbr: 'v',
      help: "Turn on increased error reporting",
      required: false,
      flag: true
    }
  })
  .callback(function (opts) {
    logger.info("Adding new board");

    // Build up arguments to send
    var params = {
      "name": opts.boardName,
      "desc": opts.description,
      "prefs_cardCovers" : opts.cardCoverImages ? "false" : "true",
      "prefs_cardAging" : opts.cardAging ? "pirate" : "regular"
    };

    trello.post("/1/boards", params, function (err, data) {
      if (err) {
        throw err;
      }

      logger.info("Board added, new URL: " + data.url);

      trelloApiCommands["refresh"].makeTrelloApiCall(null);
    });

  });
}
module.exports = __;
