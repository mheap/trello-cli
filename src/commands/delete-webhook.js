fs = require("fs");

var __ = function (program, output, logger, config, trello, translator) {
  var trelloApiCommand = {};

  trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {
    logger.info("Removing a webhook");
    trello.del("/1/webhooks/" + options.id, function (err, data) {
      if (err) {
        throw err;
      }
      output.normal(JSON.stringify(data));
    });
  };

  trelloApiCommand.nomnomProgramCall = function () {
    program
      .command("delete-webhook")
      .options({
        id: {
          abbr: "i",
          metavar: "WEBHOOK_ID",
          help: "The webhook's ID",
          list: false,
          required: true,
        },
      })
      .help("Remove a webhook by ID")
      .callback(function (options) {
        trelloApiCommand.makeTrelloApiCall(options);
      });
  };

  return trelloApiCommand;
};

module.exports = __;
