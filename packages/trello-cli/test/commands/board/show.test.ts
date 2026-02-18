import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockBoard = {
  id: "board123",
  name: "MyBoard",
  desc: "Board description",
  url: "https://trello.com/b/board123",
  closed: false,
  shortLink: "board123",
};

const getBoard = jest.fn().mockResolvedValue(mockBoard);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    boards: {
      getBoard,
    },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getBoardIdByName: mockGetBoardIdByName,
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

  getBoard.mockClear();
  mockGetBoardIdByName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("board:show", () => {
  it("throws when --board flag is missing", async () => {
    const { error } = await runCommand(["board:show"]);
    expect(error?.message).toContain("Missing required flag board");
  });

  it("fetches board by ID and outputs JSON", async () => {
    const { error } = await runCommand(["board:show", "--board", "MyBoard", "--format", "json"]);
    expect(error).toBeUndefined();
    expect(getBoard).toHaveBeenCalledTimes(1);
    expect(getBoard).toHaveBeenCalledWith({ id: "board123" });

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("board123");
    expect(output.name).toBe("MyBoard");
    expect(output.description).toBe("Board description");
    expect(output.url).toBe("https://trello.com/b/board123");
    expect(output.closed).toBe(false);
  });

  it("resolves board name to ID via cache lookup", async () => {
    await runCommand(["board:show", "--board", "MyBoard", "--format", "json"]);
    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
  });

  it("exits with error when board is not found", async () => {
    mockGetBoardIdByName.mockRejectedValueOnce(new Error("Board [NonExistent] not found"));
    const { error } = await runCommand(["board:show", "--board", "NonExistent", "--format", "json"]);
    expect(error?.oclif?.exit).toBe(1);
  });
});
