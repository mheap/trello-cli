fs = require("fs");

var __ = function(program, output, logger, config, trello, translator){

  program
  .command("add-card")
  .help("Add a card to a board")
  .options({
    "title": {
      position: 0,
      help: "The card's title",
      list: true
    },
    "board": {
      abbr: 'b',
      metavar: 'BOARD',
      help: "The board name to add a card to"
    },
    "list": {
      abbr: 'l',
      metavar: 'LIST',
      help: "The list name to add a card to"
    }
  })
  .callback(function(board, list){
    logger.info("Adding card");

    if (!program.title){
      logger.warning("Please provide a card title")
      return;
    }

    // Grab our boards etc
    var boardId = translator.getBoardIdByName(board);
    var listId = translator.getListIdByBoardNameAndListName(board, list);

    trello.post("/1/cards", {
      "name": cardTitle,
      "idList": listId
    }, function(err, data){
      if (err){ throw err; }
      logger.info("Card created");
    });

  });
}
module.exports = __;
