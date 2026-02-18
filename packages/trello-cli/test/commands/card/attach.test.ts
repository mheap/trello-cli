import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockAttachment = {
  id: "att1",
  name: "Design Doc",
  url: "https://example.com/doc",
};

const createCardAttachment = jest.fn().mockResolvedValue(mockAttachment);
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { createCardAttachment },
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

  createCardAttachment.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:attach", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:attach"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("calls createCardAttachment with correct params", async () => {
    const { error } = await runCommand([
      "card:attach",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--url", "https://example.com/doc",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(createCardAttachment).toHaveBeenCalledTimes(1);
    expect(createCardAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ id: "card123", url: "https://example.com/doc" })
    );
  });

  it("passes optional name when provided", async () => {
    await runCommand([
      "card:attach",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--url", "https://example.com/doc",
      "--name", "MyDoc",
      "--format", "json",
    ]);
    expect(createCardAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ id: "card123", url: "https://example.com/doc", name: "MyDoc" })
    );
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "card:attach",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--url", "https://example.com/doc",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("att1");
    expect(output.name).toBe("Design Doc");
    expect(output.url).toBe("https://example.com/doc");
  });
});
