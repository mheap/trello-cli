import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockLabel = { id: "label1", name: "Bug", color: "red" };

const createBoardLabel = jest.fn().mockResolvedValue(mockLabel);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    boards: {
      createBoardLabel,
    },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");
const mockSync = jest.fn().mockResolvedValue(undefined);

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getBoardIdByName: mockGetBoardIdByName,
      sync: mockSync,
    })),
  };
});

let stdoutSpy: jest.SpyInstance;

beforeEach(() => {
  jest
    .spyOn(Config.prototype, "getToken")
    .mockImplementation(() => Promise.resolve("fake_token"));
  jest
    .spyOn(Config.prototype, "getApiKey")
    .mockImplementation(() => Promise.resolve("fake_api_key"));

  stdoutSpy = jest.spyOn(ux, "stdout").mockImplementation(() => {});

  createBoardLabel.mockClear();
  mockGetBoardIdByName.mockClear();
  mockSync.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("label:create", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["label:create"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("calls createBoardLabel with correct params", async () => {
    const { error } = await runCommand([
      "label:create",
      "--board", "MyBoard",
      "--name", "Bug",
      "--color", "red",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(createBoardLabel).toHaveBeenCalledTimes(1);
    expect(createBoardLabel).toHaveBeenCalledWith({
      id: "board123",
      name: "Bug",
      color: "red",
    });
  });

  it("calls cache.sync() after creation", async () => {
    await runCommand([
      "label:create",
      "--board", "MyBoard",
      "--name", "Bug",
      "--color", "red",
      "--format", "json",
    ]);
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "label:create",
      "--board", "MyBoard",
      "--name", "Bug",
      "--color", "red",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("label1");
    expect(output.name).toBe("Bug");
    expect(output.color).toBe("red");
  });
});
