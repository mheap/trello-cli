import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockComment = {
  id: "comment1",
  data: { text: "This is a comment" },
  date: "2026-01-15T10:00:00.000Z",
  memberCreator: { fullName: "John Doe" },
};

const addCardComment = jest.fn().mockResolvedValue(mockComment);
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { addCardComment },
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

  addCardComment.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:comment", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:comment"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("calls addCardComment with correct params", async () => {
    const { error } = await runCommand([
      "card:comment",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--text", "Hello",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(addCardComment).toHaveBeenCalledTimes(1);
    expect(addCardComment).toHaveBeenCalledWith({
      id: "card123",
      text: "Hello",
    });
  });

  it("resolves card name to ID via board/list lookups", async () => {
    await runCommand([
      "card:comment",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--text", "Hello",
      "--format", "json",
    ]);
    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
    expect(mockGetListIdByBoardAndName).toHaveBeenCalledWith("board123", "ToDo");
    expect(getListCards).toHaveBeenCalledWith({ id: "list123" });
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "card:comment",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--text", "Hello",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("comment1");
    expect(output.text).toBe("This is a comment");
    expect(output.date).toBe("2026-01-15T10:00:00.000Z");
    expect(output.memberCreator).toBe("John Doe");
  });
});
