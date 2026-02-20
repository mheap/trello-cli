import {
  getListColumns,
  getListWidth,
} from "../../../src/tui/hooks/useTerminalSize";

describe("getListColumns", () => {
  it("returns 1 column for width < 80", () => {
    expect(getListColumns(60)).toBe(1);
    expect(getListColumns(79)).toBe(1);
  });

  it("returns 2 columns for width 80-119", () => {
    expect(getListColumns(80)).toBe(2);
    expect(getListColumns(100)).toBe(2);
    expect(getListColumns(119)).toBe(2);
  });

  it("returns 3 columns for width 120-159", () => {
    expect(getListColumns(120)).toBe(3);
    expect(getListColumns(140)).toBe(3);
    expect(getListColumns(159)).toBe(3);
  });

  it("returns 4 columns for width >= 160", () => {
    expect(getListColumns(160)).toBe(4);
    expect(getListColumns(200)).toBe(4);
    expect(getListColumns(300)).toBe(4);
  });
});

describe("getListWidth", () => {
  it("calculates width correctly for 2 columns at 80 width", () => {
    // Available: 80 - 4 = 76, per column: floor(76/2) - 2 = 36
    expect(getListWidth(80, 2)).toBe(36);
  });

  it("calculates width correctly for 3 columns at 120 width", () => {
    // Available: 120 - 4 = 116, per column: floor(116/3) - 2 = 36
    expect(getListWidth(120, 3)).toBe(36);
  });

  it("calculates width correctly for 4 columns at 160 width", () => {
    // Available: 160 - 4 = 156, per column: floor(156/4) - 2 = 37
    expect(getListWidth(160, 4)).toBe(37);
  });

  it("calculates width correctly for 1 column at 60 width", () => {
    // Available: 60 - 4 = 56, per column: floor(56/1) - 2 = 54
    expect(getListWidth(60, 1)).toBe(54);
  });

  it("handles large terminal widths", () => {
    // Available: 240 - 4 = 236, per column: floor(236/4) - 2 = 57
    expect(getListWidth(240, 4)).toBe(57);
  });
});
