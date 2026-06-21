import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";

const markAllNotificationsAsRead = jest.fn().mockResolvedValue(undefined);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    notifications: { markAllNotificationsAsRead },
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

  markAllNotificationsAsRead.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("notification:read-all", () => {
  it("calls markAllNotificationsAsRead once", async () => {
    const { error } = await runCommand(["notification:read-all"]);
    expect(error).toBeUndefined();
    expect(markAllNotificationsAsRead).toHaveBeenCalledTimes(1);
  });
});
