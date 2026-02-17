import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockCard = {
  id: "card123",
  name: "TestCard",
  due: null,
  desc: "Original description",
  labels: [{ id: "label1", name: "Bug", color: "red" }],
  url: "https://trello.com/c/card123/test-card",
};

const updateCard = jest.fn().mockResolvedValue(mockCard);
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { updateCard },
    lists: { getListCards },
  })),
}));

const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");
const mockGetListIdByBoardAndName = jest.fn().mockResolvedValue("list123");

jest.mock("@trello-cli/cache", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getBoardIdByName: mockGetBoardIdByName,
      getListIdByBoardAndName: mockGetListIdByBoardAndName,
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

  updateCard.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function run(args: string[]) {
  const result = await runCommand(["card:update", ...args]);
  if (result.error) {
    throw result.error;
  }
  return result;
}

describe("card:update", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:update"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("updates card name", async () => {
    await run([
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--name", "NewName",
      "--format", "json",
    ]);

    expect(updateCard).toHaveBeenCalledTimes(1);
    expect(updateCard).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "card123",
        name: "NewName",
      })
    );
  });

  it("updates card description", async () => {
    await run([
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--description", "NewDescription",
      "--format", "json",
    ]);

    expect(updateCard).toHaveBeenCalledTimes(1);
    expect(updateCard).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "card123",
        desc: "NewDescription",
      })
    );
  });

  it("updates card due date", async () => {
    await run([
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--due", "2026-12-31",
      "--format", "json",
    ]);

    expect(updateCard).toHaveBeenCalledTimes(1);
    const call = updateCard.mock.calls[0][0];
    expect(call.id).toBe("card123");
    expect(call.due).toBeDefined();
    const dueDate = new Date(call.due);
    expect(dueDate.toISOString()).toContain("2026-12-31");
  });

  it("clears due date with --clear-due", async () => {
    await run([
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--clear-due",
      "--format", "json",
    ]);

    expect(updateCard).toHaveBeenCalledTimes(1);
    expect(updateCard).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "card123",
        due: "",
      })
    );
  });

  it("updates multiple fields at once", async () => {
    await run([
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--name", "NewName",
      "--description", "NewDesc",
      "--format", "json",
    ]);

    expect(updateCard).toHaveBeenCalledTimes(1);
    expect(updateCard).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "card123",
        name: "NewName",
        desc: "NewDesc",
      })
    );
  });

  it("outputs correct JSON shape", async () => {
    updateCard.mockResolvedValueOnce({
      ...mockCard,
      name: "UpdatedName",
      desc: "UpdatedDesc",
    });

    await run([
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--name", "UpdatedName",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("card123");
    expect(output.name).toBe("UpdatedName");
    expect(output.description).toBe("UpdatedDesc");
    expect(output.url).toBe("https://trello.com/c/card123/test-card");
    expect(output.labels).toEqual(mockCard.labels);
  });

  it("resolves card name to ID via board and list lookups", async () => {
    await run([
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--name", "Renamed",
      "--format", "json",
    ]);

    expect(getListCards).toHaveBeenCalledWith({ id: "list123" });
    expect(updateCard.mock.calls[0][0].id).toBe("card123");
  });
});
