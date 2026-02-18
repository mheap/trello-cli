import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockLabel = { id: "label1", name: "NewText", color: "red" };

const createBoardLabel = jest.fn().mockResolvedValue(mockLabel);
const updateLabel = jest.fn().mockResolvedValue(mockLabel);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    boards: {
      createBoardLabel,
    },
    labels: {
      updateLabel,
    },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");
const mockGetLabelsByBoardAndColor = jest
  .fn()
  .mockResolvedValue([]);
const mockSync = jest.fn().mockResolvedValue(undefined);

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getBoardIdByName: mockGetBoardIdByName,
      getLabelsByBoardAndColor: mockGetLabelsByBoardAndColor,
      sync: mockSync,
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

  createBoardLabel.mockClear();
  updateLabel.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetLabelsByBoardAndColor.mockClear();
  mockSync.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("label:update", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["label:update"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("creates a label when no matching color exists on the board", async () => {
    mockGetLabelsByBoardAndColor.mockResolvedValueOnce([]);

    const { error } = await runCommand([
      "label:update",
      "--board", "MyBoard",
      "--color", "red",
      "--name", "NewText",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(mockGetLabelsByBoardAndColor).toHaveBeenCalledWith(
      "board123", "red",
    );
    expect(createBoardLabel).toHaveBeenCalledWith({
      id: "board123",
      name: "NewText",
      color: "red",
    });
    expect(updateLabel).not.toHaveBeenCalled();
  });

  it("updates the label when exactly one matching color exists", async () => {
    mockGetLabelsByBoardAndColor.mockResolvedValueOnce([
      { id: "label456", name: "OldText" },
    ]);

    const { error } = await runCommand([
      "label:update",
      "--board", "MyBoard",
      "--color", "red",
      "--name", "NewText",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateLabel).toHaveBeenCalledWith({
      id: "label456",
      name: "NewText",
    });
    expect(createBoardLabel).not.toHaveBeenCalled();
  });

  it("errors when multiple labels match and --old-name is not provided", async () => {
    mockGetLabelsByBoardAndColor.mockResolvedValueOnce([
      { id: "label1", name: "Bug" },
      { id: "label2", name: "Urgent" },
    ]);

    const { error } = await runCommand([
      "label:update",
      "--board", "MyBoard",
      "--color", "red",
      "--name", "NewText",
      "--format", "json",
    ]);
    expect(error?.message).toContain("Multiple labels with color [red]");
    expect(error?.message).toContain("--old-name");
  });

  it("updates the correct label when --old-name disambiguates", async () => {
    mockGetLabelsByBoardAndColor.mockResolvedValueOnce([
      { id: "label1", name: "Bug" },
      { id: "label2", name: "Urgent" },
    ]);

    const { error } = await runCommand([
      "label:update",
      "--board", "MyBoard",
      "--color", "red",
      "--name", "NewText",
      "--old-name", "Bug",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateLabel).toHaveBeenCalledWith({
      id: "label1",
      name: "NewText",
    });
  });

  it("errors when --old-name does not match any label", async () => {
    mockGetLabelsByBoardAndColor.mockResolvedValueOnce([
      { id: "label1", name: "Bug" },
      { id: "label2", name: "Urgent" },
    ]);

    const { error } = await runCommand([
      "label:update",
      "--board", "MyBoard",
      "--color", "red",
      "--name", "NewText",
      "--old-name", "Missing",
      "--format", "json",
    ]);
    expect(error?.message).toContain("No label with color [red] and name [Missing]");
  });

  it("calls cache.sync() after creation", async () => {
    mockGetLabelsByBoardAndColor.mockResolvedValueOnce([]);

    await runCommand([
      "label:update",
      "--board", "MyBoard",
      "--color", "blue",
      "--name", "NewText",
      "--format", "json",
    ]);
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it("calls cache.sync() after update", async () => {
    mockGetLabelsByBoardAndColor.mockResolvedValueOnce([
      { id: "label456", name: "OldText" },
    ]);

    await runCommand([
      "label:update",
      "--board", "MyBoard",
      "--color", "blue",
      "--name", "NewText",
      "--format", "json",
    ]);
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it("outputs correct JSON shape after update", async () => {
    mockGetLabelsByBoardAndColor.mockResolvedValueOnce([
      { id: "label456", name: "OldText" },
    ]);

    await runCommand([
      "label:update",
      "--board", "MyBoard",
      "--color", "red",
      "--name", "NewText",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("label1");
    expect(output.name).toBe("NewText");
    expect(output.color).toBe("red");
  });
});
