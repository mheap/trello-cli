const path = require("path");
const fs = require("fs");

const homePath =
  process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
const configFileDir = path.resolve(homePath, ".trello-cli");
const configFilePath = path.resolve(configFileDir, "config.json");

class __ {
  static getAppKey() {
    __.ensureConfigFileExists();
    return __.loadAppKey();
  }

  static loadAppKey() {
    const c = JSON.parse(fs.readFileSync(configFilePath));
    return c.appKey;
  }

  static ensureConfigFileExists(): { configPath: string; message: string } {
    let message = `Config file found at ${configFilePath}`;

    if (!__.configFileExists()) {
      __.createEmptyConfig();
      throw new Error(
        `Go to https://trello.com/app-key to generate your API key and replace YOURAPIKEY in ${configFilePath}`
      );
    }

    return {
      configPath: configFilePath,
      message,
    };
  }

  static configFileExists(): boolean {
    return fs.existsSync(configFilePath);
  }

  static createEmptyConfig() {
    // Create ~/.trello-cli if it doesn't exist
    if (!fs.existsSync(configFileDir)) {
      fs.mkdirSync(configFileDir, "0700");
    }

    // Write a template
    const template = {
      appKey: "YOURAPIKEY",
      configPath: configFileDir + "/",
    };
    fs.writeFileSync(configFilePath, JSON.stringify(template, null, 4));
  }
}

export default __;
