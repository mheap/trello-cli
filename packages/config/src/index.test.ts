import Config from ".";
import { when, resetAllWhenMocks, verifyAllWhenMocksCalled } from "jest-when";
import fs from "fs";

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

afterEach(function () {
  verifyAllWhenMocksCalled();
  resetAllWhenMocks();
});

const expectedConfigFile = "/tmp/trello-test/.trello-cli/default/config.json";

const config = new Config("/tmp/trello-test/.trello-cli", "default");

describe("#getToken", () => {
  it("returns the token when set", () => {
    const configKeyMock = jest.spyOn(Config.prototype as any, "getConfigKey");
    when(configKeyMock).calledWith("token").mockReturnValueOnce("ABC123");

    expect(config.getToken()).resolves.toBe("ABC123");
  });

  it("throws an error when not set", () => {
    const configKeyMock = jest.spyOn(Config.prototype as any, "getConfigKey");

    when(configKeyMock).calledWith("apiKey").mockReturnValueOnce("my_app_key");
    when(configKeyMock)
      .calledWith("token")
      .mockImplementationOnce(() => {
        throw new Error();
      });

    expect(config.getToken()).rejects.toStrictEqual({
      message: `The [token] field is missing from ${expectedConfigFile}`,
      code: `ERR_NO_TOKEN`,
      data: {
        url: `https://trello.com/1/connect?key=my_app_key&name=trello-cli&response_type=token&scope=account,read,write&expiration=never`,
      },
    });
  });
});

describe("#setToken", () => {
  it("sets the token in an empty file", () => {
    const configKeyMock = jest.spyOn(Config.prototype as any, "setConfigKey");

    jest.spyOn(config, "configDirExists").mockReturnValueOnce(true);
    jest.spyOn(config, "configFileExists").mockReturnValueOnce(true);

    (fs.promises.readFile as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve("{}")
    );

    expect(config.setToken("ABC123")).resolves;
    expect(configKeyMock).toHaveBeenCalledTimes(1);
    expect(configKeyMock).toHaveBeenCalledWith("token", "ABC123");
  });
});

describe("#getApiKey", () => {
  it("returns the app key when set", () => {
    const configKeyMock = jest.spyOn(Config.prototype as any, "getConfigKey");
    when(configKeyMock)
      .calledWith("apiKey")
      .mockReturnValueOnce(Promise.resolve("my_key"));

    expect(config.getApiKey()).resolves.toBe("my_key");
  });

  it("throws an error when the config file does not exist", () => {
    jest.spyOn(config, "configDirExists").mockReturnValueOnce(false);

    expect(config.getToken()).rejects.toStrictEqual({
      message: `[apiKey] not found in ${expectedConfigFile}. Get one at https://trello.com/app-key`,
      code: `ERR_NO_APP_KEY`,
      data: {
        url: "https://trello.com/app-key",
      },
    });
  });

  it("throws an error when the config file exists but does not contain a token", () => {
    jest.spyOn(config, "configDirExists").mockReturnValueOnce(true);
    jest.spyOn(config, "configFileExists").mockReturnValueOnce(true);
    (fs.promises.readFile as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve("{}")
    );

    expect(config.getToken()).rejects.toStrictEqual({
      message: `[apiKey] not found in ${expectedConfigFile}. Get one at https://trello.com/app-key`,
      code: `ERR_NO_APP_KEY`,
      data: {
        url: "https://trello.com/app-key",
      },
    });
  });

  describe("#setApiKey", () => {
    it("sets the token in an empty file", () => {
      const configKeyMock = jest.spyOn(Config.prototype as any, "setConfigKey");

      jest.spyOn(config, "configDirExists").mockReturnValueOnce(true);
      jest.spyOn(config, "configFileExists").mockReturnValueOnce(true);

      (fs.promises.readFile as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve("{}")
      );

      expect(config.setApiKey("my_app_key")).resolves;
      expect(configKeyMock).toHaveBeenCalledTimes(1);
      expect(configKeyMock).toHaveBeenCalledWith("apiKey", "my_app_key");
    });
  });
});
