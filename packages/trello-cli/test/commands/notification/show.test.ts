import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockNotification = {
  id: "notif1",
  type: "mentionedOnCard",
  unread: true,
  date: "2026-06-01T10:00:00.000Z",
  memberCreator: { fullName: "John Doe" },
  board: { name: "Backend" },
  card: { name: "Fix login bug" },
  data: { text: "hey @me" },
};

const getNotification = jest.fn().mockResolvedValue(mockNotification);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    notifications: { getNotification },
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

  getNotification.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("notification:show", () => {
  it("throws when --id flag is missing", async () => {
    const { error } = await runCommand(["notification:show"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("calls getNotification with correct params", async () => {
    const { error } = await runCommand([
      "notification:show",
      "--id", "notif1",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(getNotification).toHaveBeenCalledTimes(1);
    expect(getNotification).toHaveBeenCalledWith({
      id: "notif1",
      board: true,
      card: true,
      memberCreator: true,
    });
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "notification:show",
      "--id", "notif1",
      "--format", "json",
    ]);
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output.id).toBe("notif1");
    expect(output.creator).toBe("John Doe");
    expect(output.board).toBe("Backend");
    expect(output.card).toBe("Fix login bug");
  });
});
