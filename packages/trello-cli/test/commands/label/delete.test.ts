import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";

const deleteLabel = jest.fn().mockResolvedValue(undefined);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    labels: {
      deleteLabel,
    },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");
const mockGetLabelIdByBoardAndColor = jest.fn().mockResolvedValue("label456");
const mockSync = jest.fn().mockResolvedValue(undefined);

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getBoardIdByName: mockGetBoardIdByName,
      getLabelIdByBoardAndColor: mockGetLabelIdByBoardAndColor,
      sync: mockSync,
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

  deleteLabel.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetLabelIdByBoardAndColor.mockClear();
  mockSync.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("label:delete", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["label:delete"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("resolves label by board and color then deletes", async () => {
    const { error } = await runCommand([
      "label:delete",
      "--board", "MyBoard",
      "--color", "red",
    ]);
    expect(error).toBeUndefined();
    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
    expect(mockGetLabelIdByBoardAndColor).toHaveBeenCalledWith(
      "board123", "red", undefined,
    );
    expect(deleteLabel).toHaveBeenCalledWith({ id: "label456" });
  });

  it("passes --text to cache lookup for disambiguation", async () => {
    const { error } = await runCommand([
      "label:delete",
      "--board", "MyBoard",
      "--color", "red",
      "--text", "Bug",
    ]);
    expect(error).toBeUndefined();
    expect(mockGetLabelIdByBoardAndColor).toHaveBeenCalledWith(
      "board123", "red", "Bug",
    );
    expect(deleteLabel).toHaveBeenCalledWith({ id: "label456" });
  });

  it("surfaces cache error when multiple labels match", async () => {
    mockGetLabelIdByBoardAndColor.mockRejectedValueOnce(
      new Error("Multiple labels with color [red] found on board. Use --text to disambiguate."),
    );

    const { error } = await runCommand([
      "label:delete",
      "--board", "MyBoard",
      "--color", "red",
    ]);
    expect(error?.message).toContain("Multiple labels with color [red]");
    expect(error?.message).toContain("--text");
  });

  it("calls cache.sync() after deletion", async () => {
    await runCommand([
      "label:delete",
      "--board", "MyBoard",
      "--color", "blue",
    ]);
    expect(mockSync).toHaveBeenCalledTimes(1);
  });
});
