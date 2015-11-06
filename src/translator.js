var fs = require("fs");

var Translator = function(logger, config){

  this.logger = logger;
  this.config = config;

  // Load the cache file
  var cachePath = config.get("configPath") + config.get("translationCache");
  var cacheFile = {};
  try {
    cacheFile = JSON.parse(fs.readFileSync(cachePath));
  } catch (e){
    // Nothing
  }

  cacheFile.translations = cacheFile.translations || {};
  cacheFile.translations.orgs = cacheFile.translations.orgs || {};
  cacheFile.translations.boards = cacheFile.translations.boards || {};
  cacheFile.translations.lists = cacheFile.translations.lists || {};

  this.cache = cacheFile;
}

Translator.prototype.reloadTranslations = function () {
    // Load the cache file
    var cachePath = this.config.get("configPath") + this.config.get("translationCache");
    var cacheFile = {};
    try {
      cacheFile = JSON.parse(fs.readFileSync(cachePath));
    } catch (e){
      // Nothing
    }

    cacheFile.translations = cacheFile.translations || {};
    cacheFile.translations.orgs = cacheFile.translations.orgs || {};
    cacheFile.translations.boards = cacheFile.translations.boards || {};
    cacheFile.translations.lists = cacheFile.translations.lists || {};

    this.cache = cacheFile;
};

Translator.prototype.getOrganisation = function(id){
  this.logger.debug("Looking up organisation: " + id);
  var item = this.cache.translations.orgs[id];
  if (!item){
    return undefined;
  }
  return item || "Org: " + id;
}

Translator.prototype.getBoard = function(id){
  this.logger.debug("Looking up board: " + id);
  var item = this.cache.translations.boards[id];
  var str = "";
  if (item){
    if (item[0]){
      str += this.getOrganisation(item[0]) + " > ";
    }
    str += item[1];
  }
  return str || "Board: " + id;
}

Translator.prototype.getBoardIdByName = function(name){
  name = name.toLowerCase();
  this.logger.debug("Looking up board by name: " + name);
  var boards = this.cache.translations.boards;
  for (var i in boards){
    if (boards[i][1].toLowerCase() == name){
      return i;
    }
  }

  throw new Error("Unknown Board");
}

Translator.prototype.getListIdByBoardNameAndListName = function(board, list){
  var boardId = this.getBoardIdByName(board);

  list = list.toLowerCase();
  this.logger.debug("Looking up list by name: " + list);
  var lists = this.cache.translations.lists;
  for (var i in lists){
    if (lists[i][0] == boardId && lists[i][1].toLowerCase() == list){
      return i;
    }
  }

  throw new Error("Unknown List");
}

module.exports = function(logger, config){
  return new Translator(logger, config);
}
