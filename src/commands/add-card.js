fs = require("fs");

var __ = function(program, output, logger, config, trello, translator){

  program
  .command("add-card")
  .description("Add a card")
  .option('-b, --board', 'Board to add the card to')
  .option('-l, --list', 'List to add the card to')
  .action(function(board, list){
    logger.info("Adding card");

    // I don't particularly like this, but it seems like the
    // only way to do it for now
    var cardTitle = program.args[0];

    if (!cardTitle){
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
