import React from "react";
import { render } from "ink-testing-library";
const { stripVTControlCharacters } = require("node:util");
import { CardDetailView } from "../../../src/tui/views/CardDetailView";
import {
  createMockNavContext,
  createMockTrelloContext,
  makeBoard,
  makeList,
  makeCard,
  makeLabel,
  makeMember,
} from "../helpers";
import { TrelloChecklist, TrelloAttachment } from "../../../src/tui/types";

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

const flushEffects = () =>
  new Promise<void>((r) => setTimeout(r, 0)).then(
    () => new Promise<void>((r) => setTimeout(r, 0))
  );

describe("CardDetailView", () => {
  let navDispatch: jest.Mock;
  let trelloCtx: ReturnType<typeof createMockTrelloContext>;

  const board = makeBoard({ name: "My Board" });
  const list = makeList({ id: "l1", name: "In Progress" });
  const card = makeCard({
    id: "c1",
    name: "Fix login bug",
    desc: "Users cannot log in with email",
    url: "https://trello.com/c/xyz789",
    idList: "l1",
    labels: [
      makeLabel({ id: "lb1", name: "Bug", color: "red" }),
      makeLabel({ id: "lb2", name: "Priority", color: "yellow" }),
    ],
    idMembers: ["m1"],
  });

  beforeEach(() => {
    navDispatch = jest.fn();
    const navCtx = createMockNavContext({
      view: "card-detail",
      selectedListIndex: 0,
      selectedCardIndex: 0,
    });
    navCtx.dispatch = navDispatch;
    mockUseNavigation.mockReturnValue(navCtx as any);

    trelloCtx = createMockTrelloContext({
      currentBoard: board,
      lists: [list],
      cardsByList: { "l1": [card] },
      members: [makeMember({ id: "m1", fullName: "Alice Smith" })],
    });
    mockUseTrello.mockReturnValue(trelloCtx as any);
  });

  describe("breadcrumb rendering", () => {
    it("shows board / list / card name breadcrumb", () => {
      const { lastFrame } = render(<CardDetailView />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("My Board / In Progress / Fix login bug");
    });
  });

  describe("metadata display", () => {
    it("shows card ID", () => {
      const { lastFrame } = render(<CardDetailView />);
      expect(lastFrame()!).toContain("c1");
    });

    it("shows card URL", () => {
      const { lastFrame } = render(<CardDetailView />);
      expect(lastFrame()!).toContain("https://trello.com/c/xyz789");
    });
  });

  describe("labels", () => {
    it("shows labels with [l] indicator", () => {
      const { lastFrame } = render(<CardDetailView />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("Labels: [l]");
      expect(output).toContain("#Bug");
      expect(output).toContain("#Priority");
    });

    it("hides labels section when card has no labels", () => {
      const noLabelCard = makeCard({ id: "c1", name: "No Labels", labels: [], idList: "l1" });
      trelloCtx = createMockTrelloContext({
        currentBoard: board,
        lists: [list],
        cardsByList: { "l1": [noLabelCard] },
      });
      mockUseTrello.mockReturnValue(trelloCtx as any);
      const { lastFrame } = render(<CardDetailView />);
      expect(lastFrame()!).not.toContain("Labels:");
    });
  });

  describe("members", () => {
    it("shows member names", () => {
      const { lastFrame } = render(<CardDetailView />);
      const output = lastFrame()!;
      expect(output).toContain("Members:");
      expect(output).toContain("Alice Smith");
    });

    it("hides members section when card has no members", () => {
      const noMemberCard = makeCard({ id: "c1", name: "No Members", idMembers: [], idList: "l1" });
      trelloCtx = createMockTrelloContext({
        currentBoard: board,
        lists: [list],
        cardsByList: { "l1": [noMemberCard] },
      });
      mockUseTrello.mockReturnValue(trelloCtx as any);
      const { lastFrame } = render(<CardDetailView />);
      expect(lastFrame()!).not.toContain("Members:");
    });
  });

  describe("description", () => {
    it("shows description with [D] indicator", () => {
      const { lastFrame } = render(<CardDetailView />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("Description: [D]");
      expect(output).toContain("Users cannot log in with email");
    });

    it("hides description section when card has no description", () => {
      const noDescCard = makeCard({ id: "c1", name: "No Desc", desc: "", idList: "l1" });
      trelloCtx = createMockTrelloContext({
        currentBoard: board,
        lists: [list],
        cardsByList: { "l1": [noDescCard] },
      });
      mockUseTrello.mockReturnValue(trelloCtx as any);
      const { lastFrame } = render(<CardDetailView />);
      expect(lastFrame()!).not.toContain("Description:");
    });
  });

  describe("checklists", () => {
    it("shows single checklist with items", () => {
      const checklist: TrelloChecklist = {
        id: "cl1",
        name: "Tasks",
        idCard: "c1",
        pos: 1,
        checkItems: [
          { id: "ci1", name: "Step 1", state: "complete", pos: 1, idChecklist: "cl1" },
          { id: "ci2", name: "Step 2", state: "incomplete", pos: 2, idChecklist: "cl1" },
        ],
      };
      const cardWithCl = makeCard({
        id: "c1", name: "CL Card", idList: "l1",
        checklists: [checklist],
      });
      trelloCtx = createMockTrelloContext({
        currentBoard: board,
        lists: [list],
        cardsByList: { "l1": [cardWithCl] },
      });
      mockUseTrello.mockReturnValue(trelloCtx as any);

      const { lastFrame } = render(<CardDetailView />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("Checklists: [c]");
      expect(output).toContain("Tasks (1/2)");
      expect(output).toContain("Step 1");
      expect(output).toContain("Step 2");
    });

    it("shows multiple checklists with counts only", () => {
      const cl1: TrelloChecklist = {
        id: "cl1", name: "Frontend", idCard: "c1", pos: 1,
        checkItems: [
          { id: "ci1", name: "A1", state: "complete", pos: 1, idChecklist: "cl1" },
        ],
      };
      const cl2: TrelloChecklist = {
        id: "cl2", name: "Backend", idCard: "c1", pos: 2,
        checkItems: [
          { id: "ci2", name: "B2", state: "incomplete", pos: 1, idChecklist: "cl2" },
          { id: "ci3", name: "C3", state: "incomplete", pos: 2, idChecklist: "cl2" },
        ],
      };
      const cardWithCls = makeCard({
        id: "c1", name: "Multi CL", idList: "l1",
        checklists: [cl1, cl2],
      });
      trelloCtx = createMockTrelloContext({
        currentBoard: board,
        lists: [list],
        cardsByList: { "l1": [cardWithCls] },
      });
      mockUseTrello.mockReturnValue(trelloCtx as any);

      const { lastFrame } = render(<CardDetailView />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("Frontend (1/1)");
      expect(output).toContain("Backend (0/2)");
      // Individual items should NOT be shown for multiple checklists
      expect(output).not.toContain("A1"); // Item name — but "A" appears in other places
    });

    it("hides checklists section when card has no checklists", () => {
      const noClCard = makeCard({ id: "c1", name: "No CL", idList: "l1" });
      trelloCtx = createMockTrelloContext({
        currentBoard: board,
        lists: [list],
        cardsByList: { "l1": [noClCard] },
      });
      mockUseTrello.mockReturnValue(trelloCtx as any);
      const { lastFrame } = render(<CardDetailView />);
      expect(lastFrame()!).not.toContain("Checklists:");
    });
  });

  describe("attachments", () => {
    it("shows attachment count with [a] indicator", () => {
      const cardWithAttach = makeCard({
        id: "c1", name: "Attached", idList: "l1",
        attachments: [
          { id: "at1", name: "file.pdf", url: "https://example.com/file.pdf", date: "2025-01-01", mimeType: "application/pdf", bytes: 1024, isUpload: true, fileName: "file.pdf" },
          { id: "at2", name: "img.png", url: "https://example.com/img.png", date: "2025-01-02", mimeType: "image/png", bytes: 2048, isUpload: false, fileName: null },
        ] as TrelloAttachment[],
      });
      trelloCtx = createMockTrelloContext({
        currentBoard: board,
        lists: [list],
        cardsByList: { "l1": [cardWithAttach] },
      });
      mockUseTrello.mockReturnValue(trelloCtx as any);

      const { lastFrame } = render(<CardDetailView />);
      const output = stripVTControlCharacters(lastFrame()!);
      expect(output).toContain("Attachments: 2 [a]");
    });

    it("hides attachments section when card has no attachments", () => {
      const { lastFrame } = render(<CardDetailView />);
      expect(lastFrame()!).not.toContain("Attachments:");
    });
  });

  describe("footer shortcuts", () => {
    it("shows essential action shortcuts", () => {
      const { lastFrame } = render(<CardDetailView />);
      const output = lastFrame()!;
      expect(output).toContain("[Esc] Close");
      expect(output).toContain("[e] Edit");
      expect(output).toContain("[l] Labels");
      expect(output).toContain("[d] Due date");
      expect(output).toContain("[o] Open");
      expect(output).toContain("[?] Help");
    });
  });

  describe("no card selected", () => {
    it("shows 'No card selected' when no card exists", () => {
      trelloCtx = createMockTrelloContext({
        currentBoard: board,
        lists: [list],
        cardsByList: { "l1": [] },
      });
      mockUseTrello.mockReturnValue(trelloCtx as any);

      const { lastFrame } = render(<CardDetailView />);
      expect(lastFrame()!).toContain("No card selected");
    });
  });

  describe("keyboard shortcuts", () => {
    it("dispatches SET_VIEW board on Escape", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("\u001B");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_VIEW", view: "board", preserveSelection: true })
      );
    });

    it("dispatches edit-card mode on 'e'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("e");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_MODE", mode: "edit-card", originView: "card-detail" })
      );
    });

    it("dispatches move-card mode on 'm'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("m");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_MODE", mode: "move-card", originView: "card-detail" })
      );
    });

    it("dispatches set-due mode on 'd'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("d");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_MODE", mode: "set-due", originView: "card-detail" })
      );
    });

    it("dispatches toggle-label mode on 'l'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("l");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_MODE", mode: "toggle-label", originView: "card-detail" })
      );
    });

    it("dispatches toggle-member mode on 'M'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("M");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_MODE", mode: "toggle-member", originView: "card-detail" })
      );
    });

    it("dispatches edit-desc mode on 'D'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("D");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_MODE", mode: "edit-desc", originView: "card-detail" })
      );
    });

    it("dispatches toggle-checklist mode on 'c'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("c");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_MODE", mode: "toggle-checklist", originView: "card-detail" })
      );
    });

    it("dispatches add-checklist mode on 'C'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("C");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_MODE", mode: "add-checklist", originView: "card-detail" })
      );
    });

    it("dispatches add-attachment mode on 'A'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("A");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_MODE", mode: "add-attachment", originView: "card-detail" })
      );
    });

    it("dispatches view-attachments mode on 'a'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("a");
      expect(navDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SET_MODE", mode: "view-attachments", originView: "card-detail" })
      );
    });

    it("archives card on 'x'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("x");
      expect(trelloCtx.archiveCard).toHaveBeenCalledWith("c1", "l1");
    });
  });

  describe("help overlay", () => {
    it("shows help overlay on '?'", async () => {
      const inst = render(<CardDetailView />);
      await flushEffects();
      inst.stdin.write("?");
      await flushEffects();
      const output = inst.lastFrame()!;
      expect(output).toContain("Card Detail Shortcuts");
      expect(output).toContain("Edit card name");
      expect(output).toContain("Edit description");
      expect(output).toContain("Move card");
      expect(output).toContain("Toggle labels");
    });
  });
});
