import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockCard = {
  id: "abc123",
  name: "Test Card",
  due: "2024-12-31T00:00:00.000Z",
  desc: "Test description",
  labels: [{ id: "label1", name: "Bug", color: "red" }],
  url: "https://trello.com/c/abc123/test-card",
  idMembers: ["member1", "member2"],
};

const mockMembers = [
  { id: "member1", fullName: "John Doe" },
  { id: "member2", fullName: "Jane Smith" },
];

const getCard = jest.fn().mockResolvedValue(mockCard);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: {
      getCard,
    },
  })),
}));

const mockConvertMemberIdsToEntity = jest
  .fn()
  .mockResolvedValue(mockMembers);

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      convertMemberIdsToEntity: mockConvertMemberIdsToEntity,
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

  // Capture stdout from oclif's ux module
  stdoutSpy = jest.spyOn(ux, "stdout").mockImplementation(() => {});

  getCard.mockClear();
  mockConvertMemberIdsToEntity.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:get-by-id", () => {
  it("throws when --id flag is missing", async () => {
    const { error } = await runCommand(["card:get-by-id"]);
    expect(error?.message).toContain("Missing required flag id");
  });

  it("fetches card by ID and outputs JSON", async () => {
    await runCommand(["card:get-by-id", "--id", "abc123", "--format", "json"]);
    expect(getCard).toHaveBeenCalledTimes(1);
    expect(getCard).toHaveBeenCalledWith({ id: "abc123" });

    // Get the output that was passed to ux.stdout
    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("abc123");
    expect(output.name).toBe("Test Card");
    expect(output.description).toBe("Test description");
    expect(output.url).toBe("https://trello.com/c/abc123/test-card");
  });

  it("converts member IDs to entities", async () => {
    await runCommand(["card:get-by-id", "--id", "abc123", "--format", "json"]);
    expect(mockConvertMemberIdsToEntity).toHaveBeenCalledTimes(1);
    expect(mockConvertMemberIdsToEntity).toHaveBeenCalledWith(["member1", "member2"]);

    // Get the output that was passed to ux.stdout
    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.members).toEqual(mockMembers);
  });

  it("passes the correct ID to the API", async () => {
    await runCommand(["card:get-by-id", "--id", "different-id", "--format", "json"]);
    expect(getCard).toHaveBeenCalledWith({ id: "different-id" });
  });
});
