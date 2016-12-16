"use strict";

var _ = require("underscore"),
    async = require("async"),
    fs = require("fs");

var ___ = function(program, output, logger, config, trello, translator) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
        // console.log("refresh API call entered...");
        translator.reloadTranslations("all", onComplete);
    };

    trelloApiCommand.nomnomProgramCall = function() {

        program
            .command("refresh")
            .help("Refresh all your board/list names")
            .callback(function(options) {
                trelloApiCommand.makeTrelloApiCall(options);
            });
    };

    return trelloApiCommand;
};

module.exports = ___;