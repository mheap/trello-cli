"use strict";

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

        var cardId = card_re.test(options.card) ? card_re.exec(options.card)[1] : null

        if (!cardId) {
            console.error("Could not parse card ID, example: https://trello.com/c/<ID> or <ID>")
            return
        }
        trello.get( //first get the ID of this user, since we probably got the username string
            `/1/members/${options.user}`,
            function (err, userdata) {
                if (err) {
                    console.error("Error in getting data for user " + options.user)
                    console.error(err)
                    return
                }

                var member = userdata.id
                var args = [ // THEN process the new ID into the arguments for a assign, or unassign request
                    `/1/cards/${cardId}/idMembers` + (
                        options.unAssign ? `/${member}` : ""
                    ),
                    options.unAssign ? { idMember: member } : { value: member },
                    function (err, data) {
                        if (err) {
                            if (data == 'member is not on the card' || data == 'member is already on the card') {
                                console.warn(data)
                            } else {
                                console.error(err, data)
                            }
                        } else {
                            console.log(`Member ${userdata.username + " " + (options.unAssign ? "un" : "")}assigned`)
                        }
                    }
                ]

                if (!options.unAssign) {
                    trello.post(...args)
                } else {
                    trello.del(...args)
                }
            }

        )
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
                    required: true
                },
                user: {
                    position: 2,
                    metavar: "<user/ID>",
                    help: "The user's name or ID to assign to the card",
                    required: true
                },
                unAssign: {
                    abbr: "u",
                    flag: true,
                    help: "If the member should be assigned or unassigned to the card, default: assign",
                },

            })
            .callback(function (options) {
                if (!options.user || !options.card) return
                trelloApiCommand.makeTrelloApiCall(options);
            });

        program
            .command("card-join")
            .help("Add or remove yourself to a card")
            .options({
                card: {
                    position: 1,
                    metavar: "<card>",
                    help: "The card's name/id/url",
                    required: true
                },
                unAssign: {
                    abbr: "u",
                    flag: true,
                    help: "If you should join or leave the card, default: join",
                },

            })
            .callback(function (options) {
                if (!options.card) return
                options.user = 'me'
                trelloApiCommand.makeTrelloApiCall(options);
            });
    };

    return trelloApiCommand;
};
module.exports = __;