import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockList = { id: "list123", name: "NewName" };

const updateList = jest.fn().mockResolvedValue(mockList);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    lists: { updateList },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");
const mockGetListIdByBoardAndName = jest.fn().mockResolvedValue("list123");
const mockSync = jest.fn().mockResolvedValue(undefined);

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getBoardIdByName: mockGetBoardIdByName,
      getListIdByBoardAndName: mockGetListIdByBoardAndName,
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

  updateList.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
  mockSync.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("list:rename", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["list:rename"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("resolves old list name to ID via board/list lookups", async () => {
    await runCommand([
      "list:rename",
      "--board", "MyBoard",
      "--list", "OldName",
      "--name", "NewName",
      "--format", "json",
    ]);
    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
    expect(mockGetListIdByBoardAndName).toHaveBeenCalledWith("board123", "OldName");
  });

  it("calls updateList with correct params", async () => {
    const { error } = await runCommand([
      "list:rename",
      "--board", "MyBoard",
      "--list", "OldName",
      "--name", "NewName",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateList).toHaveBeenCalledTimes(1);
    expect(updateList).toHaveBeenCalledWith({ id: "list123", name: "NewName" });
  });

  it("calls cache.sync() after successful rename", async () => {
    await runCommand([
      "list:rename",
      "--board", "MyBoard",
      "--list", "OldName",
      "--name", "NewName",
      "--format", "json",
    ]);
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "list:rename",
      "--board", "MyBoard",
      "--list", "OldName",
      "--name", "NewName",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("list123");
    expect(output.name).toBe("NewName");
  });
});
