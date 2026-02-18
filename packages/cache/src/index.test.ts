const mockGet = jest.fn();
const mockAll = jest.fn();

jest.mock("./db", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      get: mockGet,
      all: mockAll,
    })),
  };
});

import Cache from "./index";

let cache: Cache;

beforeEach(() => {
  cache = new Cache("/tmp/test", "key", "token");
  mockGet.mockReset();
  mockAll.mockReset();
});

describe("getBoardIdByName", () => {
  it("returns the board ID when found", async () => {
    mockGet.mockReturnValue({ id: "board123" });
    const id = await cache.getBoardIdByName("MyBoard");
    expect(id).toBe("board123");
  });

  it("throws when board is not found", async () => {
    mockGet.mockReturnValue(undefined);
    await expect(cache.getBoardIdByName("NonExistent")).rejects.toThrow(
      "Board [NonExistent] not found"
    );
  });
});

describe("getBoard", () => {
  it("returns the board name when found", async () => {
    mockGet.mockReturnValue({ name: "MyBoard" });
    const name = await cache.getBoard("board123");
    expect(name).toBe("MyBoard");
  });

  it("throws when board is not found", async () => {
    mockGet.mockReturnValue(undefined);
    await expect(cache.getBoard("board123")).rejects.toThrow(
      "Board [board123] not found"
    );
  });
});

describe("getList", () => {
  it("returns the list name when found", async () => {
    mockGet.mockReturnValue({ name: "To Do" });
    const name = await cache.getList("list123");
    expect(name).toBe("To Do");
  });

  it("throws when list is not found", async () => {
    mockGet.mockReturnValue(undefined);
    await expect(cache.getList("list123")).rejects.toThrow(
      "List [list123] not found"
    );
  });
});

describe("getListIdByBoardAndName", () => {
  it("returns the list ID when found", async () => {
    mockGet.mockReturnValue({ id: "list123" });
    const id = await cache.getListIdByBoardAndName("board123", "To Do");
    expect(id).toBe("list123");
  });

  it("throws when list is not found on board", async () => {
    mockGet.mockReturnValue(undefined);
    await expect(
      cache.getListIdByBoardAndName("board123", "NonExistent")
    ).rejects.toThrow("List [NonExistent] not found on board [board123]");
  });
});

describe("getLabelIdByName", () => {
  it("returns the label ID when found", async () => {
    mockGet.mockReturnValue({ id: "label123" });
    const id = await cache.getLabelIdByName("Bug");
    expect(id).toBe("label123");
  });

  it("throws when label is not found", async () => {
    mockGet.mockReturnValue(undefined);
    await expect(cache.getLabelIdByName("NonExistent")).rejects.toThrow(
      "Label [NonExistent] not found"
    );
  });
});

describe("getUserIdByName", () => {
  it("returns the user ID when found", async () => {
    mockGet.mockReturnValue({ id: "user123" });
    const id = await cache.getUserIdByName("johndoe");
    expect(id).toBe("user123");
  });

  it("returns empty string when user is not found", async () => {
    mockGet.mockReturnValue(undefined);
    const id = await cache.getUserIdByName("nobody");
    expect(id).toBe("");
  });
});

export {};
