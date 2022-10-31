const path = require("path");
const fs = require("fs");

const homePath =
  process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
const profile = process.env.TRELLO_CLI_PROFILE || "default";

const configFileDir = path.resolve(homePath, ".trello-cli", profile);
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

  static ensureConfigFileExists(): { message: string } {
    let message = `Config file found at ${configFilePath}`;

    if (!__.configFileExists()) {
      throw {
        message: `Go to https://trello.com/app-key to generate your API key and replace YOURAPIKEY in ${configFilePath}`,
        code: "ERR_NO_APP_KEY",
        data: {
          url: "https://trello.com/app-key",
        },
      };
    }

    return {
      message,
    };
  }

  static configFileExists(): boolean {
    return fs.existsSync(configFilePath);
  }
}

export default __;
