fs = require("fs");

var __ = function(program, output, logger, config, trello, translator) {
  program
    .command("assigned-to")
    .help("Show cards that are currently assigned to any member specified")
    .options({
        id: {
          position: 1,
          help: "Specifies user to show assigned cards for. (id/username/\"me\")",
          list: false,
          required: true
        }
      })
    .callback(function(options) {
      if (!options.id) return
      logger.info(`Showing assigned cards to ${options.id}`);
      trello.get(`/1/members/${options.id}/cards`, function(err, data) {
        if (err) {
          throw err;
        }

        // Order the issues by board
        var cards = {};
        for (var i in data) {
          var item = data[i];
          cards[item.idBoard] = cards[item.idBoard] || [];
          cards[item.idBoard].push(item.name.replace(/\n/g, ""));
        }

        for (var j in cards) {
          output.normal("\n"+translator.getBoard(j).underline);
          for (var k in cards[j]) {
            output.normal("* " + cards[j][k]);
          }
        }
      });
    });
};
module.exports = __;
