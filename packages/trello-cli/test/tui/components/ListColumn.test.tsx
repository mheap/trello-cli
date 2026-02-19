import React from "react";
import { render } from "ink-testing-library";
const { stripVTControlCharacters } = require("node:util");
import { ListColumn } from "../../../src/tui/components/ListColumn";
import { createMockNavContext, makeList, makeCard } from "../helpers";

jest.mock("../../../src/tui/state/NavigationContext", () => ({
  useNavigation: jest.fn(),
}));

import { useNavigation } from "../../../src/tui/state/NavigationContext";
const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

describe("ListColumn", () => {
  beforeEach(() => {
    mockUseNavigation.mockReturnValue(createMockNavContext({ view: "board" }) as any);
  });

  const defaultProps = {
    list: makeList({ id: "l1", name: "To Do" }),
    cards: [],
    listIndex: 0,
    isSelectedList: false,
    selectedCardIndex: 0,
    width: 30,
    height: 20,
    maxCardRows: 10,
  };

  describe("list header", () => {
    it("shows list name", () => {
      const { lastFrame } = render(<ListColumn {...defaultProps} />);
      expect(lastFrame()!).toContain("To Do");
    });

    it("shows list index (1-based)", () => {
      const { lastFrame } = render(
        <ListColumn {...defaultProps} listIndex={2} />
      );
      expect(lastFrame()!).toContain("[3]");
    });

    it("truncates long list names", () => {
      const longName = "This is a very long list name that should be truncated";
      const { lastFrame } = render(
        <ListColumn {...defaultProps} list={makeList({ name: longName })} width={25} />
      );
      const output = lastFrame()!;
      expect(output).toContain("...");
      expect(output).not.toContain(longName);
    });
  });

  describe("empty state", () => {
    it("shows 'No cards' when there are no cards", () => {
      const { lastFrame } = render(<ListColumn {...defaultProps} cards={[]} />);
      expect(lastFrame()!).toContain("No cards");
    });
  });

  describe("card rendering", () => {
    it("renders card names", () => {
      const cards = [
        makeCard({ id: "c1", name: "First Card" }),
        makeCard({ id: "c2", name: "Second Card" }),
      ];
      const { lastFrame } = render(
        <ListColumn {...defaultProps} cards={cards} />
      );
      const output = lastFrame()!;
      expect(output).toContain("First Card");
      expect(output).toContain("Second Card");
    });
  });

  describe("scroll indicators", () => {
    it("shows bottom scroll indicator when more cards exist below", () => {
      const cards = Array.from({ length: 8 }, (_, i) =>
        makeCard({ id: `c${i}`, name: `Card ${i}` })
      );
      const { lastFrame } = render(
        <ListColumn
          {...defaultProps}
          cards={cards}
          maxCardRows={3}
          isSelectedList={true}
          selectedCardIndex={0}
        />
      );
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("-- 5 more --");
    });

    it("shows top scroll indicator when cards are hidden above", () => {
      const cards = Array.from({ length: 8 }, (_, i) =>
        makeCard({ id: `c${i}`, name: `Card ${i}` })
      );
      const { lastFrame } = render(
        <ListColumn
          {...defaultProps}
          cards={cards}
          maxCardRows={3}
          isSelectedList={true}
          selectedCardIndex={6}
        />
      );
      const output = stripVTControlCharacters(lastFrame()!);
      // selectedIndex=6, start=max(0,6-1)=5, end=8, scrollTop=5
      expect(output).toContain("-- 5 more --");
    });

    it("shows no scroll indicators when all cards fit", () => {
      const cards = [
        makeCard({ id: "c1", name: "Only Card" }),
      ];
      const { lastFrame } = render(
        <ListColumn {...defaultProps} cards={cards} maxCardRows={10} />
      );
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).not.toContain("more --");
    });
  });

  describe("new card hint", () => {
    it("shows [n] + New card when list is selected", () => {
      const { lastFrame } = render(
        <ListColumn {...defaultProps} isSelectedList={true} />
      );
      expect(lastFrame()!).toContain("[n] + New card");
    });

    it("does not show new card hint when list is not selected", () => {
      const { lastFrame } = render(
        <ListColumn {...defaultProps} isSelectedList={false} />
      );
      expect(lastFrame()!).not.toContain("[n] + New card");
    });
  });
});
