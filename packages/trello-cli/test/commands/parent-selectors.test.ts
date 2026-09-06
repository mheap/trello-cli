import { runCommand } from "@oclif/test";

describe("parent selectors", () => {
  it.each([
    ["list:create"],
    ["list:list"],
    ["card:create"],
    ["card:list"],
  ])("rejects --id for %s", async (command) => {
    const { error } = await runCommand([command, "--id", "parent-id"]);

    expect(error?.message).toContain("Nonexistent flag: --id");
  });
});
