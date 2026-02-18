import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockCards = [
  { id: "card1", name: "Card 1" },
  { id: "card2", name: "Card 2" },
];

const archiveAllCardsInList = jest.fn().mockResolvedValue(mockCards);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    lists: { archiveAllCardsInList },
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

  archiveAllCardsInList.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("list:archive-cards", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["list:archive-cards"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("calls archiveAllCardsInList with correct list ID", async () => {
    const { error } = await runCommand([
      "list:archive-cards",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(archiveAllCardsInList).toHaveBeenCalledTimes(1);
    expect(archiveAllCardsInList).toHaveBeenCalledWith({ id: "list123" });
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "list:archive-cards",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toHaveLength(2);
    expect(output[0].id).toBe("card1");
    expect(output[0].name).toBe("Card 1");
  });

  it("handles empty response", async () => {
    archiveAllCardsInList.mockResolvedValueOnce([]);
    await runCommand([
      "list:archive-cards",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toHaveLength(0);
  });
});
