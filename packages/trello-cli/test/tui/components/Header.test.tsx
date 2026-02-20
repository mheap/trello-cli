import React from "react";
import { render } from "ink-testing-library";
const { stripVTControlCharacters } = require("node:util");
import { Header } from "../../../src/tui/components/Header";
import { createMockNavContext, createMockTrelloContext, makeBoard, makeList, makeCard } from "../helpers";

jest.mock("../../../src/tui/state/NavigationContext", () => ({
  useNavigation: jest.fn(),
}));
jest.mock("../../../src/tui/state/TrelloContext", () => ({
  useTrello: jest.fn(),
}));

import { useNavigation } from "../../../src/tui/state/NavigationContext";
import { useTrello } from "../../../src/tui/state/TrelloContext";
const mockUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;
const mockUseTrello = useTrello as jest.MockedFunction<typeof useTrello>;

describe("Header", () => {
  beforeEach(() => {
    mockUseNavigation.mockReturnValue(createMockNavContext() as any);
    mockUseTrello.mockReturnValue(createMockTrelloContext() as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows 'Trello CLI' on home view", () => {
    mockUseNavigation.mockReturnValue(createMockNavContext({ view: "home" }) as any);
    const { lastFrame } = render(<Header />);
    expect(lastFrame()!).toContain("Trello CLI");
  });

  it("shows board name on board view", () => {
    mockUseNavigation.mockReturnValue(createMockNavContext({ view: "board" }) as any);
    mockUseTrello.mockReturnValue(
      createMockTrelloContext({
        currentBoard: makeBoard({ name: "My Project Board" }),
      }) as any
    );
    const { lastFrame } = render(<Header />);
    expect(lastFrame()!).toContain("My Project Board");
  });

  it("shows list count on board view", () => {
    mockUseNavigation.mockReturnValue(createMockNavContext({ view: "board" }) as any);
    mockUseTrello.mockReturnValue(
      createMockTrelloContext({
        currentBoard: makeBoard(),
        lists: [
          makeList({ id: "l1", name: "To Do" }),
          makeList({ id: "l2", name: "Doing" }),
          makeList({ id: "l3", name: "Done" }),
        ],
      }) as any
    );
    const { lastFrame } = render(<Header />);
    const output = stripVTControlCharacters(lastFrame()!);
    expect(output).toContain("Test Board (3 lists)");
  });

  it("shows 'My Assigned Cards' on my-cards view", () => {
    mockUseNavigation.mockReturnValue(createMockNavContext({ view: "my-cards" }) as any);
    const { lastFrame } = render(<Header />);
    expect(lastFrame()!).toContain("My Assigned Cards");
  });

  it("shows loading indicator when loading", () => {
    mockUseTrello.mockReturnValue(
      createMockTrelloContext({ loading: true }) as any
    );
    const { lastFrame } = render(<Header />);
    expect(lastFrame()!).toContain("Loading...");
  });

  it("shows error message when error exists", () => {
    mockUseTrello.mockReturnValue(
      createMockTrelloContext({ error: "API rate limit exceeded" }) as any
    );
    const { lastFrame } = render(<Header />);
    expect(lastFrame()!).toContain("API rate limit exceeded");
  });

  it("shows sync time when lastSynced is set", () => {
    mockUseTrello.mockReturnValue(
      createMockTrelloContext({ lastSynced: new Date() }) as any
    );
    const { lastFrame } = render(<Header />);
    expect(lastFrame()!).toContain("Synced just now");
  });

  it("shows minutes ago for older sync", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    mockUseTrello.mockReturnValue(
      createMockTrelloContext({ lastSynced: fiveMinAgo }) as any
    );
    const { lastFrame } = render(<Header />);
    expect(lastFrame()!).toContain("5m ago");
  });

  it("does not show list count when no lists", () => {
    mockUseNavigation.mockReturnValue(createMockNavContext({ view: "board" }) as any);
    mockUseTrello.mockReturnValue(
      createMockTrelloContext({
        currentBoard: makeBoard({ name: "Empty Board" }),
        lists: [],
      }) as any
    );
    const { lastFrame } = render(<Header />);
    const output = stripVTControlCharacters(lastFrame()!);
    expect(output).toContain("Empty Board");
    expect(output).not.toContain("lists");
  });

  it("shows status message when set", () => {
    mockUseNavigation.mockReturnValue(
      createMockNavContext({ statusMessage: "Card created successfully" }) as any
    );
    const { lastFrame } = render(<Header />);
    expect(lastFrame()!).toContain("Card created successfully");
  });

  describe("card breadcrumb in modal modes", () => {
    const board = makeBoard({ name: "My Board" });
    const list = makeList({ id: "l1", name: "In Progress" });
    const card = makeCard({ id: "c1", name: "Fix login bug", idList: "l1" });

    function setupModal(mode: string) {
      mockUseNavigation.mockReturnValue(
        createMockNavContext({
          view: "board",
          mode: mode as any,
          selectedListIndex: 0,
          selectedCardIndex: 0,
        }) as any
      );
      mockUseTrello.mockReturnValue(
        createMockTrelloContext({
          currentBoard: board,
          lists: [list],
          cardsByList: { l1: [card] },
        }) as any
      );
    }

    it("shows Board / List / Card breadcrumb in toggle-label mode", () => {
      setupModal("toggle-label");
      const { lastFrame } = render(<Header />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("My Board / In Progress / Fix login bug");
      expect(output).not.toContain("lists");
    });

    it("shows Board / List / Card breadcrumb in toggle-member mode", () => {
      setupModal("toggle-member");
      const { lastFrame } = render(<Header />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("My Board / In Progress / Fix login bug");
    });

    it("shows Board / List / Card breadcrumb in toggle-checklist mode", () => {
      setupModal("toggle-checklist");
      const { lastFrame } = render(<Header />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("My Board / In Progress / Fix login bug");
    });

    it("shows Board / List / Card breadcrumb in edit-card mode", () => {
      setupModal("edit-card");
      const { lastFrame } = render(<Header />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("My Board / In Progress / Fix login bug");
    });

    it("shows Board / List / Card breadcrumb in move-card mode", () => {
      setupModal("move-card");
      const { lastFrame } = render(<Header />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("My Board / In Progress / Fix login bug");
    });

    it("shows Board / List when no card exists at selected index", () => {
      mockUseNavigation.mockReturnValue(
        createMockNavContext({
          view: "board",
          mode: "create-card",
          selectedListIndex: 0,
          selectedCardIndex: 0,
        }) as any
      );
      mockUseTrello.mockReturnValue(
        createMockTrelloContext({
          currentBoard: board,
          lists: [list],
          cardsByList: { l1: [] },
        }) as any
      );
      const { lastFrame } = render(<Header />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("My Board / In Progress");
      expect(output).not.toContain("Fix login bug");
    });

    it("still shows board name with list count in normal mode", () => {
      mockUseNavigation.mockReturnValue(
        createMockNavContext({ view: "board", mode: "normal" }) as any
      );
      mockUseTrello.mockReturnValue(
        createMockTrelloContext({
          currentBoard: board,
          lists: [list],
          cardsByList: { l1: [card] },
        }) as any
      );
      const { lastFrame } = render(<Header />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("My Board (1 lists)");
      expect(output).not.toContain("In Progress");
    });
  });
});
