import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockChecklists = [
  {
    id: "cl1",
    name: "My Checklist",
    checkItems: [
      { name: "Item 1", state: "complete" },
      { name: "Item 2", state: "incomplete" },
    ],
  },
];

const getCardChecklists = jest.fn().mockResolvedValue(mockChecklists);
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { getCardChecklists },
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

  getCardChecklists.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:checklists", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:checklists"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("calls getCardChecklists with correct card ID", async () => {
    const { error } = await runCommand([
      "card:checklists",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(getCardChecklists).toHaveBeenCalledTimes(1);
    expect(getCardChecklists).toHaveBeenCalledWith({ id: "card123" });
  });

  it("outputs correct JSON shape with normalized items", async () => {
    await runCommand([
      "card:checklists",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toHaveLength(1);
    expect(output[0].id).toBe("cl1");
    expect(output[0].name).toBe("My Checklist");
    expect(output[0].items).toHaveLength(2);
    expect(output[0].items[0]).toEqual({ name: "Item 1", state: "complete" });
    expect(output[0].items[1]).toEqual({ name: "Item 2", state: "incomplete" });
  });

  it("handles empty checklists array", async () => {
    getCardChecklists.mockResolvedValueOnce([]);
    await runCommand([
      "card:checklists",
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
