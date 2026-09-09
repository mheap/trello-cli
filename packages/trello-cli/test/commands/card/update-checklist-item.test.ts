import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

// --- Mock setup ---
// NOTE: @oclif/test runCommand splits on spaces within argument strings, so all
// test flag values use single-word strings (e.g. "TaskOne" not "Task One").
// This is consistent with every existing test in the repo and does not limit
// what the command itself supports.

const mockUpdatedItem = { id: "item1", name: "TaskOne", state: "incomplete", pos: 16384 };

// updateCardCheckItem is used for all mutations: rename, reposition, or both.
// It lives on client.cards and accepts name, pos, and/or state.
const updateCardCheckItem = jest.fn().mockResolvedValue(mockUpdatedItem);

// getCardChecklists is used for two purposes:
//   1. Resolve checklist/item names to IDs
//   2. Fetch current item positions for relative moves (up/down)
const getCardChecklists = jest.fn().mockResolvedValue([
  {
    id: "cl1",
    name: "MyChecklist",
    checkItems: [
      { id: "item1", name: "TaskOne",   state: "incomplete", pos: 16384 },
      { id: "item2", name: "TaskTwo",   state: "incomplete", pos: 32768 },
      { id: "item3", name: "TaskThree", state: "incomplete", pos: 49152 },
    ],
  },
]);

// Required by BaseCommand to resolve --card name → card ID via the list
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { updateCardCheckItem, getCardChecklists },
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

let stdoutSpy: jest.SpyInstance;

beforeEach(() => {
  jest.spyOn(Config.prototype, "getToken").mockResolvedValue("fake_token");
  jest.spyOn(Config.prototype, "getApiKey").mockResolvedValue("fake_api_key");
  stdoutSpy = jest.spyOn(ux, "stdout").mockImplementation(() => {});

  // Reset call counts between tests so assertions stay isolated
  updateCardCheckItem.mockClear();
  getCardChecklists.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:update-checklist-item", () => {
  // Guard: oclif should reject the command before any API call is made
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:update-checklist-item"]);
    expect(error?.message).toContain("Missing required flag");
  });

  // Guard: --name and --pos are both optional individually, but at least one must
  // be provided — otherwise the command would be a no-op
  it("errors when neither --name nor --pos is provided", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",
    ]);
    expect(error?.message).toContain("at least one of --name or --pos");
  });

  // --- Rename tests ---

  // Happy path: rename only — should call updateCardCheckItem with new name, no pos
  it("renames item when only --name is provided", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",
      "--name", "RenamedTask",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "item1",
      name: "RenamedTask",
    });
  });

  // --- Position tests: absolute values ---

  // Trello API accepts the string "top" directly — pass through without conversion
  it("passes --pos top to API as string", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",
      "--pos", "top",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "item1",
      pos: "top",
    });
  });

  // Trello API accepts the string "bottom" directly — pass through without conversion
  it("passes --pos bottom to API as string", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",
      "--pos", "bottom",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "item1",
      pos: "bottom",
    });
  });

  // Numeric strings from the CLI must be coerced to numbers before passing to the API
  it("passes numeric --pos to API as a number", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",
      "--pos", "8192",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "item1",
      pos: 8192,
    });
  });

  // --- Position tests: relative moves (up/down) ---
  // Relative moves require fetching all items, sorting by pos, and computing a
  // midpoint position so the item lands between the correct neighbours.
  // Items in mock: TaskOne (16384) → TaskTwo (32768) → TaskThree (49152)

  // Moving "TaskTwo" up: new pos should be between nothing and TaskOne.
  // Since TaskOne is the first item (no item before it), new pos = TaskOne.pos / 2 = 8192
  it("moves item up by computing midpoint before previous item", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskTwo",   // currently at index 1 (pos 32768)
      "--pos", "up",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    // TaskTwo moves up past TaskOne. No item before TaskOne, so new pos = TaskOne.pos / 2
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "item2",
      pos: 8192,             // 16384 / 2
    });
  });

  // Moving "TaskTwo" down: new pos should be between TaskThree and nothing after it.
  // Since TaskThree is the last item, new pos = TaskThree.pos + 1000
  it("moves item down by computing midpoint after next item", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskTwo",   // currently at index 1 (pos 32768)
      "--pos", "down",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    // TaskTwo moves down past TaskThree. No item after TaskThree, so new pos = TaskThree.pos + 1000
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "item2",
      pos: 50152,            // 49152 + 1000
    });
  });

  // Moving "TaskThree" (last item) up: new pos should be midpoint of TaskOne and TaskTwo
  it("moves last item up by computing midpoint between the two preceding items", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskThree", // currently at index 2 (pos 49152)
      "--pos", "up",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    // Moves up past TaskTwo. TaskOne and TaskTwo bracket the target slot.
    // New pos = (TaskOne.pos + TaskTwo.pos) / 2 = (16384 + 32768) / 2 = 24576
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "item3",
      pos: 24576,
    });
  });

  // Moving "TaskOne" (first item, idx=0) down: new pos should be midpoint of
  // TaskTwo and TaskThree, since both exist after the landing slot.
  // New pos = (TaskTwo.pos + TaskThree.pos) / 2 = (32768 + 49152) / 2 = 40960
  it("moves first item down by computing midpoint between the two following items", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",   // currently at index 0 (pos 16384)
      "--pos", "down",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    // TaskOne moves down past TaskTwo. TaskTwo and TaskThree bracket the target slot.
    // New pos = (TaskTwo.pos + TaskThree.pos) / 2 = (32768 + 49152) / 2 = 40960
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "item1",
      pos: 40960,
    });
  });

  // Edge case: cannot move the first item further up
  it("errors when trying to move first item up", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",   // already at index 0
      "--pos", "up",
    ]);
    expect(error?.message).toContain("already at the top");
  });

  // Edge case: cannot move the last item further down
  it("errors when trying to move last item down", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskThree", // already at the last index
      "--pos", "down",
    ]);
    expect(error?.message).toContain("already at the bottom");
  });

  // --- Combined rename + reposition ---

  // Both --name and --pos can be supplied together in a single API call
  it("renames and repositions in one call when both --name and --pos are provided", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",
      "--name", "RenamedTask",
      "--pos", "bottom",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "item1",
      name: "RenamedTask",
      pos: "bottom",
    });
  });

  // Skip-fetch optimisation: when both --checklist and --item are raw 24-char hex IDs
  // and --pos is not a relative move, getCardChecklists must not be called
  it("skips getCardChecklists when both checklist and item are raw IDs", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "aabbccddeeff001122334455",
      "--item", "aabbccddeeff001122334456",
      "--pos", "top",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(getCardChecklists).not.toHaveBeenCalled();
    expect(updateCardCheckItem).toHaveBeenCalledWith({
      id: "card123",
      idCheckItem: "aabbccddeeff001122334456",
      pos: "top",
    });
  });

  // --- Error handling ---

  // Error handling: item name provided but doesn't exist in the specified checklist
  it("errors when item name not found", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "NoSuch",
      "--name", "Whatever",
    ]);
    expect(error?.message).toContain('No checklist item found with name "NoSuch"');
  });

  // Error handling: invalid --pos value (not top/bottom/up/down/number) should error
  it("errors when --pos is an invalid value", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",
      "--pos", "invalid",
    ]);
    expect(error?.message).toContain('Invalid --pos value "invalid"');
  });

  // Error handling: checklist name provided but doesn't exist on the card
  it("errors when checklist name not found", async () => {
    const { error } = await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "NoSuch",
      "--item", "TaskOne",
      "--name", "Whatever",
    ]);
    expect(error?.message).toContain('No checklist found matching "NoSuch"');
  });

  // --- Output shape ---

  // Verify the output shape matches what consumers (scripts, piped commands) expect
  it("outputs correct JSON shape", async () => {
    await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",
      "--name", "RenamedTask",
      "--format", "json",
    ]);
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output.id).toBe("item1");
    expect(output.name).toBeDefined();
    expect(output.state).toBeDefined();
  });

  // Verify that BaseCommand's name-to-ID resolution chain is exercised:
  // board name → board ID → list ID → card ID
  it("resolves card name to ID via board/list lookups", async () => {
    await runCommand([
      "card:update-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "TaskOne",
      "--name", "RenamedTask",
      "--format", "json",
    ]);
    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
    expect(mockGetListIdByBoardAndName).toHaveBeenCalledWith("board123", "ToDo");
    expect(getListCards).toHaveBeenCalledWith({ id: "list123" });
  });
});
