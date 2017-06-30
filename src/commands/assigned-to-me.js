fs = require("fs");

var __ = function (program, output, logger, config, trello, translator) {
  program
    .command("assigned-to-me")
    .help("Show cards that are currently assigned to any member specified")
    .options({
      id: {
        position: 1,
        help: "Specifies user to show assigned cards for. (id/username/\"me\")"
      }
    })
    .callback(function (options) {
      id = options.id || "me"
      logger.info(`Showing assigned cards to ${id}`);
      trello.get(`/1/members/${id}/cards`, function (err, data) {
        if (err) {
          console.error(err);
          return
        }

        // Order the issues by board
        var cards = {};
        for (var i in data) {
          var item = data[i];
          cards[item.idBoard] = cards[item.idBoard] || [];
          cards[item.idBoard].push(item.name.replace(/\n/g, ""));
        }

        for (var j in cards) {
          output.normal("\n" + translator.getBoard(j).underline);
          for (var k in cards[j]) {
            output.normal("* " + cards[j][k]);
          }
        }
      });
    });
};
module.exports = __;
