fs = require("fs");

var __ = function(program, output, logger, config, trello, translator) {
	var trelloApiCommand = {};

	trelloApiCommand.makeTrelloApiCall = function(options, onComplete) {
		id = options.id || "me";
		logger.info("Showing assigned cards to " + id);
		trello.get("/1/members/" + id + "/cards", function(err, data) {
			if (err) {
				logger.error("Error while retrieving assigned cards for " + id + ":", err.statusMessage ? err.statusMessage : data);
				return;
			}

			// Order the issues by board
			var cards = {};
			for (var i in data) {
				var item = data[i];
				cards[item.idBoard] = cards[item.idBoard] || [];
				cards[item.idBoard].push(item.name.replace(/\n/g, ""));
			}

			for (var j in cards) {
				output.underline(translator.getBoard(j));
				for (var k in cards[j]) {
					output.normal("* " + cards[j][k]);
				}
			}
		});
	};

	trelloApiCommand.nomnomProgramCall = function() {
		program
			.command("assigned-to-me")
			.help("Show cards that are currently assigned to yourself, or any member specified")
			.options({
				id: {
					position: 1,
					help: "Specifies user to show assigned cards for. (id/username)",
					required: false
				}
			})
			.callback(function(options) {
				trelloApiCommand.makeTrelloApiCall(options);
			});
	};

	return trelloApiCommand;
};

module.exports = __;
