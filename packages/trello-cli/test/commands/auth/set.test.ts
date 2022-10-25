import { test } from "@oclif/test";
import auth from "trello-auth";

let setToken: any;
beforeEach(() => {
  setToken = jest.spyOn(auth, "setToken").mockImplementation(() => {});
});

describe("auth:set", () => {
  const run = test.stdout();

  run
    .command(["auth:set"])
    .catch((err) =>
      expect(err.message).toContain("Missing 1 required arg:\ntoken")
    )
    .it("throws when the token parameter is missing", (ctx) => {});

  run
    .command(["auth:set", "my_fake_token"])
    .it("calls auth.setToken with the correct parameter", (ctx) => {
      expect(ctx.stdout).toBe("Token updated\n");
      expect(setToken).toBeCalledTimes(1);
      expect(setToken).toBeCalledWith("my_fake_token");
    });
});
