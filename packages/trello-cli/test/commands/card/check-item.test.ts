import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

const mockCheckItem = {
  id: "checkitem1",
  name: "MyTask",
  state: "complete",
};

const updateCardCheckItem = jest.fn().mockResolvedValue(mockCheckItem);
const getCardChecklists = jest.fn().mockResolvedValue([
  {
    id: "cl1",
    name: "Checklist",
    checkItems: [
      { id: "checkitem1", name: "MyTask", state: "incomplete" },
      { id: "checkitem2", name: "OtherTask", state: "incomplete" },
    ],
  },
]);
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { updateCardCheckItem, getCardChecklists },
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

  updateCardCheckItem.mockClear();
  getCardChecklists.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:check-item", () => {
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:check-item"]);
    expect(error?.message).toContain("Missing required flag");
  });

  it("resolves item name to ID via getCardChecklists", async () => {
    const { error } = await runCommand([
      "card:check-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--item", "MyTask",
      "--state", "complete",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(getCardChecklists).toHaveBeenCalledWith({ id: "card123" });
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "checkitem1",
      idChecklist: "cl1",
      state: "complete",
    });
  });

  it("skips resolution when item is a 24-char hex ID", async () => {
    const { error } = await runCommand([
      "card:check-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--item", "aabbccddeeff001122334455",
      "--state", "complete",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(getCardChecklists).not.toHaveBeenCalled();
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "aabbccddeeff001122334455",
      state: "complete",
    });
  });

  it("calls updateCardCheckItem with state incomplete", async () => {
    updateCardCheckItem.mockResolvedValueOnce({
      ...mockCheckItem,
      state: "incomplete",
    });

    const { error } = await runCommand([
      "card:check-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--item", "MyTask",
      "--state", "incomplete",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "checkitem1",
      idChecklist: "cl1",
      state: "incomplete",
    });
  });

  it("errors when no check item matches the name", async () => {
    const { error } = await runCommand([
      "card:check-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--item", "NonExistent",
      "--state", "complete",
      "--format", "json",
    ]);
    expect(error?.message).toContain('No check item found with name "NonExistent"');
  });

  it("errors when multiple check items match the name", async () => {
    getCardChecklists.mockResolvedValueOnce([
      {
        id: "cl1",
        name: "Checklist1",
        checkItems: [{ id: "ci1", name: "Dupe", state: "incomplete" }],
      },
      {
        id: "cl2",
        name: "Checklist2",
        checkItems: [{ id: "ci2", name: "Dupe", state: "incomplete" }],
      },
    ]);

    const { error } = await runCommand([
      "card:check-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--item", "Dupe",
      "--state", "complete",
      "--format", "json",
    ]);
    expect(error?.message).toContain('Multiple check items found with name "Dupe"');
    expect(error?.message).toContain("--checklist");
  });

  it("disambiguates with --checklist by name", async () => {
    getCardChecklists.mockResolvedValueOnce([
      {
        id: "cl1",
        name: "Checklist1",
        checkItems: [{ id: "ci1", name: "Dupe", state: "incomplete" }],
      },
      {
        id: "cl2",
        name: "Checklist2",
        checkItems: [{ id: "ci2", name: "Dupe", state: "incomplete" }],
      },
    ]);

    const { error } = await runCommand([
      "card:check-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--item", "Dupe",
      "--checklist", "Checklist2",
      "--state", "complete",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "ci2",
      idChecklist: "cl2",
      state: "complete",
    });
  });

  it("disambiguates with --checklist by ID", async () => {
    getCardChecklists.mockResolvedValueOnce([
      {
        id: "cl1",
        name: "Checklist1",
        checkItems: [{ id: "ci1", name: "Dupe", state: "incomplete" }],
      },
      {
        id: "cl2",
        name: "Checklist2",
        checkItems: [{ id: "ci2", name: "Dupe", state: "incomplete" }],
      },
    ]);

    const { error } = await runCommand([
      "card:check-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--item", "Dupe",
      "--checklist", "cl1",
      "--state", "complete",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "ci1",
      idChecklist: "cl1",
      state: "complete",
    });
  });

  it("errors when --checklist matches no checklist", async () => {
    const { error } = await runCommand([
      "card:check-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--item", "MyTask",
      "--checklist", "NoSuch",
      "--state", "complete",
      "--format", "json",
    ]);
    expect(error?.message).toContain('No checklist found matching "NoSuch"');
  });

  it("resolves card name to ID via board/list lookups", async () => {
    await runCommand([
      "card:check-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--item", "MyTask",
      "--state", "complete",
      "--format", "json",
    ]);
    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
    expect(mockGetListIdByBoardAndName).toHaveBeenCalledWith("board123", "ToDo");
    expect(getListCards).toHaveBeenCalledWith({ id: "list123" });
  });

  it("outputs correct JSON shape", async () => {
    await runCommand([
      "card:check-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--item", "MyTask",
      "--state", "complete",
      "--format", "json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output.id).toBe("checkitem1");
    expect(output.name).toBe("MyTask");
    expect(output.state).toBe("complete");
  });
});
