import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockNotifications = [
  {
    id: "notif1",
    type: "mentionedOnCard",
    unread: true,
    date: "2026-06-01T10:00:00.000Z",
    memberCreator: { fullName: "John Doe" },
    data: { card: { name: "Fix login bug" }, board: { name: "Backend" }, text: "" },
  },
  {
    id: "notif2",
    type: "commentCard",
    unread: false,
    date: "2026-06-02T12:00:00.000Z",
    memberCreator: { fullName: "Jane Smith" },
    data: { text: "Please review", card: { name: "Add tests" } },
  },
];

const getMemberNotifications = jest.fn().mockResolvedValue(mockNotifications);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    members: { getMemberNotifications },
  })),
}));

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({})),
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

  getMemberNotifications.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("notification:list", () => {
  it("calls getMemberNotifications with default params", async () => {
    const { error } = await runCommand(["notification:list", "--format", "json"]);
    expect(error).toBeUndefined();
    expect(getMemberNotifications).toHaveBeenCalledTimes(1);
    expect(getMemberNotifications).toHaveBeenCalledWith({
      id: "me",
      readFilter: "all",
      limit: 50,
      memberCreator: true,
    });
  });

  it("passes filter and limit flags through", async () => {
    await runCommand([
      "notification:list",
      "--filter", "unread",
      "--limit", "10",
      "--format", "json",
    ]);
    expect(getMemberNotifications).toHaveBeenCalledWith({
      id: "me",
      readFilter: "unread",
      limit: 10,
      memberCreator: true,
    });
  });

  it("outputs correct JSON shape", async () => {
    await runCommand(["notification:list", "--format", "json"]);
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output).toHaveLength(2);
    expect(output[0].id).toBe("notif1");
    expect(output[0].type).toBe("mentionedOnCard");
    expect(output[0].unread).toBe(true);
    expect(output[0].creator).toBe("John Doe");
    expect(output[0].summary).toBe("Fix login bug");
    expect(output[1].summary).toBe("Please review");
  });

  it("handles empty notifications array", async () => {
    getMemberNotifications.mockResolvedValueOnce([]);
    await runCommand(["notification:list", "--format", "json"]);
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output).toHaveLength(0);
  });
});
