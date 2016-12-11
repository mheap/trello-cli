"use strict";

var _ = require("underscore"),
    async = require("async"),
    fs = require("fs");

var ___ = function(program, output, logger, config, trello, translator) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
        // console.log("refresh API call entered...");

        var type = "all";

        var cachePath = config.get("configPath") + config.get("translationCache");
        var cacheFile = {};
        try {
            cacheFile = JSON.parse(fs.readFileSync(cachePath));
        } catch (e) {
            // Nothing!
        }

        cacheFile.formatVersion = 2;

        cacheFile.translations = cacheFile.translations || {};
        cacheFile.translations.orgs = cacheFile.translations.orgs || {};
        cacheFile.translations.boards = cacheFile.translations.boards || {};
        cacheFile.translations.lists = cacheFile.translations.lists || {};

        if (type == 'orgs' || type == 'all') {
            trello.get("/1/members/me/organizations", function(err, data) {
                if (err) throw err;
                _.each(data, function(item) {
                    cacheFile.translations.orgs[item.id] = {
                        "name": item.name,
                        "displayName": item.displayName
                    };
                });

                // Write it back to the cache file
                fs.writeFileSync(cachePath, JSON.stringify(cacheFile));
            });
        }

        if (type == 'lists' || type == 'boards' || type == 'all') {
            trello.get("/1/members/me/boards", function(err, data) {
                if (err) throw err;
                _.each(data, function(item) {
                    cacheFile.translations.boards[item.id] = {
                        "organization": item.idOrganization,
                        "name": item.name,
                        "closed": item.closed,
                        "voting": item.powerUps.indexOf("voting") > -1
                    };
                });

                // Write it back to the cache file
                fs.writeFileSync(cachePath, JSON.stringify(cacheFile));

                if (type == 'lists' || type == 'all') {
                    async.each(
                        Object.keys(cacheFile.translations.boards),
                        function(board, callback) {
                            // console.log("trello.get(" + "/1/boards/" + board + "/lists)");
                            trello.get("/1/boards/" + board + "/lists", function(err, data) {
                                if (err) {
                                    throw err;
                                }
                                _.each(data, function(item) {
                                    cacheFile.translations.lists[item.id] = {
                                        "board": item.idBoard,
                                        "name": item.name
                                    };
                                });
                                callback();
                            });
                        }.bind(this),
                        function(err) {
                            // console.log("done with fetching list for all boards");
                            // Write it back to the cache file
                            fs.writeFileSync(cachePath, JSON.stringify(cacheFile));

                            translator.reloadTranslations();

                            output.normal("Organization, board and list cache refreshed");

                            if (typeof onComplete == 'function') {
                                onComplete();
                            }
                        });

                    // console.log("end of if statement inside boards loop");
                }
            });
        }

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