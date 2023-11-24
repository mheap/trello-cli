import { test } from "@oclif/test";
import Config from "@trello-cli/config";

let setToken: any;
beforeEach(() => {
  setToken = jest
    .spyOn(Config.prototype, "setToken")
    .mockImplementation(() => Promise.resolve());
});

describe("auth:token", () => {
  const run = test.stdout();

  run
    .command(["auth:token"])
    .catch((err) =>
      expect(err.message).toContain("Missing 1 required arg:\ntoken")
    )
    .it("throws when the token parameter is missing", (ctx) => {});

  run
    .command(["auth:token", "my_fake_token"])
    .it("calls config.setToken with the correct parameter", (ctx) => {
      expect(setToken).toBeCalledTimes(1);
      expect(setToken).toBeCalledWith("my_fake_token");
    });
});
