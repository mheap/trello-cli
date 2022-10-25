process.env.HOME = "/tmp/trello-test";
import config from "../src/config";

import * as fs from "fs";
jest.mock("fs");
const mockFS: jest.Mocked<typeof fs> = <jest.Mocked<typeof fs>>fs;

const expectedConfigFolder = "/tmp/trello-test/.trello-cli";
const expectedConfigFile = "/tmp/trello-test/.trello-cli/config.json";

describe("#ensureConfigFileExists", () => {
  it("takes no action if the config file exists", () => {
    jest.spyOn(config, "configFileExists").mockImplementation(() => true);
    jest.spyOn(config, "createEmptyConfig").mockImplementation(() => {});

    const details = config.ensureConfigFileExists();

    expect(config.createEmptyConfig).not.toBeCalled();
    expect(details.message).toBe(`Config file found at ${expectedConfigFile}`);
  });

  it("bootstraps a config file when needed", () => {
    jest.spyOn(config, "configFileExists").mockImplementation(() => false);
    jest.spyOn(config, "createEmptyConfig").mockImplementation(() => {});

    expect(() => {
      config.ensureConfigFileExists();
    }).toThrow(
      `Go to https://trello.com/app-key to generate your API key and replace YOURAPIKEY in ${expectedConfigFile}`
    );
    expect(config.createEmptyConfig).toBeCalledTimes(1);
  });
});

describe("#configFileExists", () => {
  it("returns true if the config file exists", () => {
    mockFS.existsSync.mockReturnValue(true);

    expect(config.configFileExists()).toBe(true);
    expect(mockFS.existsSync).toBeCalledWith(expectedConfigFile);
  });

  it("returns false if the config file does not exist", () => {
    mockFS.existsSync.mockReturnValue(false);

    expect(config.configFileExists()).toBe(false);
    expect(mockFS.existsSync).toBeCalledWith(expectedConfigFile);
  });
});

describe("#createEmptyConfig", () => {
  it("bootstraps when no config directory exists", () => {
    mockFS.existsSync.mockReturnValue(false);
    mockFS.mkdirSync.mockReturnValue(undefined);

    config.createEmptyConfig();

    expect(mockFS.existsSync).toBeCalledWith(expectedConfigFolder);
    expect(mockFS.mkdirSync).toBeCalledWith(expectedConfigFolder, "0700");
    expect(mockFS.writeFileSync).toBeCalledWith(
      `${expectedConfigFolder}/config.json`,
      JSON.stringify(
        {
          appKey: "YOURAPIKEY",
          configPath: expectedConfigFolder + "/",
        },
        null,
        4
      )
    );
  });

  it("bootstraps when the directory exists, but no config file", () => {
    mockFS.existsSync.mockReturnValue(true);
    mockFS.mkdirSync.mockReturnValue(undefined);

    config.createEmptyConfig();

    expect(mockFS.existsSync).toBeCalledWith(expectedConfigFolder);
    expect(mockFS.mkdirSync).not.toBeCalledWith(expectedConfigFolder);
    expect(mockFS.writeFileSync).toBeCalledWith(
      `${expectedConfigFolder}/config.json`,
      JSON.stringify(
        {
          appKey: "YOURAPIKEY",
          configPath: expectedConfigFolder + "/",
        },
        null,
        4
      )
    );
  });
});
