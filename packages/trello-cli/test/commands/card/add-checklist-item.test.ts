import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

// --- Mock setup ---
// NOTE: @oclif/test runCommand splits on spaces within argument strings, so all
// test flag values use single-word strings (e.g. "NewTask" not "New Task").
// This is consistent with every existing test in the repo and does not limit
// what the command itself supports.

const mockItem = { id: "item1", name: "NewTask", pos: 16384 };

// API call that creates the new checklist item inside a given checklist
const createChecklistCheckItems = jest.fn().mockResolvedValue(mockItem);

// Used to resolve a checklist name → ID when caller passes a name instead of a raw ID
const getCardChecklists = jest.fn().mockResolvedValue([
  { id: "cl1", name: "MyChecklist", checkItems: [] },
]);

// Required by BaseCommand to resolve --card name → card ID via the list
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { getCardChecklists },
    // createChecklistCheckItems lives on the checklists namespace in trello.js
    checklists: { createChecklistCheckItems },
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
  createChecklistCheckItems.mockClear();
  getCardChecklists.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:add-checklist-item", () => {
  // Guard: oclif should reject the command before any API call is made
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:add-checklist-item"]);
    expect(error?.message).toContain("Missing required flag");
  });

  // Happy path: caller supplies a checklist name; command must resolve it to an ID
  // via getCardChecklists before calling createChecklistCheckItems
  it("resolves checklist name and creates item", async () => {
    const { error } = await runCommand([
      "card:add-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "NewTask",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(getCardChecklists).toHaveBeenCalledWith({ id: "card123" });
    expect(createChecklistCheckItems).toHaveBeenCalledWith({
      id: "cl1",
      name: "NewTask",
    });
  });

  // Optimisation: a 24-char hex string is already a Trello ID — skip the extra
  // getCardChecklists round-trip and pass it straight to the API
  it("accepts checklist ID directly", async () => {
    const { error } = await runCommand([
      "card:add-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "aabbccddeeff001122334455",
      "--item", "NewTask",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(getCardChecklists).not.toHaveBeenCalled();
    expect(createChecklistCheckItems).toHaveBeenCalledWith({
      id: "aabbccddeeff001122334455",
      name: "NewTask",
    });
  });

  // Position tests: the Trello API accepts "top", "bottom", or a positive float.
  // The command must pass these through correctly, converting numeric strings to numbers.
  it("passes --pos top to API", async () => {
    const { error } = await runCommand([
      "card:add-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "NewTask",
      "--pos", "top",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(createChecklistCheckItems).toHaveBeenCalledWith({
      id: "cl1",
      name: "NewTask",
      pos: "top",
    });
  });

  it("passes --pos bottom to API", async () => {
    const { error } = await runCommand([
      "card:add-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "NewTask",
      "--pos", "bottom",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(createChecklistCheckItems).toHaveBeenCalledWith({
      id: "cl1",
      name: "NewTask",
      pos: "bottom",
    });
  });

  // Numeric strings from the CLI must be coerced to numbers before passing to the API
  it("passes numeric --pos to API as a number", async () => {
    const { error } = await runCommand([
      "card:add-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "NewTask",
      "--pos", "8192",
      "--format", "json",
    ]);
    expect(error).toBeUndefined();
    expect(createChecklistCheckItems).toHaveBeenCalledWith({
      id: "cl1",
      name: "NewTask",
      pos: 8192,
    });
  });

  // Error handling: invalid --pos value (not top/bottom/number) should error
  it("errors when --pos is an invalid value", async () => {
    const { error } = await runCommand([
      "card:add-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "NewTask",
      "--pos", "invalid",
    ]);
    expect(error?.message).toContain('Invalid --pos value "invalid"');
  });

  // Error handling: checklist name provided but doesn't exist on the card
  it("errors when checklist name not found", async () => {
    const { error } = await runCommand([
      "card:add-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "NoSuch",
      "--item", "NewTask",
    ]);
    expect(error?.message).toContain('No checklist found matching "NoSuch"');
  });

  // Verify the output shape matches what consumers (scripts, piped commands) expect
  it("outputs correct JSON shape", async () => {
    await runCommand([
      "card:add-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "NewTask",
      "--format", "json",
    ]);
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output.id).toBe("item1");
    expect(output.name).toBe("NewTask");
  });

  // Verify that BaseCommand's name-to-ID resolution chain is exercised:
  // board name → board ID → list ID → card ID
  it("resolves card name to ID via board/list lookups", async () => {
    await runCommand([
      "card:add-checklist-item",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
      "--item", "NewTask",
      "--format", "json",
    ]);
    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
    expect(mockGetListIdByBoardAndName).toHaveBeenCalledWith("board123", "ToDo");
    expect(getListCards).toHaveBeenCalledWith({ id: "list123" });
  });
});
