"use strict";

var __ = function (program, output, logger, config, trello, translator) {
  var trelloApiCommand = {};

  trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {
    const card_re = /(?:(?:https?:\/\/)?(?:www\.)?trello\.com\/c\/)?([a-z0-9]+)\/?.*/i;

    var cardId = card_re.test(options.card)
      ? card_re.exec(options.card)[1]
      : null;

    if (!cardId) {
      console.error(
        "Could not parse card ID, example: https://trello.com/c/<ID> or <ID>"
      );
      return;
    }
    trello.get(
      "/1/members/" + (options.user ? options.user : "me"),
      function (err, userdata) {
        if (err) {
          console.error("Error in getting data for user " + options.user);
          console.error(err);
          return;
        }

        var member = userdata.id;
        var args = [
          // THEN process the new ID into the arguments for a assign, or unassign request
          "/1/cards/" +
            cardId +
            "/idMembers" +
            (options.remove ? "/" + member : ""),
          options.remove ? { idMember: member } : { value: member },
          function (err, data) {
            if (err) {
              if (
                data == "member is not on the card" ||
                data == "member is already on the card"
              ) {
                console.warn(data);
              } else {
                console.error(err, data);
              }
            } else {
              console.log(
                "Member " +
                  userdata.username +
                  " " +
                  (options.remove ? "un" : "") +
                  "assigned"
              );
            }
          },
        ];

        if (!options.remove) {
          trello.post(...args);
        } else {
          trello.del(...args);
        }
      }
    );
  };

  trelloApiCommand.nomnomProgramCall = function () {
    program
      .command("card-assign")
      .help("Add or remove a member to a card")
      .options({
        card: {
          position: 1,
          metavar: "<card>",
          help: "The card's name/id/url",
          required: true,
        },
        user: {
          position: 2,
          metavar: "<user/ID>",
          help:
            "The user's name or ID to assign to the card, or current user if unspecified",
          required: false,
        },
        remove: {
          abbr: "r",
          flag: true,
          help: "Unassigns the user from the card",
        },
      })
      .callback(function (options) {
        trelloApiCommand.makeTrelloApiCall(options);
      });
  };

  return trelloApiCommand;
};
module.exports = __;
