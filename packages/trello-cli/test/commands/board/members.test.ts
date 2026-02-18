import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockMembers = [
  { id: "mem1", username: "johndoe", fullName: "John Doe" },
  { id: "mem2", username: "janesmith", fullName: "Jane Smith" },
];

const getBoardMembers = jest.fn().mockResolvedValue(mockMembers);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    boards: {
      getBoardMembers,
    },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getBoardIdByName: mockGetBoardIdByName,
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

  getBoardMembers.mockClear();
  mockGetBoardIdByName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("board:members", () => {
  it("throws when --board flag is missing", async () => {
    const { error } = await runCommand(["board:members"]);
    expect(error?.message).toContain("Missing required flag board");
  });

  it("calls getBoardMembers with correct board ID", async () => {
    const { error } = await runCommand(["board:members", "--board", "MyBoard", "--format", "json"]);
    expect(error).toBeUndefined();
    expect(getBoardMembers).toHaveBeenCalledTimes(1);
    expect(getBoardMembers).toHaveBeenCalledWith({ id: "board123" });
  });

  it("resolves board name to ID via cache lookup", async () => {
    await runCommand(["board:members", "--board", "MyBoard", "--format", "json"]);
    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
  });

  it("outputs correct JSON shape", async () => {
    await runCommand(["board:members", "--board", "MyBoard", "--format", "json"]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toHaveLength(2);
    expect(output[0].id).toBe("mem1");
    expect(output[0].username).toBe("johndoe");
    expect(output[0].fullName).toBe("John Doe");
    expect(output[1].id).toBe("mem2");
    expect(output[1].username).toBe("janesmith");
    expect(output[1].fullName).toBe("Jane Smith");
  });

  it("returns all members in the array", async () => {
    await runCommand(["board:members", "--board", "MyBoard", "--format", "json"]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toHaveLength(mockMembers.length);
  });
});
