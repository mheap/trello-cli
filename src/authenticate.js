var fs = require('fs'),
colors = require('colors');

var Auth = function(logger, output, config){
  this.logger = logger;
  this.output = output;
  this.config = config;

  this.authenticationUrl = "https://trello.com/1/connect?key="+this.config.get("appKey")+"&name=trello-cli&response_type=token&scope=account,read,write";
};

Auth.prototype.loadAuthCache = function(){
  var authFile = {};
  // Load auth cache file
  try {
    authFile = JSON.parse(fs.readFileSync(this.config.get("configPath") + this.config.get("authCache")));
  } catch (e) {
    this.logger.debug("No auth file found: " + this.config.get("configPath") + this.config.get("authCache"));
    // Create the file
    this.writeAuthFile("{}", function(){
      this.logger.debug("Auth file created");
    }.bind(this));
  }

  return authFile;

}

Auth.prototype.setToken = function(token){
  var authCache = this.loadAuthCache();
  authCache.token = token;
  this.writeAuthFile(JSON.stringify(authCache), function(){
    this.logger.debug("Auth file written");
  }.bind(this));
}

Auth.prototype.getToken = function(){
  if (!this.cachedToken){
    this.cachedToken = this.loadAuthCache().token;
  }

  return this.cachedToken;
}

Auth.prototype.writeAuthFile = function(content, callback){
  // Make sure the path exists
  try {
    fs.mkdirSync(this.config.get("configPath"));
  } catch(e){
    // If it's not an issue where it already exists, rethrow
    if (e.code != 'EEXIST'){
      throw e;
    }
  }

  // Make sure the file exists
  var path =this.config.get("configPath") + this.config.get("authCache");
  fs.writeFileSync(path, content);
  callback();
}

Auth.prototype.check = function(){
  var authCache = this.loadAuthCache();
  // See if we have an auth key in there
  if (!authCache.token){
    this.logger.debug("Token does not exist, asking the user to go via the web flow");
    this.output.normal("We couldn't find an authentication token! Please visit the following URL:");
    this.output.emphasis(this.authenticationUrl);
    this.output.normal("Once you have a token, run the following command:");
    this.output.normal("trello set-auth <token>");
    process.exit(1);
  }

  this.logger.debug("Authenticating user");
}

Auth.prototype.run = function(){
  this.logger.debug("Authenticating user");
}

module.exports = function(logger, output, config){
  logger.debug("Creating authentication module");
  return new Auth(logger, output, config);
}
