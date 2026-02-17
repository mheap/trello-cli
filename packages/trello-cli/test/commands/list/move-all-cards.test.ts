import { runCommand } from "@oclif/test";
import Config from "@trello-cli/config";
import Cache from "@trello-cli/cache";
import { ux } from "@oclif/core";

const mockMovedCards = [
  { id: "card1", name: "Card One", idList: "dest-list-id" },
  { id: "card2", name: "Card Two", idList: "dest-list-id" },
  { id: "card3", name: "Card Three", idList: "dest-list-id" },
];

const moveAllCardsInList = jest.fn().mockResolvedValue(mockMovedCards);

jest.mock("trello.js", () => ({
  TrelloClient: jest.fn().mockImplementation(() => ({
    lists: {
      moveAllCardsInList,
    },
  })),
}));

let getBoardIdByName: jest.SpyInstance;
let getListIdByBoardAndName: jest.SpyInstance;
let stdoutSpy: jest.SpyInstance;

beforeEach(() => {
  jest
    .spyOn(Config.prototype, "getToken")
    .mockImplementation(() => Promise.resolve("fake_token"));
  jest
    .spyOn(Config.prototype, "getApiKey")
    .mockImplementation(() => Promise.resolve("fake_api_key"));

  getBoardIdByName = jest
    .spyOn(Cache.prototype, "getBoardIdByName")
    .mockImplementation((name: string) => {
      if (name === "SourceBoard") return Promise.resolve("source-board-id");
      if (name === "DestBoard") return Promise.resolve("dest-board-id");
      return Promise.resolve(name);
    });

  getListIdByBoardAndName = jest
    .spyOn(Cache.prototype, "getListIdByBoardAndName")
    .mockImplementation((boardId: string, name: string) => {
      if (boardId === "source-board-id" && name === "SourceList")
        return Promise.resolve("source-list-id");
      if (boardId === "dest-board-id" && name === "DestList")
        return Promise.resolve("dest-list-id");
      return Promise.resolve(name);
    });

  stdoutSpy = jest.spyOn(ux, "stdout").mockImplementation(() => {});

  moveAllCardsInList.mockClear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("list:move-all-cards", () => {
  it("throws when --board flag is missing", async () => {
    const { error } = await runCommand([
      "list:move-all-cards",
      "--list=SourceList",
      "--destination-board=DestBoard",
      "--destination-list=DestList",
    ]);
    expect(error?.message).toContain("Missing required flag board");
  });

  it("throws when --list flag is missing", async () => {
    const { error } = await runCommand([
      "list:move-all-cards",
      "--board=SourceBoard",
      "--destination-board=DestBoard",
      "--destination-list=DestList",
    ]);
    expect(error?.message).toContain("Missing required flag list");
  });

  it("throws when --destination-board flag is missing", async () => {
    const { error } = await runCommand([
      "list:move-all-cards",
      "--board=SourceBoard",
      "--list=SourceList",
      "--destination-list=DestList",
    ]);
    expect(error?.message).toContain(
      "Missing required flag destination-board"
    );
  });

  it("throws when --destination-list flag is missing", async () => {
    const { error } = await runCommand([
      "list:move-all-cards",
      "--board=SourceBoard",
      "--list=SourceList",
      "--destination-board=DestBoard",
    ]);
    expect(error?.message).toContain("Missing required flag destination-list");
  });

  it("calls moveAllCardsInList with correct parameters", async () => {
    await runCommand([
      "list:move-all-cards",
      "--board=SourceBoard",
      "--list=SourceList",
      "--destination-board=DestBoard",
      "--destination-list=DestList",
      "--format=json",
    ]);

    expect(getBoardIdByName).toHaveBeenCalledWith("DestBoard");
    expect(getListIdByBoardAndName).toHaveBeenCalledWith(
      "dest-board-id",
      "DestList"
    );
    expect(moveAllCardsInList).toHaveBeenCalledTimes(1);
    expect(moveAllCardsInList).toHaveBeenCalledWith({
      id: "source-list-id",
      idBoard: "dest-board-id",
      idList: "dest-list-id",
    });
  });

  it("outputs JSON with mapped card data", async () => {
    await runCommand([
      "list:move-all-cards",
      "--board=SourceBoard",
      "--list=SourceList",
      "--destination-board=DestBoard",
      "--destination-list=DestList",
      "--format=json",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    const output = JSON.parse(outputCall);
    expect(output).toEqual([
      { id: "card1", name: "Card One" },
      { id: "card2", name: "Card Two" },
      { id: "card3", name: "Card Three" },
    ]);
  });

  it("outputs fancy format with card count", async () => {
    await runCommand([
      "list:move-all-cards",
      "--board=SourceBoard",
      "--list=SourceList",
      "--destination-board=DestBoard",
      "--destination-list=DestList",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    expect(outputCall).toContain("3 cards moved");
  });

  it("outputs singular 'card moved' when only one card is moved", async () => {
    moveAllCardsInList.mockResolvedValueOnce([
      { id: "card1", name: "Card One", idList: "dest-list-id" },
    ]);

    await runCommand([
      "list:move-all-cards",
      "--board=SourceBoard",
      "--list=SourceList",
      "--destination-board=DestBoard",
      "--destination-list=DestList",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    expect(outputCall).toContain("1 card moved");
    expect(outputCall).not.toContain("cards moved");
  });

  it("outputs 'No cards moved' when result is empty", async () => {
    moveAllCardsInList.mockResolvedValueOnce([]);

    await runCommand([
      "list:move-all-cards",
      "--board=SourceBoard",
      "--list=SourceList",
      "--destination-board=DestBoard",
      "--destination-list=DestList",
    ]);

    const outputCall = stdoutSpy.mock.calls[0][0];
    expect(outputCall).toContain("No cards moved");
  });
});
