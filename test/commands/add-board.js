var chai = require('chai');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var expect = chai.expect;

var sinon = require('sinon');

var logger = require('../../lib/logger');
var output = {};

// Stubs and mocks
var config = {"get": sinon.stub()};
config.get.withArgs("appKey").returns("foo");
var authentication = {getToken: () => "FakeToken" };

var program = {
	"command": function(){}
};


var trello = require("../../src/node-trello-wrapper")(output, logger, config, authentication);
var translator = require("../../src/translator")(logger, config, trello, output);
var command = require('../../src/commands/add-board')(program, output, logger, config, trello, translator, []); 

describe('command/add-board', sinon.test(function(done) {
	this.stub(logger)
		logger = sinon.mock(logger)

	it('uses defaults', sinon.test(function() {
		logger.expects("info").withExactArgs('Adding new board...')

		var options = { 
			'0': 'add-board', 
			boardName: 'Capture For Tests 2', 
			_: [ 'add-board' ]
		};

		this.stub(command, "run", function(v) {
			expect(v.name).to.eql("Capture For Tests 2");
			expect(v.desc).to.eql("");
			expect(v.prefs_cardCovers).to.eql("true");
			expect(v.prefs_cardAging).to.eql("regular");
		});

		command.makeTrelloApiCall(options, function(err, data) {
			done();
		});
	}));

	it('respects adding a description', sinon.test(function() {
		logger.expects("info").withExactArgs('Adding new board...')

		var options = {
			  description: 'This is a description'
		};


		this.stub(command, "run", function(v) {
			expect(v.desc).to.eql("This is a description");
		});

		command.makeTrelloApiCall(options, function(err, data) {
			done();
		});
	}));

	it('respects disabling card covers', sinon.test(function() {
		logger.expects("info").withExactArgs('Adding new board...')

		var options = { 
			cardCoverImages: true,
		};

		this.stub(command, "run", function(v) {
			expect(v.prefs_cardCovers).to.eql("false");
		});

		command.makeTrelloApiCall(options, function(err, data) {
			done();
		});
	}));

	it('respects enabling card aging', sinon.test(function() {
		logger.expects("info").withExactArgs('Adding new board...')

		var options = { 
			cardAging: true,
		};

		this.stub(command, "run", function(v) {
			expect(v.prefs_cardAging).to.eql("pirate");
		});

		command.makeTrelloApiCall(options, function(err, data) {
			done();
		});
	}));

}));
