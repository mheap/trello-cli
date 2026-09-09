import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

// --- Mock setup ---
// NOTE: @oclif/test runCommand splits on spaces within argument strings, so all
// test flag values use single-word strings (e.g. "TaskOne" not "Task One").
// This is consistent with every existing test in the repo and does not limit
// what the command itself supports.

// Trello API returns no meaningful body on delete — empty object is the convention
const deleteCardChecklistItem = jest.fn().mockResolvedValue({});

// Used to resolve checklist name → ID and item name → ID when caller uses names
const getCardChecklists = jest.fn().mockResolvedValue([
  {
    id: "cl1",
    name: "MyChecklist",
    checkItems: [
      { id: "item1", name: "TaskOne", state: "incomplete", pos: 16384 },
      { id: "item2", name: "TaskTwo", state: "incomplete", pos: 32768 },
    ],
  },
]);

// Required by BaseCommand to resolve --card name → card ID via the list
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { deleteCardChecklistItem, getCardChecklists },
    lists: { getListCards },
  })),
}));

// BaseCommand resolves --board and --list via the local cache before hitting the API
const mockGetBoardIdByName = jest.fn().mockResolvedValue("board123");
const mockGetListIdByBoardAndName = jest.fn().mockResolvedValue("list123");

jest.mock("@trello-cli/cache", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getBoardIdByName: mockGetBoardIdByName,
    getListIdByBoardAndName: mockGetListIdByBoardAndName,
  })),
}));

beforeEach(() => {
  jest.spyOn(Config.prototype, "getToken").mockResolvedValue("fake_token");
  jest.spyOn(Config.prototype, "getApiKey").mockResolvedValue("fake_api_key");
  jest.spyOn(ux, "stdout").mockImplementation(() => {});

  // Reset call counts between tests so assertions stay isolated
  deleteCardChecklistItem.mockClear();
  getCardChecklists.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:delete-checklist-item", () => {
  // Guard: oclif should reject the command before any API call is made
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:delete-checklist-item"]);
    expect(error?.message).toContain("Missing required flag");
  });

  // Happy path: caller supplies checklist and item by name.
  // Command must resolve both to IDs before calling deleteCardChecklistItem.
  it("resolves checklist and item names to IDs and deletes item", async () => {
    const { error } = await runCommand([
      "card:delete-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",
    ]);
    expect(error).toBeUndefined();
    expect(getCardChecklists).toHaveBeenCalledWith({ id: "card123" });
    expect(deleteCardChecklistItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "item1",
    });
  });

  // Optimisation: a 24-char hex item ID skips the getCardChecklists round-trip entirely
  it("accepts item ID directly without fetching checklists", async () => {
    const { error } = await runCommand([
      "card:delete-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "aabbccddeeff001122334455",
      "--item", "aabbccddeeff001122334456",
    ]);
    expect(error).toBeUndefined();
    expect(getCardChecklists).not.toHaveBeenCalled();
    expect(deleteCardChecklistItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "aabbccddeeff001122334456",
    });
  });

  // --checklist scopes the item lookup so items with the same name in different
  // checklists on the same card don't cause ambiguity errors
  it("scopes item lookup to the specified checklist", async () => {
    getCardChecklists.mockResolvedValueOnce([
      {
        id: "cl1",
        name: "Sprint",
        checkItems: [{ id: "item1", name: "SharedName", state: "incomplete", pos: 16384 }],
      },
      {
        id: "cl2",
        name: "Backlog",
        checkItems: [{ id: "item2", name: "SharedName", state: "incomplete", pos: 16384 }],
      },
    ]);

    const { error } = await runCommand([
      "card:delete-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "Backlog",
      "--item", "SharedName",
    ]);
    expect(error).toBeUndefined();
    // Should delete the item from "Backlog", not "Sprint"
    expect(deleteCardChecklistItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "item2",
    });
  });

  // Error handling: item name provided but doesn't exist in the specified checklist
  it("errors when item name not found", async () => {
    const { error } = await runCommand([
      "card:delete-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "NoSuch",
    ]);
    expect(error?.message).toContain('No checklist item found with name "NoSuch"');
  });

  // Error handling: checklist name provided but doesn't exist on the card
  it("errors when checklist name not found", async () => {
    const { error } = await runCommand([
      "card:delete-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "NoSuch",
      "--item", "TaskOne",
    ]);
    expect(error?.message).toContain('No checklist found matching "NoSuch"');
  });

  // Verify that BaseCommand's name-to-ID resolution chain is exercised:
  // board name → board ID → list ID → card ID
  it("resolves card name to ID via board/list lookups", async () => {
    await runCommand([
      "card:delete-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",
    ]);
    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
    expect(mockGetListIdByBoardAndName).toHaveBeenCalledWith("board123", "ToDo");
    expect(getListCards).toHaveBeenCalledWith({ id: "list123" });
  });
});
