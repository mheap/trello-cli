import { test } from "@oclif/test";
import Config from "@trello-cli/config";
import Cache from "@trello-cli/cache";

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

let convertMemberIdsToEntity: jest.SpyInstance;

beforeEach(() => {
  jest
    .spyOn(Config.prototype, "getToken")
    .mockImplementation(() => Promise.resolve("fake_token"));
  jest
    .spyOn(Config.prototype, "getApiKey")
    .mockImplementation(() => Promise.resolve("fake_api_key"));

  convertMemberIdsToEntity = jest
    .spyOn(Cache.prototype, "convertMemberIdsToEntity")
    .mockImplementation(() => Promise.resolve(mockMembers) as any);

  getCard.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:get-by-id", () => {
  test
    .stdout()
    .command(["card:get-by-id"])
    .catch((err) => expect(err.message).toContain("Missing required flag id"))
    .it("throws when --id flag is missing");

  test
    .stdout()
    .command(["card:get-by-id", "--id", "abc123", "--format", "json"])
    .it("fetches card by ID and outputs JSON", (ctx) => {
      expect(getCard).toHaveBeenCalledTimes(1);
      expect(getCard).toHaveBeenCalledWith({ id: "abc123" });

      const output = JSON.parse(ctx.stdout);
      expect(output.id).toBe("abc123");
      expect(output.name).toBe("Test Card");
      expect(output.description).toBe("Test description");
      expect(output.url).toBe("https://trello.com/c/abc123/test-card");
    });

  test
    .stdout()
    .command(["card:get-by-id", "--id", "abc123", "--format", "json"])
    .it("converts member IDs to entities", (ctx) => {
      expect(convertMemberIdsToEntity).toHaveBeenCalledTimes(1);
      expect(convertMemberIdsToEntity).toHaveBeenCalledWith(["member1", "member2"]);

      const output = JSON.parse(ctx.stdout);
      expect(output.members).toEqual(mockMembers);
    });

  test
    .stdout()
    .command(["card:get-by-id", "--id", "different-id", "--format", "json"])
    .it("passes the correct ID to the API", () => {
      expect(getCard).toHaveBeenCalledWith({ id: "different-id" });
    });
});
