import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockLabels = [
  { id: "label1", name: "Bug", color: "red" },
  { id: "label2", name: "Feature", color: "green" },
  { id: "label3", name: "", color: "blue" },
];

const getBoardLabels = jest.fn().mockResolvedValue(mockLabels);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    boards: {
      getBoardLabels,
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

  getBoardLabels.mockClear();
  mockGetBoardIdByName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("label:list", () => {
  it("throws when --board flag is missing", async () => {
    const { error } = await runCommand(["label:list"]);
    expect(error?.message).toContain("Missing required flag board");
  });

  it("calls getBoardLabels with correct board ID", async () => {
    const { error } = await runCommand(["label:list", "--board", "MyBoard", "--format", "json"]);
    expect(error).toBeUndefined();
    expect(getBoardLabels).toHaveBeenCalledTimes(1);
    expect(getBoardLabels).toHaveBeenCalledWith({ id: "board123" });
  });

  it("outputs correct JSON shape", async () => {
    await runCommand(["label:list", "--board", "MyBoard", "--format", "json"]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toHaveLength(2);
    expect(output[0].id).toBe("label1");
    expect(output[0].name).toBe("Bug");
    expect(output[0].color).toBe("red");
    expect(output[1].id).toBe("label2");
    expect(output[1].name).toBe("Feature");
    expect(output[1].color).toBe("green");
  });

  it("filters out labels with empty names", async () => {
    await runCommand(["label:list", "--board", "MyBoard", "--format", "json"]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toHaveLength(2);
    expect(output.find((l: any) => l.id === "label3")).toBeUndefined();
  });
});
