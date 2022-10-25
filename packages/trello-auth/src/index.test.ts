process.env.HOME = "/tmp/trello-test";
import auth from "../src";
import config from "../src/config";

import * as fs from "fs";
jest.mock("fs");
const mockFS: jest.Mocked<typeof fs> = <jest.Mocked<typeof fs>>fs;

const expectedAuthFile = "/tmp/trello-test/.trello-cli/authentication.json";

describe("#getToken", () => {
  it("returns the token when set", () => {
    jest.spyOn(config, "getAppKey").mockImplementation(() => "MY_APP_KEY");
    jest
      .spyOn(auth, "ensureAuthenticationTokenExists")
      .mockImplementation(() => {});
    jest.spyOn(auth, "loadToken").mockImplementation(() => "ABC123");

    expect(auth.getToken()).toBe("ABC123");
  });
});

describe("#ensureAuthenticationTokenExists", () => {
  it("throws if the auth file does not exist", () => {
    mockFS.existsSync.mockImplementation(() => false);
    expect(auth.ensureAuthenticationTokenExists).toThrow(
      `The [token] field is missing from ${expectedAuthFile}`
    );
  });

  it("throws if the auth token is null", () => {
    mockFS.existsSync.mockImplementation(() => true);
    jest.spyOn(auth, "loadToken").mockImplementation(() => undefined);

    jest.spyOn(config, "getAppKey").mockImplementation(() => "AppKeyHere");

    expect(auth.getToken).toThrow({
      message: `The [token] field is missing from ${expectedAuthFile}`,
      code: "ERR_NO_AUTH_TOKEN",
      data: {
        authenticationUrl:
          "https://trello.com/1/connect?key=" +
          "AppKeyHere" +
          "&name=trello-cli&response_type=token&scope=account,read,write&expiration=never",
      },
    } as any);
  });
});

describe("#loadToken", () => {
  it("returns the .token entry", () => {
    mockFS.readFileSync.mockImplementation(() => '{"token":"here"}');
    expect(auth.loadToken()).toBe("here");
  });
});
