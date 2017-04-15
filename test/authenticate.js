var chai = require('chai');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var expect = chai.expect;

var sinon = require('sinon');

var logger = require('../lib/logger');
var output = {};
var config = require('nconf');

describe('Authenticate', sinon.test(function() {
    this.stub(logger)
    var Auth = require('../src/authenticate')(logger, output, config);

    describe('#loadAuthCache()', sinon.test(function() {
        // We use sinon.stub not this.stub to persist across tests
        config = sinon.stub(config, "get")
        config.withArgs('configPath').returns('/tmp/.missing.trello-cli/');
        config.withArgs('authCache').returns('auth.json');
        logger = sinon.mock(logger)

        it('should parse valid JSON file', sinon.test(function() {
            this.stub(Auth.fs, "readFileSync").returns('{}');
            expect(Auth.loadAuthCache()).to.eql({})
        }));

        it('should create empty auth file if none exists', sinon.test(function() {
            this.stub(Auth.fs, "readFileSync").throws()
            logger.expects("debug").withExactArgs('No auth file found: /tmp/.missing.trello-cli/auth.json')
            logger.expects("debug").withExactArgs('Auth file created')

            var spy = this.spy(Auth, "writeAuthFile")

            Auth.loadAuthCache()

            expect(spy).to.have.been.calledOnce;
        }));
    }));

    describe('#setToken()', sinon.test(function() {
        it('should append to an empty object', sinon.test(function() {
            this.stub(Auth, 'loadAuthCache').returns({})
            var spy = this.spy(Auth, "writeAuthFile")
            logger.expects("debug").withExactArgs('Auth file written')
            Auth.setToken("Hello World")
            expect(spy).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWith('{"token":"Hello World"}');
        }));

        it('should overwrite an existing token', sinon.test(function() {
            this.stub(Auth, 'loadAuthCache').returns({"token":"Old Token"})
            var spy = this.spy(Auth, "writeAuthFile")
            logger.expects("debug").withExactArgs('Auth file written')
            Auth.setToken("Hello World")
            expect(spy).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWith('{"token":"Hello World"}');
        }));

        it('should not remove existing keys', sinon.test(function() {
            this.stub(Auth, 'loadAuthCache').returns({"foo": "bar"})
            var spy = this.spy(Auth, "writeAuthFile")
            logger.expects("debug").withExactArgs('Auth file written')
            Auth.setToken("Hello World")
            expect(spy).to.have.been.calledOnce;
            expect(spy).to.have.been.calledWith('{"foo":"bar","token":"Hello World"}');
        }));

    }));

}));
