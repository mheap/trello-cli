"use strict";

var __ = function(program, output, logger, config, trello, translator, trelloApiCommands) {

    var trelloApiCommand = {};

    trelloApiCommand.makeTrelloApiCall = function (options, onComplete) {

			trello.get('/1/members/me/tokens/', {"webhooks":"true"}, function(err, data) {
				if (err) throw err;
				for (var i = 0 ; i < data.length ;i++) {
					var d = data[i];
					if (d.webhooks.length > 0) {
						output.normal("* "+d.identifier.bold);
						for (var j = 0 ; j < d.webhooks.length ; j++) {
							var w = d.webhooks[j];
							output.normal("  - "+w.description.underline);
							output.normal("    hook ID      : "+w.id);
							output.normal("    board ID     : "+w.idModel);
							output.normal("    board        : "+translator.getBoard(w.idModel));
							output.normal("    callback URL : "+w.callbackURL);
						}
					} else {
						output.normal("* "+d.identifier+" []");
					}
				}
			});

    }

    trelloApiCommand.nomnomProgramCall = function () {
        program
            .command("show-webhooks")
            .help("display webhooks for current user applications")
            .callback(function (options) {
                trelloApiCommand.makeTrelloApiCall(options);
            });
        }

    return trelloApiCommand;
}
module.exports = __;
