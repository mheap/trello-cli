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

        if (cacheFile.formatVersion != translator.formatVersionNeeded) cacheFile.translations = {
            "orgs": {},
            "boards": {},
            "lists": {},
            "users": {},
            "me": {}
        };

        cacheFile.formatVersion = translator.formatVersionNeeded;

        cacheFile.translations = cacheFile.translations || {};
        cacheFile.translations.orgs = cacheFile.translations.orgs || {};
        cacheFile.translations.boards = cacheFile.translations.boards || {};
        cacheFile.translations.lists = cacheFile.translations.lists || {};
        cacheFile.translations.users = cacheFile.translations.users || {};
        cacheFile.translations.me = cacheFile.translations.me || {};

        if (type == 'users' || type == 'all') {
            trello.get("/1/members/me", function(err, user) {
                if (err) throw err;
                cacheFile.translations.me = {
                    "id": user.id,
                    "name": user.fullName,
                    "username": user.username,
                    "initials": user.initials,
                    "type": user.memberType
                }

                // Write it back to the cache file
                fs.writeFileSync(cachePath, JSON.stringify(cacheFile));
            });
        }

        function cacheUserInfoFromMemberships(memberships) {
            if (type == 'users' || type == 'all') {
                _.each(memberships, function(m) {
                    trello.get("/1/members/" + m.idMember, function(err, user) {
                        if (err) throw err;

                        if (user.id && !(user.id in cacheFile.translations.users.hasOwnProperty)) {
                            cacheFile.translations.users[user.id] = {
                                "name": user.fullName,
                                "username": user.username,
                                "initials": user.initials,
                                "type": user.memberType
                            }

                            // Write it back to the cache file
                            fs.writeFileSync(cachePath, JSON.stringify(cacheFile));
                        }
                    });
                })
            }
        }

        if (type == 'orgs' || type == 'users' || type == 'all') {
            trello.get("/1/members/me/organizations", function(err, data) {
                if (err) throw err;
                _.each(data, function(item) {
                    if (type == 'orgs' || type == 'all') {
                        cacheFile.translations.orgs[item.id] = {
                            "name": item.name,
                            "displayName": item.displayName
                        };
                    }

                    cacheUserInfoFromMemberships(item.memberships);
                });

                // Write it back to the cache file
                fs.writeFileSync(cachePath, JSON.stringify(cacheFile));
            });
        }

        if (type == 'lists' || type == 'boards' || type == 'users' || type == 'all') {
            trello.get("/1/members/me/boards", function(err, data) {
                if (err) throw err;
                _.each(data, function(item) {
                    if (type == 'lists' || type == 'boards' || type == 'all') {
                        cacheFile.translations.boards[item.id] = {
                            "organization": item.idOrganization,
                            "name": item.name,
                            "closed": item.closed,
                            "voting": item.powerUps.indexOf("voting") > -1
                        };
                    }

                    cacheUserInfoFromMemberships(item.memberships);
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
                                    if (item.id) {
                                        cacheFile.translations.lists[item.id] = {
                                            "board": item.idBoard,
                                            "name": item.name
                                        };
                                    }
                                });
                                callback();
                            });
                        }.bind(this),
                        function(err) {
                            // console.log("done with fetching list for all boards");
                            // Write it back to the cache file
                            fs.writeFileSync(cachePath, JSON.stringify(cacheFile));

                            translator.reloadTranslations();

                            output.normal("Organization, board, list, and user cache refreshed");

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