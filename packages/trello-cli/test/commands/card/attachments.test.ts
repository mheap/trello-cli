import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockAttachments = [
  { id: "att1", name: "Design Doc", url: "https://example.com/doc", date: "2024-01-15T00:00:00.000Z" },
  { id: "att2", name: "Screenshot", url: "https://example.com/img.png", date: "2024-01-16T00:00:00.000Z" },
];

const getCardAttachments = jest.fn().mockResolvedValue(mockAttachments);
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { getCardAttachments },
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

  getCardAttachments.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:attachments", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:attachments"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("calls getCardAttachments with correct card ID", async () => {
    const { error } = await runCommand([
      "card:attachments",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(getCardAttachments).toHaveBeenCalledTimes(1);
    expect(getCardAttachments).toHaveBeenCalledWith({ id: "card123" });
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "card:attachments",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toHaveLength(2);
    expect(output[0].id).toBe("att1");
    expect(output[0].name).toBe("Design Doc");
    expect(output[0].url).toBe("https://example.com/doc");
    expect(output[0].date).toBe("2024-01-15T00:00:00.000Z");
  });

  it("handles empty attachments array", async () => {
    getCardAttachments.mockResolvedValueOnce([]);
    await runCommand([
      "card:attachments",
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
