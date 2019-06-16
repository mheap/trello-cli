var _ = require("underscore"),
  async = require("async"),
  fs = require("fs"),
  output = require("../lib/output"),
  Bottleneck = require("bottleneck");

var Translator = function(logger, config, trello) {
  this.loadCount = 1;
  this.logger = logger;
  this.config = config;
  this.trello = trello;
  this.formatVersionNeeded = 1;

  // Load the cache file
  var cachePath = config.get("configPath") + config.get("translationCache");
  var cacheFile = {};
  try {
    cacheFile = JSON.parse(fs.readFileSync(cachePath));
  } catch (e) {
    // Nothing
  }

  cacheFile.formatVersion = cacheFile.formatVersion || -1;

  cacheFile.translations = cacheFile.translations || {};
  cacheFile.translations.orgs = cacheFile.translations.orgs || {};
  cacheFile.translations.boards = cacheFile.translations.boards || {};
  cacheFile.translations.lists = cacheFile.translations.lists || {};
  cacheFile.translations.users = cacheFile.translations.users || {};
  cacheFile.translations.me = cacheFile.translations.me || {};

  this.cache = cacheFile;
};

Translator.prototype.checkCompatibleCache = function() {
  return this.cache.formatVersion == this.formatVersionNeeded;
};

Translator.prototype.reloadTranslations = function(type, onComplete) {
  if (type == undefined) {
    type = "all";
  }

  var cachePath =
    this.config.get("configPath") + this.config.get("translationCache");
  var cacheFile = {};
  try {
    cacheFile = JSON.parse(fs.readFileSync(cachePath));
  } catch (e) {
    // Nothing!
  }

  if (!this.checkCompatibleCache()) {
    cacheFile.translations = {
      orgs: {},
      boards: {},
      lists: {},
      users: {},
      me: {}
    };
  }

  cacheFile.formatVersion = this.formatVersionNeeded;

  cacheFile.translations = cacheFile.translations || {};
  cacheFile.translations.orgs = cacheFile.translations.orgs || {};
  cacheFile.translations.boards = cacheFile.translations.boards || {};
  cacheFile.translations.lists = cacheFile.translations.lists || {};
  cacheFile.translations.users = cacheFile.translations.users || {};
  cacheFile.translations.me = cacheFile.translations.me || {};

  trello = this.trello;

  if (type == "users" || type == "all") {
    this.logger.debug("Syncing members");
    getThrottled("/1/members/me", function(err, user) {
      if (err) {
        throw err;
      }
      cacheFile.translations.me = {
        id: user.id,
        name: user.fullName,
        username: user.username,
        initials: user.initials,
        type: user.memberType
      };

      // Write it back to the cache file
      fs.writeFileSync(cachePath, JSON.stringify(cacheFile));
    });
  }

  function cacheUserInfoFromMemberships(
    cacheType,
    id,
    name,
    memberships,
    logger
  ) {
    logger.debug(
      "Syncing memberships (" +
        cacheType +
        " :: " +
        id +
        " :: " +
        name +
        ") [" +
        memberships.length +
        "] (this may take a while)"
    );
    getThrottled(
      "/1/" +
        cacheType +
        "/" +
        id +
        "/members?fields=fullName,username,initials,memberType",
      function(err, users) {
        users.forEach(function(user) {
          cacheFile.translations.users[user.id] = {
            name: user.fullName,
            username: user.username,
            initials: user.initials,
            type: user.memberType
          };
        });

        // Write it back to the cache file
        fs.writeFileSync(cachePath, JSON.stringify(cacheFile));
      }
    );
  }

  if (type == "orgs" || type == "users" || type == "all") {
    this.logger.debug("Syncing organizations");
    getThrottled(
      "/1/members/me/organizations",
      function(err, data) {
        if (err) {
          throw err;
        }
        _.each(
          data,
          function(item) {
            if (type == "orgs" || type == "all") {
              cacheFile.translations.orgs[item.id] = {
                name: item.name,
                displayName: item.displayName
              };
            }

            cacheUserInfoFromMemberships(
              "organizations",
              item.id,
              item.name,
              item.memberships,
              this.logger
            );
          }.bind(this)
        );

        // Write it back to the cache file
        fs.writeFileSync(cachePath, JSON.stringify(cacheFile));
      }.bind(this)
    );
  }

  if (type == "lists" || type == "boards" || type == "users" || type == "all") {
    this.logger.debug("Syncing boards");
    getThrottled(
      "/1/members/me/boards",
      function(err, data) {
        if (err) {
          throw err;
        }
        _.each(
          data,
          function(item) {
            if (type == "lists" || type == "boards" || type == "all") {
              var powerups = item.powerUps || [];
              cacheFile.translations.boards[item.id] = {
                organization: item.idOrganization,
                name: item.name,
                closed: item.closed,
                voting: powerups.indexOf("voting") > -1
              };
            }

            cacheUserInfoFromMemberships(
              "boards",
              item.id,
              item.name,
              item.memberships,
              this.logger
            );
          }.bind(this)
        );

        // Write it back to the cache file
        fs.writeFileSync(cachePath, JSON.stringify(cacheFile));

        if (type == "lists" || type == "all") {
          this.logger.debug("Syncing lists");
          async.each(
            Object.keys(cacheFile.translations.boards),
            function(board, callback) {
              getThrottled("/1/boards/" + board + "/lists", function(
                err,
                data
              ) {
                if (err) {
                  throw err;
                }
                _.each(data, function(item) {
                  if (item.id) {
                    cacheFile.translations.lists[item.id] = {
                      board: item.idBoard,
                      name: item.name
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
              output.normal(
                "Organization, board, list, and user cache refreshed"
              );
              this.cache = cacheFile;
              this.loadCount++;

              if (typeof onComplete == "function") {
                onComplete();
              }
            }
          );

          // console.log("end of if statement inside boards loop");
        }
      }.bind(this)
    );
  }
};

Translator.prototype.getOrganization = function(id) {
  this.logger.debug("Looking up organization: " + id);
  var item = this.cache.translations.orgs[id];
  if (!item) {
    return undefined;
  }
  return item["displayName"] || "Org: " + id;
};

Translator.prototype.getBoard = function(id) {
  this.logger.debug("Looking up board: " + id);
  var item = this.cache.translations.boards[id];
  var str = "";
  if (item) {
    if (item["organization"]) {
      str += this.getOrganization(item["organization"]) + " > ";
    }
    str += item["name"];
  }
  return str || "Board: " + id;
};

Translator.prototype.getList = function(id) {
  this.logger.debug("Looking up list: " + id);
  var item = this.cache.translations.lists[id];
  var str = "";
  if (item) {
    if (item["board"]) {
      str += this.getBoard(item["board"]) + " > ";
    }
    str += item["name"];
  }
  return str || "List: " + id;
};

Translator.prototype.getUser = function(id) {
  this.logger.debug("Looking up user: " + id);
  if (this.cache.translations.me.id == id) {
    return this.cache.translations.me.name + " (you)";
  }
  var item = this.cache.translations.users[id];
  var str = "";
  if (item) {
    str += item["name"];
  }
  return str || "User: " + id;
};

Translator.prototype.getBoardIdByName = function(name) {
  // console.log("-- getBoardIdByName() boards length: " + Object.keys(this.cache.translations.boards).length);
  // console.log("-- getBoardIdByName() lists length: " + Object.keys(this.cache.translations.lists).length);
  name = name.toLowerCase();
  this.logger.debug("Looking up board by name: " + name);
  var boards = this.cache.translations.boards;
  for (var i in boards) {
    if (boards[i]["name"] != null && boards[i]["name"].toLowerCase() == name) {
      return i;
    }
  }

  throw new Error("Unknown Board");
};

Translator.prototype.getBoardsByName = function(name, comparer) {
  var matchingBoardIds = [];
  name = name.toLowerCase();
  this.logger.debug("Looking up boards by name: " + name);
  var boards = this.cache.translations.boards;
  for (var i in boards) {
    if (i != "undefined" && comparer(boards[i]["name"].toLowerCase(), name)) {
      matchingBoardIds.push({
        id: i,
        name: boards[i]["name"]
      });
    }
  }

  return matchingBoardIds;
};

Translator.prototype.getListIdByBoardNameAndListName = function(board, list) {
  var boardId = this.getBoardIdByName(board);

  list = list.toLowerCase();
  this.logger.debug("Looking up list by name: " + list);
  var lists = this.cache.translations.lists;
  for (var i in lists) {
    if (
      lists[i]["board"] == boardId &&
      lists[i]["name"].toLowerCase() == list
    ) {
      return i;
    }
  }

  throw new Error("Unknown List");
};

Translator.prototype.getUserIdByDisplayName = function(name) {
  name = name.toLowerCase();
  this.logger.debug("Looking up user by name: " + name);
  var user = this.cache.translations.user;
  for (var i in user) {
    if (user[i]["name"] != null && user[i]["name"].toLowerCase() == name) {
      return i;
    }
  }

  throw new Error("Unknown User");
};

Translator.prototype.getUserIdByUsername = function(name) {
  name = name.toLowerCase();
  this.logger.debug("Looking up user by username: " + name);
  var user = this.cache.translations.user;
  for (var i in user) {
    if (
      user[i]["username"] != null &&
      user[i]["username"].toLowerCase() == name
    ) {
      return i;
    }
  }

  throw new Error("Unknown User");
};

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100
});

function getThrottled(url, callback, opts) {
  opts = opts || {};
  limiter.schedule(opts, () => {
    return new Promise(resolve => {
      trello.get(url, function(err, data) {
        if (err && data.error == "RATE_LIMIT_EXCEEDED") {
          console.log("[10s wait] Rate Limit for " + url);
          return setTimeout(function() {
            getThrottled(url, callback, { priority: 0 });
            resolve();
          }, 10000);
        }

        //console.log("Success for " + url);
        callback(err, data);
        resolve();
      });
    });
  });
}

module.exports = function(logger, config, trello) {
  return new Translator(logger, config, trello);
};
