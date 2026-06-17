import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";

const updateNotification = jest
  .fn()
  .mockResolvedValue({ id: "notif1", unread: true });

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    notifications: { updateNotification },
  })),
}));

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({})),
  };
});

beforeEach(() => {
  jest
    .spyOn(Config.prototype, "getToken")
    .mockImplementation(() => Promise.resolve("fake_token"));
  jest
    .spyOn(Config.prototype, "getApiKey")
    .mockImplementation(() => Promise.resolve("fake_api_key"));

  updateNotification.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("notification:unread", () => {
  it("throws when --id flag is missing", async () => {
    const { error } = await runCommand(["notification:unread"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("calls updateNotification with unread true", async () => {
    const { error } = await runCommand([
      "notification:unread",
      "--id", "notif1",
    ]);
    expect(error).toBeUndefined();
    expect(updateNotification).toHaveBeenCalledTimes(1);
    expect(updateNotification).toHaveBeenCalledWith({
      id: "notif1",
      unread: true,
    });
  });
});
