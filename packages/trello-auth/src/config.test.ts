process.env.HOME = "/tmp/trello-test";
import config from "../src/config";

import * as fs from "fs";
jest.mock("fs");
const mockFS: jest.Mocked<typeof fs> = <jest.Mocked<typeof fs>>fs;

const expectedConfigFolder = "/tmp/trello-test/.trello-cli/default";
const expectedConfigFile = "/tmp/trello-test/.trello-cli/default/config.json";

describe("#ensureConfigFileExists", () => {
  it("takes no action if the config file exists", () => {
    jest.spyOn(config, "configFileExists").mockImplementation(() => true);

    const details = config.ensureConfigFileExists();

    expect(details.message).toBe(`Config file found at ${expectedConfigFile}`);
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
