import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";

let setToken: jest.SpyInstance;
beforeEach(() => {
  setToken = jest
    .spyOn(Config.prototype, "setToken")
    .mockImplementation(() => Promise.resolve());
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("auth:token", () => {
  it("throws when the token parameter is missing", async () => {
    const { error } = await runCommand(["auth:token"]);
    expect(error?.message).toContain("Missing 1 required arg");
    expect(error?.message).toContain("token");
  });

  it("calls config.setToken with the correct parameter", async () => {
    await runCommand(["auth:token", "my_fake_token"]);
    expect(setToken).toHaveBeenCalledTimes(1);
    expect(setToken).toHaveBeenCalledWith("my_fake_token");
  });
});
