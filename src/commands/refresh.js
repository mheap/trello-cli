"use strict";

var _ = require("underscore"),
  async = require("async"),
  fs = require("fs");

var ___ = function (program, output, logger, config, trello, translator) {
  var trelloApiCommand = {};

  trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {
    var type = options.type || "all";
    // console.log("refresh API call entered...");
    translator.reloadTranslations(type, onComplete);
  };

  trelloApiCommand.nomnomProgramCall = function () {
    program
      .command("refresh")
      .help("Refresh all your board/list names")
      .options({
        type: {
          position: 1,
          help: "Dataset to refresh (all, users, orgs, boards, lists - default 'all')",
          list: false,
          required: false,
        },
      })
      .callback(function (options) {
        options = options || {};
        trelloApiCommand.makeTrelloApiCall(options);
      });
  };

  return trelloApiCommand;
};

module.exports = ___;
