import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import { ux } from "@oclif/core";

// --- Mock setup ---
// Simulates the Trello API response for deleting a checklist (no meaningful body)
const deleteCardChecklist = jest.fn().mockResolvedValue({});

// Used to resolve a checklist name → ID when the caller passes a name instead of a raw ID
const getCardChecklists = jest.fn().mockResolvedValue([
  { id: "cl1", name: "MyChecklist", checkItems: [] },
]);

// Required by BaseCommand to resolve --card name → card ID via the list
const getListCards = jest.fn().mockResolvedValue([
  { id: "card123", name: "TestCard" },
]);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    cards: { deleteCardChecklist, getCardChecklists },
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
  deleteCardChecklist.mockClear();
  getCardChecklists.mockClear();
  getListCards.mockClear();
  mockGetBoardIdByName.mockClear();
  mockGetListIdByBoardAndName.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("card:delete-checklist", () => {
  // Guard: oclif should reject the command before any API call is made
  it("throws when required flags are missing", async () => {
    const { error } = await runCommand(["card:delete-checklist"]);
    expect(error?.message).toContain("Missing required flag");
  });

  // Happy path: caller supplies a checklist name; command must resolve it to an ID
  // before calling deleteCardChecklist, since the API requires an ID
  it("resolves checklist name to ID and calls deleteCardChecklist", async () => {
    const { error } = await runCommand([
      "card:delete-checklist",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
    ]);
    expect(error).toBeUndefined();
    expect(getCardChecklists).toHaveBeenCalledWith({ id: "card123" });
    expect(deleteCardChecklist).toHaveBeenCalledWith({
      id: "card123",
      idChecklist: "cl1",
    });
  });

  // Optimisation: a 24-char hex string is already a Trello ID — skip the extra
  // getCardChecklists round-trip and pass it straight to the API
  it("accepts checklist ID directly without fetching checklists", async () => {
    const { error } = await runCommand([
      "card:delete-checklist",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "aabbccddeeff001122334455",
    ]);
    expect(error).toBeUndefined();
    expect(getCardChecklists).not.toHaveBeenCalled();
    expect(deleteCardChecklist).toHaveBeenCalledWith({
      id: "card123",
      idChecklist: "aabbccddeeff001122334455",
    });
  });

  // Error handling: checklist name provided but doesn't exist on the card
  it("errors when checklist name not found", async () => {
    const { error } = await runCommand([
      "card:delete-checklist",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "NoSuch",
    ]);
    expect(error?.message).toContain('No checklist found matching "NoSuch"');
  });

  // Verify that BaseCommand's name-to-ID resolution chain is exercised:
  // board name → board ID → list ID → card ID
  it("resolves card name to ID via board/list lookups", async () => {
    await runCommand([
      "card:delete-checklist",
      "--board", "MyBoard",
      "--list", "ToDo",
      "--card", "TestCard",
      "--checklist", "MyChecklist",
    ]);
    expect(mockGetBoardIdByName).toHaveBeenCalledWith("MyBoard");
    expect(mockGetListIdByBoardAndName).toHaveBeenCalledWith("board123", "ToDo");
    expect(getListCards).toHaveBeenCalledWith({ id: "list123" });
  });
});
