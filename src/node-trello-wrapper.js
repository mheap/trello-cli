"use strict";

var __ = function(output, logger, config, authentication) {
  var Trello = require("node-trello");

  var trelloObj = new Trello(config.get("appKey"), authentication.getToken());

  var trelloWrapper = Object.create(trelloObj);

  trelloWrapper.post = function(url, params, callback) {
    trelloObj.post(url, params, trelloWrapper.callbackWrapperFactory(callback));
  };

  trelloWrapper.put = function(url, params, callback) {
    trelloObj.put(url, params, trelloWrapper.callbackWrapperFactory(callback));
  };

  trelloWrapper.get = function(url, arg2, arg3) {
    var params = arguments.length == 2 ? {} : arg2;
    var callback = arguments.length == 2 ? arg2 : arg3;
    trelloObj.get(url, params, trelloWrapper.callbackWrapperFactory(callback));
  };

  trelloWrapper.del = function(url, callback) {
    trelloObj.del(url, trelloWrapper.callbackWrapperFactory(callback));
  };

  trelloWrapper.callbackWrapperFactory = function(callback) {
    return function(err, data) {
      if (data == "invalid key") {
        logger.error(
          "The 'appKey' in ~/.trello-cli/config.json is invalid"
        );
        process.exit(1);
      }
      if (data == "Rate limit exceeded") {
        logger.error(
          "Rate limit exceeded. Please try again later"
        );
        process.exit(1);
      }
      if (
        data == "expired token" ||
        data == "invalid token" ||
        data == "unauthorized member permission requested."
      ) {
        logger.error(
          "Authentication token has expired or is otherwise invalid."
        );
        output.normal("To get a new token, please re-visit:");
        output.underline(authentication.authenticationUrl);
        output.normal("Once you have a token, run the following command:");
        output.normal("trello set-auth <token>");
        process.exit(1);
      } else {
        callback(err, data);
      }
    };
  };

  return trelloWrapper;
};

module.exports = __;
