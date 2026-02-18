import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockResult = {
  id: "card123",
  name: "TestCard",
  labels: [{ id: "label1", name: "Bug", color: "red" }],
};

const addCardLabel = jest.fn().mockResolvedValue(mockResult);
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { addCardLabel },
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

let stdoutSpy: jest.SpyInstance;

beforeEach(() => {
  jest
    .spyOn(Config.prototype, "getToken")
    .mockImplementation(() => Promise.resolve("fake_token"));
  jest
    .spyOn(Config.prototype, "getApiKey")
    .mockImplementation(() => Promise.resolve("fake_api_key"));

  stdoutSpy = jest.spyOn(ux, "stdout").mockImplementation(() => {});

  addCardLabel.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
  mockGetLabelIdByName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:label", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:label"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("resolves label name to ID via cache", async () => {
    await runCommand([
      "card:label",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--label", "Bug",
      "--format", "json",
    ]);
    expect(mockGetLabelIdByName).toHaveBeenCalledWith("Bug");
  });

  it("calls addCardLabel with correct params", async () => {
    const { error } = await runCommand([
      "card:label",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--label", "Bug",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(addCardLabel).toHaveBeenCalledTimes(1);
    expect(addCardLabel).toHaveBeenCalledWith({
      id: "card123",
      value: "label1",
    });
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "card:label",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--label", "Bug",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("card123");
    expect(output.name).toBe("TestCard");
    expect(output.labels).toEqual([{ id: "label1", name: "Bug", color: "red" }]);
  });
});
