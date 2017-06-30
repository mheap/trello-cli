"use strict";

fs = require("fs");
var _ = require("underscore");

var __ = function (
  program,
  output,
  logger,
  config,
  trello,
  translator,
  trelloApiCommands
) {
  var trelloApiCommand = {};

  trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {
    const card_re = /(?:(?:https?:\/\/)?(?:www\.)?trello\.com\/c\/)?([a-z0-9]+)\/?.*/i
    // checks the first ID-like string it can find, if a trello url is the first, parse the ID following up to it:
    //((http://)(www.)trello.com/c/)<ID>/30-add-automated-travisci-builds
    //this will ignore any url, get the ID, and ignore everything after a slash

    logger.info("Showing details about the specified card");

    var cardId = card_re.test(options.cardId) ? card_re.exec(options.cardId)[1] : null

    if (!cardId) {
      console.error("Could not parse card ID, example: https://trello.com/c/<ID> or <ID>")
      return
    }

    trello.get(
      "/1/cards/" + cardId,
      {
        fields: "all",
        member_fields: "all",
        attachments: "true",
        checklists: "all"
      },
      function (err, data) {
        if (err) {
          throw err;
        }

        var name = translator.getList(data.idList) + " > " + data.name;
        if (data.closed == true) {
          // XXX If someone can recommend a better way to do this, I would love to hear it!
          output.bold(name.red);
          output.bold("This card is archived (closed).".red);
        } else {
          output.bold(name);
        }
        if (data.badges.subscribed) {
          output.normal("You are subscribed to this card.");
        }
        if (data.labels.length > 0) {
          var x = [];
          data.labels.forEach(function (e) {
            var c = "";
            switch (e.color) { // XXX I don't know a better way to do this, either, I would love to hear recommendations!
              case "lime":
                c = "cyan";
                break;
              case "orange":
                c = "yellow";
                break;
              default:
                c = e.color;
                break;
            }
            if (c && output.hasOwnProperty(c)) {
              x.push(e.name[c]);
            } else {
              x.push(e.name);
            }
          });
          output.normal("Labels: " + x.join(", "));
        }
        if (data.due != null) {
          output.normal("Due " + data.due);
        }
        if (data.idMembers.length > 0) {
          var members = [];
          data.idMembers.forEach(function (e) {
            members.push(translator.getUser(e));
          });
          if (data.idMembers.length == 1) {
            output.normal("1 member: " + members.join(", "));
          } else {
            output.normal(
              data.idMembers.length + " members: " + members.join(", ")
            );
          }
        }
        if (
          translator.cache.translations.boards[data.idBoard] &&
          translator.cache.translations.boards[data.idBoard]["voting"] &&
          data.badges.votes > 0
        ) {
          var voters = [];
          data.idMembersVoted.forEach(function (e) {
            voters.push(translator.getUser(e));
          });
          if (data.badges.votes == 1) {
            output.normal("1 vote: " + voters.join(", "));
          } else {
            output.normal(data.badges.votes + " votes: " + voters.join(", "));
          }
        }
        if (data.badges.attachments > 0) {
          if (data.badges.attachments == 1) {
            output.normal("1 attachment:");
          } else {
            output.normal(data.badges.attachments + " attachments:");
          }
          data.attachments.forEach(function (e) {
            output.normal("* " + e.name + " - " + e.url.underline);
          });
        }
        data.checklists.forEach(function (e) {
          if (e.name == "Checklist") {
            output.bold("Checklist:");
          } else {
            output.bold("Checklist - " + e.name + ":");
          }
          e.checkItems.forEach(function (el) {
            if (el.state == "complete") {
              output.green("- " + el.name + " (Completed)");
            } else {
              output.yellow("* " + el.name);
            }
          });
        });

        if (data.badges.description == true) {
          output.italic("\n" + data.desc + "\n");
        }
      }
    );
  };

  trelloApiCommand.nomnomProgramCall = function () {
    program
      .command("card-details")
      .help("Show details about a specified card")
      .options({
        cardId: {
          position: 1,
          help: "The short URL or ID of the card to display information about",
          required: true
        }
      })
      .callback(function (options) {
        if (!options.cardId) return // nomnom will already have described us the required arguments, why it doesnt cancel the callback is beyond me
        trelloApiCommand.makeTrelloApiCall(options);
      });
  };

  return trelloApiCommand;
};
module.exports = __;
