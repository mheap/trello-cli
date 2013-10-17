var List = require('term-list');

var __ = function(program, output, logger, config, trello, translator){

  program
  .command("delete-card")
  .help("Remove a card from a board")
  .options({
    "title": {
      position: 1,
      help: "The card's title",
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
    logger.info("Adding card");

    // Grab our boards etc
    var boardId = translator.getBoardIdByName(opts.board);
    var listId = translator.getListIdByBoardNameAndListName(opts.board, opts.list);

    // Get a list of cards on a board
    trello.get("/1/boards/"+boardId+"/cards/visible", function(err, data){

      if (err){ throw err; }
      if (data.indexOf("Trello is down") !== -1){
        logger.error("Trello is currently unavailable");
        process.exit(1);
      }

      var foundCards = [];
      for (var i in data){
        var card = data[i];

        if (card.name == opts.title || !opts.title){
          foundCards.push(card);
        }
      }

      if (foundCards.length > 1){
        var list = new List({ marker: ('›'.red) + " ", markerLength: 1 });
        foundCards.forEach(function(card){
          var content = card.name;
          if (card.desc){
            content += " ["+card.desc+"]";
          }
          list.add(card.id, content);
        });

        list.on('keypress', function(key, item){
          switch (key.name) {
            case 'return':
              list.stop();
              deleteCard(item);
          }
        });

        list.start();
      } else if (foundCards.length == 1){
        var card = foundCards[0];
        if (opts.title){
          deleteCard(card.id);
        } else {
          var list = new List({ marker: ('›'.red) + " ", markerLength: 1 });
          list.add(card.id, card.name);
          list.add(null, "Cancel");
          list.on('keypress', function(key, item){
            switch (key.name) {
              case 'return':
                list.stop();
                deleteCard(item);
            }
          });
          list.start();
        }
      } else {
        logger.warning("That card does not exist");
      }

    });

  });

  function deleteCard(id){
    if (!id){
      return;
    }
    trello.del("/1/cards/"+id, function(err, data){
      if (err){ throw err; }
      logger.info("Card deleted");
    });
  }

}
module.exports = __;

