var fs = require("fs")

exports.homePath = function() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']
}

exports.createEmptyConfig = function(cdir) {
  var cpath = path.resolve(cdir, "config.json")
  if(!fs.existsSync(cdir)) {
    fs.mkdirSync(cdir, 0700)
  }
  var template = {
    appKey: "YOURAPIKEY",
    configPath: cdir + "/",
    authCache: "authentication.json",
    translationCache: "translations.json"
  }
  fs.writeFileSync(cpath, JSON.stringify(template, null, 4))
  console.log("Blank configuration file saved to: " + cpath)
  console.log("Go to https://trello.com/1/appKey/generate and generate the API key and replace YOURAPIKEY in " + cpath)
}