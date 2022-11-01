import * as path from "path";
import fs from "fs";
const fsPromises = fs.promises;

class Config {
  private configFileDir: string;
  private configFilePath: string;

  constructor(configFolder: string, profile: string) {
    this.configFileDir = path.resolve(configFolder, profile);
    this.configFilePath = path.resolve(this.configFileDir, "config.json");
  }

  // Getters + Setters
  getAppKey() {
    try {
      return this.getConfigKey("appKey");
    } catch (e: any) {
      const url = "https://trello.com/app-key";

      throw {
        message: `[appKey] not found in ${this.configFilePath}. Get one at ${url}`,
        code: "ERR_NO_APP_KEY",
        data: {
          url,
        },
      };
    }
  }

  setAppKey(appKey: string): Promise<void> {
    return this.setConfigKey("appKey", appKey);
  }

  async getToken() {
    try {
      return this.getConfigKey("token");
    } catch (e: any) {
      const url =
        "https://trello.com/1/connect?key=" +
        (await this.getAppKey()) +
        "&name=trello-cli&response_type=token&scope=account,read,write&expiration=never";

      throw {
        message: `The [token] field is missing from ${this.configFilePath}`,
        code: "ERR_NO_TOKEN",
        data: {
          url,
        },
      };
    }
  }

  setToken(token: string): Promise<void> {
    return this.setConfigKey("token", token);
  }

  // Config File
  configDirExists(): boolean {
    return fs.existsSync(this.configFileDir);
  }

  configFileExists(): boolean {
    return fs.existsSync(this.configFilePath);
  }

  // Helpers
  private async setConfigKey(key: string, value: string | number | boolean) {
    if (!this.configDirExists()) {
      fs.mkdirSync(this.configFileDir, "0700");
    }

    let current;
    if (this.configFileExists()) {
      current = JSON.parse(
        (await fsPromises.readFile(this.configFilePath)).toString()
      );
    } else {
      current = {};
    }

    current[key] = value;

    return fsPromises.writeFile(this.configFilePath, JSON.stringify(current));
  }

  private async getConfigKey(key: string): Promise<string | undefined> {
    if (!this.configDirExists() || !this.configFileExists()) {
      throw {
        message: `No file found at ${this.configFilePath}`,
        code: "ERR_NO_CONFIG",
      };
    }

    const data = JSON.parse(
      (await fsPromises.readFile(this.configFilePath)).toString()
    );

    if (data[key] === undefined) {
      throw {
        message: `The [${key}] field is missing from ${this.configFilePath}`,
        code: `ERR_MISSING_CONFIG`,
      };
    }

    return data[key];
  }
}

export default Config;
