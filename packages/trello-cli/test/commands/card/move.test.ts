import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";

const updateCard = jest.fn().mockResolvedValue({
  id: "card123",
  name: "TestCard",
  desc: "",
  labels: [],
  url: "https://trello.com/c/card123",
});
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { updateCard },
    lists: { getListCards },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");
const mockGetListIdByBoardAndName = jest.fn((boardId: string, value: string) =>
  Promise.resolve(value === "ToDo" ? "list123" : "destination-list123")
);

jest.mock("@trello-cli/cache", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getBoardIdByName: mockGetBoardIdByName,
    getListIdByBoardAndName: mockGetListIdByBoardAndName,
  })),
}));

beforeEach(() => {
  jest
    .spyOn(Config.prototype, "getToken")
    .mockImplementation(() => Promise.resolve("fake_token"));
  jest
    .spyOn(Config.prototype, "getApiKey")
    .mockImplementation(() => Promise.resolve("fake_api_key"));

  updateCard.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:move", () => {
  it("resolves a destination name within the selected board", async () => {
    const { error } = await runCommand([
      "card:move",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--to", "Done",
      "--format", "json",
    ]);

    expect(error).toBeUndefined();
    expect(mockGetListIdByBoardAndName).toHaveBeenCalledWith("board123", "Done");
    expect(updateCard).toHaveBeenCalledWith({
      id: "card123",
      idList: "destination-list123",
      pos: "bottom",
    });
  });

  it("uses --to as a list ID with a direct card ID", async () => {
    const { error } = await runCommand([
      "card:move",
      "--id", "card-direct-id",
      "--to", "destination-list-direct-id",
      "--format", "json",
    ]);

    expect(error).toBeUndefined();
    expect(updateCard).toHaveBeenCalledWith({
      id: "card-direct-id",
      idList: "destination-list-direct-id",
      pos: "bottom",
    });
    expect(mockGetBoardIdByName).not.toHaveBeenCalled();
    expect(mockGetListIdByBoardAndName).not.toHaveBeenCalled();
  });
});
