"use strict";

var __ = function(
  program,
  output,
  logger,
  config,
  trello,
  translator,
  trelloApiCommands
) {
  var trelloApiCommand = {};

  trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
    logger.info("Adding new board...");
    if (!options.idOrganization && options.permissionLevel == 'org') {
      throw "You must set an organization ID in order to set the permission level to org"
    }

    // Build up arguments to send
    var params = {
      name: options.boardName,
      desc: options.description ? options.description : "",
      defaultLists: options.defaultLists ? "false" : "true",
      idOrganization: options.idOrganization ? options.idOrganization : "",
      prefs_cardCovers: options.cardCoverImages ? "false" : "true",
      prefs_cardAging: options.cardAging ? "pirate" : "regular",
      prefs_permissionLevel: options.permissionLevel ? options.permissionLevel : "private",
      prefs_selfJoin: options.selfJoin ? "false" : "true"
    };

    // console.log(params);
    return this.run(params, onComplete);
  };

  trelloApiCommand.run = function(params, onComplete) {
    trello.post("/1/boards", params, function(err, data) {
      if (err) {
        throw err;
      }
      // console.log(data);
      logger.info("Board added, new URL: " + data.url);

      trelloApiCommands["refresh"].makeTrelloApiCall(
        { type: "lists" },
        onComplete
      );
    });
  };

  trelloApiCommand.nomnomProgramCall = function() {
    program
      .command("add-board")
      .help("Adds a new board with the specified name")
      .options({
        boardName: {
          abbr: "b",
          metavar: "BOARD",
          help: "The name of the new board",
          required: true
        },
        description: {
          abbr: "d",
          metavar: "DESC",
          help: "The description of the board",
          required: false
        },
        cardAging: {
          abbr: "a",
          help: "Turns card aging on for the new board (default is off)",
          required: false,
          flag: true
        },
        cardCoverImages: {
          abbr: "c",
          help:
            "Turns off the showing of images on the front of cards (default is on)",
          required: false,
          flag: true
        },
        defaultLists: {
          abbr: "l",
          help:
            "Turns off default lists for the new board (default is on)",
          required: false,
          flag: true
        },
        idOrganization: {
          abbr: "i",
          help:
            "Sets the organization for the new board",
          required: false
        },
        permissionLevel: {
          abbr: "p",
          help:
            "Sets the permission level for the new board",
          required: false
        },
        selfJoin: {
          abbr: "s",
          help:
            "Determines whether users can join the boards themselves or whether they have to be invited.",
          required: false,
          flag: true
        },
        verbose: {
          abbr: "v",
          help: "Turn on increased error reporting",
          required: false,
          flag: true
        }
      })
      .callback(function(options) {
        trelloApiCommand.makeTrelloApiCall(options);
      });
  };

  return trelloApiCommand;
};

module.exports = __;
