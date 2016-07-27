var fs = require("fs");

var Translator = function(logger, config){

  this.loadCount = 1;
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

    this.loadCount++;

    // console.log("-- reloadTranslations() boards length: " + Object.keys(this.cache.translations.boards).length);
    // console.log("-- reloadTranslations() lists length: " + Object.keys(this.cache.translations.lists).length);
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

Translator.prototype.getList = function(id){
  this.logger.debug("Looking up list: " + id);
  var item = this.cache.translations.lists[id];
  var str = "";
  if (item){
    if (item[0]){
      str += this.getBoard(item[0]) + " > ";
    }
    str += item[1];
  }
  return str || "List: " + id;
}

Translator.prototype.getBoardIdByName = function(name) {
  // console.log("-- getBoardIdByName() boards length: " + Object.keys(this.cache.translations.boards).length);
  // console.log("-- getBoardIdByName() lists length: " + Object.keys(this.cache.translations.lists).length);
  name = name.toLowerCase();
  this.logger.debug("Looking up board by name: " + name);
  var boards = this.cache.translations.boards;
  for (var i in boards) {
    if (boards[i][1] != null && boards[i][1].toLowerCase() == name){
      return i;
    }
  }

  throw new Error("Unknown Board");
}

Translator.prototype.getBoardsByName = function(name, comparer) {
    // console.log("-- getBoardIdByName() boards length: " + Object.keys(this.cache.translations.boards).length);
    // console.log("-- getBoardIdByName() lists length: " + Object.keys(this.cache.translations.lists).length);

    var matchingBoardIds = [];
    name = name.toLowerCase();
    this.logger.debug("Looking up boards by name: " + name);
    var boards = this.cache.translations.boards;
    for (var i in boards) {
        if (i != 'undefined' && comparer(boards[i][1].toLowerCase(), name)) {
            matchingBoardIds.push({ id: i, name : boards[i][1] });
        }
    }

    return matchingBoardIds;
}

Translator.prototype.getListIdByBoardNameAndListName = function(board, list) {
  // console.log("-- getListIdByBoardNameAndListName() boards length: " + Object.keys(this.cache.translations.boards).length);
  // console.log("-- getListIdByBoardNameAndListName() lists length: " + Object.keys(this.cache.translations.lists).length);
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
