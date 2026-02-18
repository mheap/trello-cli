import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockSearchResults = {
  cards: [
    { id: "card1", name: "Test Card", url: "https://trello.com/c/card1", idBoard: "board1" },
  ],
  boards: [
    { id: "board1", name: "Test Board", url: "https://trello.com/b/board1" },
  ],
};

const getSearch = jest.fn().mockResolvedValue(mockSearchResults);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    search: { getSearch },
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

  getSearch.mockClear();
  mockGetBoardIdByName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("search", () => {
  it("throws when --query flag is missing", async () => {
    const { error } = await runCommand(["search"]);
    expect(error?.message).toContain("Missing required flag query");
  });

  it("calls getSearch with query", async () => {
    const { error } = await runCommand(["search", "--query", "test", "--format", "json"]);
    expect(error).toBeUndefined();
    expect(getSearch).toHaveBeenCalledTimes(1);
    expect(getSearch).toHaveBeenCalledWith(
      expect.objectContaining({ query: "test" })
    );
  });

  it("passes idBoards when --board is provided", async () => {
    await runCommand(["search", "--query", "test", "--board", "MyBoard", "--format", "json"]);
    expect(getSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "test",
        idBoards: "board123",
      })
    );
  });

  it("passes modelTypes when --type is provided", async () => {
    await runCommand(["search", "--query", "test", "--type", "cards", "--format", "json"]);
    expect(getSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "test",
        modelTypes: "cards",
      })
    );
  });

  it("outputs correct JSON shape", async () => {
    await runCommand(["search", "--query", "test", "--format", "json"]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.cards).toHaveLength(1);
    expect(output.cards[0].id).toBe("card1");
    expect(output.cards[0].name).toBe("Test Card");
    expect(output.cards[0].board).toBe("board1");
    expect(output.boards).toHaveLength(1);
    expect(output.boards[0].id).toBe("board1");
    expect(output.boards[0].name).toBe("Test Board");
  });

  it("handles empty results", async () => {
    getSearch.mockResolvedValueOnce({ cards: [], boards: [] });
    await runCommand(["search", "--query", "nothing", "--format", "json"]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.cards).toHaveLength(0);
    expect(output.boards).toHaveLength(0);
  });
});
