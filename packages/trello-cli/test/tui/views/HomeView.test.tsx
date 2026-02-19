import React from "react";
import { render } from "ink-testing-library";
const { stripVTControlCharacters } = require("node:util");
import { HomeView } from "../../../src/tui/views/HomeView";
import {
  createMockNavContext,
  createMockTrelloContext,
  makeBoard,
} from "../helpers";

jest.mock("../../../src/tui/state/NavigationContext", () => ({
  useNavigation: jest.fn(),
}));

jest.mock("../../../src/tui/state/TrelloContext", () => ({
  useTrello: jest.fn(),
}));

jest.mock("ink", () => {
  const actual = jest.requireActual("ink");
  return {
    ...actual,
    useApp: () => ({ exit: jest.fn() }),
  };
});

jest.mock("ink-spinner", () => {
  return function Spinner() {
    return "⠋";
  };
});

jest.mock("ink-text-input", () => {
  return function TextInput({ value }: { value: string }) {
    const React = require("react");
    const { Text } = require("ink");
    return React.createElement(Text, null, value || "");
  };
});

import { useNavigation } from "../../../src/tui/state/NavigationContext";
import { useTrello } from "../../../src/tui/state/TrelloContext";

const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;
const mockUseTrello = useTrello as jest.MockedFunction<typeof useTrello>;

const flushEffects = () =>
  new Promise<void>((r) => setTimeout(r, 0)).then(
    () => new Promise<void>((r) => setTimeout(r, 0))
  );

describe("HomeView", () => {
  let navDispatch: jest.Mock;
  let trelloCtx: ReturnType<typeof createMockTrelloContext>;

  beforeEach(() => {
    navDispatch = jest.fn();
    const navCtx = createMockNavContext({ view: "home" });
    navCtx.dispatch = navDispatch;
    mockUseNavigation.mockReturnValue(navCtx as any);

    trelloCtx = createMockTrelloContext({
      boards: [
        makeBoard({ id: "b1", name: "Project Alpha" }),
        makeBoard({ id: "b2", name: "Project Beta", desc: "Beta board description" }),
        makeBoard({ id: "b3", name: "Personal Tasks" }),
      ],
    });
    mockUseTrello.mockReturnValue(trelloCtx as any);
  });

  describe("board list rendering", () => {
    it("shows 'Your Boards' title", () => {
      const { lastFrame } = render(<HomeView />);
      expect(lastFrame()!).toContain("Your Boards");
    });

    it("shows board count", () => {
      const { lastFrame } = render(<HomeView />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("Your Boards (3 boards)");
    });

    it("renders all board names", () => {
      const { lastFrame } = render(<HomeView />);
      const output = lastFrame()!;
      expect(output).toContain("Project Alpha");
      expect(output).toContain("Project Beta");
      expect(output).toContain("Personal Tasks");
    });

    it("shows board description when available", () => {
      const { lastFrame } = render(<HomeView />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("Project Beta - Beta board description");
    });

    it("shows selection indicator on first board", () => {
      const { lastFrame } = render(<HomeView />);
      const output = lastFrame()!;
      // First board should have ">" prefix
      expect(output).toContain("> Project Alpha");
    });
  });

  describe("loading state", () => {
    it("shows loading indicator when loading with no boards", () => {
      trelloCtx = createMockTrelloContext({ loading: true, boards: [] });
      mockUseTrello.mockReturnValue(trelloCtx as any);
      const { lastFrame } = render(<HomeView />);
      expect(lastFrame()!).toContain("Loading boards");
    });
  });

  describe("empty state", () => {
    it("shows empty message when no boards and not loading", () => {
      trelloCtx = createMockTrelloContext({ boards: [] });
      mockUseTrello.mockReturnValue(trelloCtx as any);
      const { lastFrame } = render(<HomeView />);
      expect(lastFrame()!).toContain("No boards found");
    });
  });

  describe("keyboard navigation", () => {
    it("calls loadBoards on mount", async () => {
      render(<HomeView />);
      await flushEffects();
      expect(trelloCtx.loadBoards).toHaveBeenCalled();
    });

    it("dispatches SET_VIEW board on Enter", async () => {
      const inst = render(<HomeView />);
      await flushEffects();
      inst.stdin.write("\r");
      expect(trelloCtx.loadBoard).toHaveBeenCalledWith(
        expect.objectContaining({ id: "b1", name: "Project Alpha" })
      );
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_VIEW", view: "board" })
      );
    });

    it("dispatches SET_VIEW my-cards on 'm' key", async () => {
      const inst = render(<HomeView />);
      await flushEffects();
      inst.stdin.write("m");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_VIEW", view: "my-cards" })
      );
    });

    it("calls syncCache on 's' key", async () => {
      // syncCache returns a Promise that resolves
      trelloCtx.syncCache.mockResolvedValue(undefined);
      const inst = render(<HomeView />);
      await flushEffects();
      inst.stdin.write("s");
      expect(trelloCtx.syncCache).toHaveBeenCalled();
    });
  });
});
