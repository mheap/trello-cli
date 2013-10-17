fs = require("fs");

var __ = function(program, output, logger, config, trello, translator){

  program
  .command("show-list")
  .options({
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
    }
  })
  .help("Show cards on a list")
  .callback(function(opts){

    logger.info("Showing assigned cards");

    // Grab our boards etc
    var boardId = translator.getBoardIdByName(opts.board);
    var listId = translator.getListIdByBoardNameAndListName(opts.board, opts.list);

    trello.get("/1/lists/" + listId + "", {"cards": "open"}, function(err, data) {
      if (err) throw err;

      // Order the issues by board
      var cards = {};
      for (var i in data.cards){
        var item = data.cards[i];
        cards[item.idBoard] = cards[item.idBoard] || [];
        cards[item.idBoard].push(item.name.replace(/\n/g, ""));
      }

      for (var j in cards){
        output.normal(translator.getBoard(j).underline);
        for (var k in cards[j]){
          output.normal("* " + cards[j][k]);
        }
      }});
  });
}
module.exports = __;
