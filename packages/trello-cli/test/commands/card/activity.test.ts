import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockActions = [
  {
    id: "action1",
    type: "commentCard",
    data: {
      text: "First comment",
      card: { name: "TestCard" },
      list: { name: "ToDo" },
      board: { name: "MyBoard" },
    },
    memberCreator: { fullName: "John Doe" },
    date: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "action2",
    type: "updateCard",
    data: {
      card: { name: "TestCard" },
      list: { name: "Done" },
      board: { name: "MyBoard" },
    },
    memberCreator: { fullName: "Jane Smith" },
    date: "2026-01-16T12:00:00.000Z",
  },
];

const getCardActions = jest.fn().mockResolvedValue(mockActions);
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { getCardActions },
    lists: { getListCards },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");
const mockGetListIdByBoardAndName = jest.fn().mockResolvedValue("list123");

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getBoardIdByName: mockGetBoardIdByName,
      getListIdByBoardAndName: mockGetListIdByBoardAndName,
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

  getCardActions.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:activity", () => {
  it("throws when no flags are provided", async () => {
    const { error } = await runCommand(["card:activity"]);
    expect(error?.message).toBeDefined();
  });

  it("accepts --id flag directly without board/list/card", async () => {
    await runCommand([
      "card:activity",
      "--id", "card123",
      "--format", "json",
    ]);
    expect(getCardActions).toHaveBeenCalledWith({
      id: "card123",
    });
    expect(mockGetBoardIdByName).not.toHaveBeenCalled();
    expect(mockGetListIdByBoardAndName).not.toHaveBeenCalled();
    expect(getListCards).not.toHaveBeenCalled();
  });

  it("accepts --id with --filter", async () => {
    await runCommand([
      "card:activity",
      "--id", "card123",
      "--filter", "commentCard",
      "--format", "json",
    ]);
    expect(getCardActions).toHaveBeenCalledWith({
      id: "card123",
      filter: "commentCard",
    });
  });

  it("calls getCardActions without a filter by default", async () => {
    const { error } = await runCommand([
      "card:activity",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(getCardActions).toHaveBeenCalledTimes(1);
    expect(getCardActions).toHaveBeenCalledWith({
      id: "card123",
    });
  });

  it("passes the filter flag to getCardActions", async () => {
    await runCommand([
      "card:activity",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--filter", "commentCard,updateCard",
      "--format", "json",
    ]);
    expect(getCardActions).toHaveBeenCalledWith({
      id: "card123",
      filter: "commentCard,updateCard",
    });
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "card:activity",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toHaveLength(2);
    expect(output[0].id).toBe("action1");
    expect(output[0].type).toBe("commentCard");
    expect(output[0].text).toBe("First comment");
    expect(output[0].author).toBe("John Doe");
    expect(output[0].card).toBe("TestCard");
    expect(output[0].list).toBe("ToDo");
    expect(output[0].board).toBe("MyBoard");
  });

  it("handles empty actions array", async () => {
    getCardActions.mockResolvedValueOnce([]);
    await runCommand([
      "card:activity",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toHaveLength(0);
  });
});
