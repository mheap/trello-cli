import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";

const deleteCardLabel = jest.fn().mockResolvedValue(undefined);
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { deleteCardLabel },
    lists: { getListCards },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");
const mockGetListIdByBoardAndName = jest.fn().mockResolvedValue("list123");
const mockGetLabelIdByName = jest.fn().mockResolvedValue("label1");

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getBoardIdByName: mockGetBoardIdByName,
      getListIdByBoardAndName: mockGetListIdByBoardAndName,
      getLabelIdByName: mockGetLabelIdByName,
    })),
  };
});

beforeEach(() => {
  jest
    .spyOn(Config.prototype, "getToken")
    .mockImplementation(() => Promise.resolve("fake_token"));
  jest
    .spyOn(Config.prototype, "getApiKey")
    .mockImplementation(() => Promise.resolve("fake_api_key"));

  deleteCardLabel.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
  mockGetLabelIdByName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:unlabel", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:unlabel"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("resolves label name to ID via cache", async () => {
    await runCommand([
      "card:unlabel",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--label", "Bug",
    ]);
    expect(mockGetLabelIdByName).toHaveBeenCalledWith("Bug");
  });

  it("calls deleteCardLabel with correct params", async () => {
    const { error } = await runCommand([
      "card:unlabel",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--label", "Bug",
    ]);
    expect(error).toBeUndefined();
    expect(deleteCardLabel).toHaveBeenCalledTimes(1);
    expect(deleteCardLabel).toHaveBeenCalledWith({
      id: "card123",
      idLabel: "label1",
    });
  });
});
