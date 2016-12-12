var fs = require("fs");

var Translator = function(logger, config) {

    this.loadCount = 1;
    this.logger = logger;
    this.config = config;
    this.formatVersionNeeded = 1;

    // Load the cache file
    var cachePath = config.get("configPath") + config.get("translationCache");
    var cacheFile = {};
    try {
        cacheFile = JSON.parse(fs.readFileSync(cachePath));
    } catch (e) {
        // Nothing
    }

    cacheFile.formatVersion = cacheFile.formatVersion || this.formatVersionNeeded;

    cacheFile.translations = cacheFile.translations || {};
    cacheFile.translations.orgs = cacheFile.translations.orgs || {};
    cacheFile.translations.boards = cacheFile.translations.boards || {};
    cacheFile.translations.lists = cacheFile.translations.lists || {};
    cacheFile.translations.users = cacheFile.translations.users || {};
    cacheFile.translations.me = cacheFile.translations.me || {};

    this.cache = cacheFile;
}

Translator.prototype.checkCompatibleCache = function() {
    return cacheFile.formatVersion == this.formatVersionNeeded;
}

Translator.prototype.reloadTranslations = function() {
    // Load the cache file
    var cachePath = this.config.get("configPath") + this.config.get("translationCache");
    var cacheFile = {};
    try {
        cacheFile = JSON.parse(fs.readFileSync(cachePath));
    } catch (e) {
        // Nothing
    }

    cacheFile.formatVersion = cacheFile.formatVersion || this.formatVersionNeeded;

    cacheFile.translations = cacheFile.translations || {};
    cacheFile.translations.orgs = cacheFile.translations.orgs || {};
    cacheFile.translations.boards = cacheFile.translations.boards || {};
    cacheFile.translations.lists = cacheFile.translations.lists || {};
    cacheFile.translations.users = cacheFile.translations.users || {};
    cacheFile.translations.me = cacheFile.translations.me || {};

    this.cache = cacheFile;

    this.loadCount++;

    // console.log("-- reloadTranslations() boards length: " + Object.keys(this.cache.translations.boards).length);
    // console.log("-- reloadTranslations() lists length: " + Object.keys(this.cache.translations.lists).length);
};

Translator.prototype.getOrganization = function(id) {
    this.logger.debug("Looking up organization: " + id);
    var item = this.cache.translations.orgs[id];
    if (!item) {
        return undefined;
    }
    return item["displayName"] || "Org: " + id;
}

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
}

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
}

Translator.prototype.getUser = function(id) {
    this.logger.debug("Looking up user: " + id);
    if (this.cache.translations.me.id == id) return (this.cache.translations.me.name + " (you)");
    var item = this.cache.translations.users[id];
    var str = "";
    if (item) {
        str += item["name"];
    }
    return str || "User: " + id;
}

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
}

Translator.prototype.getBoardsByName = function(name, comparer) {
    var matchingBoardIds = [];
    name = name.toLowerCase();
    this.logger.debug("Looking up boards by name: " + name);
    var boards = this.cache.translations.boards;
    for (var i in boards) {
        if (i != 'undefined' && comparer(boards[i]["name"].toLowerCase(), name)) {
            matchingBoardIds.push({
                id: i,
                name: boards[i]["name"]
            });
        }
    }

    return matchingBoardIds;
}

Translator.prototype.getListIdByBoardNameAndListName = function(board, list) {
    var boardId = this.getBoardIdByName(board);

    list = list.toLowerCase();
    this.logger.debug("Looking up list by name: " + list);
    var lists = this.cache.translations.lists;
    for (var i in lists) {
        if (lists[i]["board"] == boardId && lists[i]["name"].toLowerCase() == list) {
            return i;
        }
    }

    throw new Error("Unknown List");
}

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
}

Translator.prototype.getUserIdByUsername = function(name) {
    name = name.toLowerCase();
    this.logger.debug("Looking up user by username: " + name);
    var user = this.cache.translations.user;
    for (var i in user) {
        if (user[i]["username"] != null && user[i]["username"].toLowerCase() == name) {
            return i;
        }
    }

    throw new Error("Unknown User");
}

module.exports = function(logger, config) {
    return new Translator(logger, config);
}