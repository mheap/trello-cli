fs = require("fs");

var __ = function(program, output, logger, config, trello, translator) {
  program
    .command("assigned-to-me")
    .help("Show cards that are currently assigned to you")
    .callback(function() {
      logger.info("Showing assigned cards");
      trello.get("/1/members/me/cards", function(err, data) {
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
          output.underline(translator.getBoard(j));
          for (var k in cards[j]) {
            output.normal("* " + cards[j][k]);
          }
        }
      });
    });
};
module.exports = __;
