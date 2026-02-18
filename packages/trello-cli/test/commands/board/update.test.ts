import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockBoard = {
  id: "board123",
  name: "UpdatedBoard",
  desc: "Updated description",
  url: "https://trello.com/b/board123",
  closed: false,
};

const updateBoard = jest.fn().mockResolvedValue(mockBoard);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    boards: { updateBoard },
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

  updateBoard.mockClear();
  mockGetBoardIdByName.mockClear();
  mockSync.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("board:update", () => {
  it("throws when --board flag is missing", async () => {
    const { error } = await runCommand(["board:update"]);
    expect(error?.message).toContain("Missing required flag board");
  });

  it("warns when no update flags provided", async () => {
    const { error } = await runCommand(["board:update", "--board", "MyBoard"]);
    expect(error?.oclif?.exit).toBe(1);
  });

  it("updates board name only", async () => {
    const { error } = await runCommand([
      "board:update", "--board", "MyBoard", "--name", "NewName", "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateBoard).toHaveBeenCalledTimes(1);
    expect(updateBoard).toHaveBeenCalledWith(
      expect.objectContaining({ id: "board123", name: "NewName" })
    );
  });

  it("updates board description only", async () => {
    const { error } = await runCommand([
      "board:update", "--board", "MyBoard", "--description", "NewDesc", "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateBoard).toHaveBeenCalledWith(
      expect.objectContaining({ id: "board123", desc: "NewDesc" })
    );
  });

  it("updates multiple fields at once", async () => {
    await runCommand([
      "board:update", "--board", "MyBoard", "--name", "NewName", "--description", "NewDesc", "--format", "json",
    ]);
    expect(updateBoard).toHaveBeenCalledWith(
      expect.objectContaining({ id: "board123", name: "NewName", desc: "NewDesc" })
    );
  });

  it("calls cache.sync() after successful update", async () => {
    await runCommand([
      "board:update", "--board", "MyBoard", "--name", "NewName", "--format", "json",
    ]);
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "board:update", "--board", "MyBoard", "--name", "NewName", "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("board123");
    expect(output.name).toBe("UpdatedBoard");
    expect(output.desc).toBe("Updated description");
    expect(output.url).toBe("https://trello.com/b/board123");
    expect(output.closed).toBe(false);
  });
});
