import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockChecklist = { id: "cl1", name: "MyChecklist" };

const createCardChecklist = jest.fn().mockResolvedValue(mockChecklist);
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { createCardChecklist },
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

  createCardChecklist.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:checklist", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:checklist"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("calls createCardChecklist with correct params", async () => {
    const { error } = await runCommand([
      "card:checklist",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--name", "MyChecklist",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(createCardChecklist).toHaveBeenCalledTimes(1);
    expect(createCardChecklist).toHaveBeenCalledWith({
      id: "card123",
      name: "MyChecklist",
    });
  });

  it("resolves card name to ID via board/list lookups", async () => {
    await runCommand([
      "card:checklist",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--name", "MyChecklist",
      "--format", "json",
    ]);
    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
    expect(mockGetListIdByBoardAndName).toHaveBeenCalledWith("board123", "ToDo");
    expect(getListCards).toHaveBeenCalledWith({ id: "list123" });
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "card:checklist",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--name", "MyChecklist",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("cl1");
    expect(output.name).toBe("MyChecklist");
  });
});
