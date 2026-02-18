import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockActions = [
  {
    id: "action1",
    data: { text: "First comment" },
    memberCreator: { fullName: "John Doe" },
    date: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "action2",
    data: { text: "Second comment" },
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

describe("card:comments", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:comments"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("calls getCardActions with correct params", async () => {
    const { error } = await runCommand([
      "card:comments",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(getCardActions).toHaveBeenCalledTimes(1);
    expect(getCardActions).toHaveBeenCalledWith({
      id: "card123",
      filter: "commentCard",
    });
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "card:comments",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toHaveLength(2);
    expect(output[0].id).toBe("action1");
    expect(output[0].text).toBe("First comment");
    expect(output[0].author).toBe("John Doe");
    expect(output[0].date).toBe("2026-01-15T10:00:00.000Z");
  });

  it("handles empty comments array", async () => {
    getCardActions.mockResolvedValueOnce([]);
    await runCommand([
      "card:comments",
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
