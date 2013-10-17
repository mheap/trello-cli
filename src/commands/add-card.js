fs = require("fs");

var __ = function(program, output, logger, config, trello, translator){

  program
  .command("add-card")
  .help("Add a card to a board")
  .options({
    "title": {
      position: 1,
      help: "The card's title",
      list: true,
      required: true
    },
    "description": {
      position: 2,
      help: "The card's description",
      list: true
    },
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
  .callback(function(opts){
    console.log(opts);
    logger.info("Adding card");

    if (!opts.title){
      logger.warning("Please provide a card title")
      return;
    }

    // Grab our boards etc
    var boardId = translator.getBoardIdByName(opts.board);
    var listId = translator.getListIdByBoardNameAndListName(opts.board, opts.list);

    // Build up arguments to send
    var params = {
      "name": opts.title,
      "idList": listId
    };

    // Did we have any additional params?
    if (opts.description){
      params.desc = opts.description;
    }

    trello.post("/1/cards", params, function(err, data){
      if (err){ throw err; }
      logger.info("Card created");
    });

  });
}
module.exports = __;
