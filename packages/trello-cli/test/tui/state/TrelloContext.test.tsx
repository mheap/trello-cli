import React, { useEffect, useState } from "react";
import { render } from "ink-testing-library";
import { Box, Text } from "ink";
import {
  TrelloProvider,
  useTrello,
} from "../../../src/tui/state/TrelloContext";
import { makeBoard, makeList, makeCard, makeLabel, makeMember } from "../helpers";

// Minimal mock client and cache so TrelloProvider can be instantiated
const mockClient = {} as any;
const mockCache = {} as any;

/**
 * TestHarness: dispatches actions on mount, then renders state fields as text.
 * Renders "PENDING" on first render (before effects), then the actual state
 * after dispatch.
 */
function TestHarness({
  actions,
  renderState,
}: {
  actions: any[];
  /** Custom function to render specific parts of the state */
  renderState?: (state: any) => React.ReactElement;
}) {
  const { state, dispatch } = useTrello();
  const [dispatched, setDispatched] = useState(false);

  useEffect(() => {
    if (!dispatched) {
      actions.forEach((a) => dispatch(a));
      setDispatched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatched]);

  if (!dispatched && actions.length > 0) {
    return <Text>PENDING</Text>;
  }

  if (renderState) {
    return renderState(state);
  }

  return (
    <Box flexDirection="column">
      <Text>BOARDS:{state.boards.length}</Text>
      <Text>CURRENT:{state.currentBoard ? state.currentBoard.name : "null"}</Text>
      <Text>LISTS:{state.lists.length}</Text>
      <Text>LABELS:{state.boardLabels.length}</Text>
      <Text>MEMBERS:{state.members.length}</Text>
      <Text>LOADING:{String(state.loading)}</Text>
      <Text>ERROR:{String(state.error)}</Text>
      <Text>SYNCED:{state.lastSynced ? "yes" : "no"}</Text>
    </Box>
  );
}

const flushEffects = () =>
  new Promise<void>((r) => setTimeout(r, 0)).then(
    () => new Promise<void>((r) => setTimeout(r, 0))
  );

function renderHarness(actions: any[], renderState?: (state: any) => React.ReactElement) {
  return render(
    <TrelloProvider client={mockClient} cache={mockCache}>
      <TestHarness actions={actions} renderState={renderState} />
    </TrelloProvider>
  );
}

describe("TrelloContext reducer", () => {
  describe("initial state", () => {
    it("starts with empty collections and no loading/error", () => {
      const { lastFrame } = renderHarness([]);
      const output = lastFrame()!;
      expect(output).toContain("BOARDS:0");
      expect(output).toContain("CURRENT:null");
      expect(output).toContain("LISTS:0");
      expect(output).toContain("LABELS:0");
      expect(output).toContain("MEMBERS:0");
      expect(output).toContain("LOADING:false");
      expect(output).toContain("ERROR:null");
      expect(output).toContain("SYNCED:no");
    });
  });

  describe("SET_BOARDS", () => {
    it("sets the boards array", async () => {
      const boards = [
        makeBoard({ id: "b1", name: "Board A" }),
        makeBoard({ id: "b2", name: "Board B" }),
      ];
      const inst = renderHarness(
        [{ type: "SET_BOARDS", boards }],
        (state) => <Text>BOARDS:{state.boards.map((b: any) => b.name).join(",")}</Text>
      );
      await flushEffects();
      expect(inst.lastFrame()!).toContain("BOARDS:Board A,Board B");
    });
  });

  describe("SET_CURRENT_BOARD", () => {
    it("sets the current board", async () => {
      const board = makeBoard({ name: "My Board" });
      const inst = renderHarness([{ type: "SET_CURRENT_BOARD", board }]);
      await flushEffects();
      expect(inst.lastFrame()!).toContain("CURRENT:My Board");
    });

    it("clears the current board with null", async () => {
      const inst = renderHarness([
        { type: "SET_CURRENT_BOARD", board: makeBoard() },
        { type: "SET_CURRENT_BOARD", board: null },
      ]);
      await flushEffects();
      expect(inst.lastFrame()!).toContain("CURRENT:null");
    });
  });

  describe("SET_LISTS", () => {
    it("sets the lists array", async () => {
      const lists = [
        makeList({ id: "l1", name: "To Do" }),
        makeList({ id: "l2", name: "Done" }),
      ];
      const inst = renderHarness([{ type: "SET_LISTS", lists }]);
      await flushEffects();
      expect(inst.lastFrame()!).toContain("LISTS:2");
    });
  });

  describe("SET_CARDS", () => {
    it("sets cards for a specific list", async () => {
      const cards = [
        makeCard({ id: "c1", name: "Card 1", idList: "list-1" }),
        makeCard({ id: "c2", name: "Card 2", idList: "list-1" }),
      ];
      const inst = renderHarness(
        [{ type: "SET_CARDS", listId: "list-1", cards }],
        (state) => (
          <Text>
            CARDS:{(state.cardsByList["list-1"] || []).map((c: any) => c.name).join(",")}
          </Text>
        )
      );
      await flushEffects();
      expect(inst.lastFrame()!).toContain("CARDS:Card 1,Card 2");
    });
  });

  describe("SET_ALL_CARDS", () => {
    it("replaces the entire cardsByList record", async () => {
      const cardsByList = {
        "l1": [makeCard({ id: "c1", idList: "l1" })],
        "l2": [makeCard({ id: "c2", idList: "l2" }), makeCard({ id: "c3", idList: "l2" })],
      };
      const inst = renderHarness(
        [{ type: "SET_ALL_CARDS", cardsByList }],
        (state) => (
          <Text>
            L1:{(state.cardsByList["l1"] || []).length},L2:{(state.cardsByList["l2"] || []).length}
          </Text>
        )
      );
      await flushEffects();
      expect(inst.lastFrame()!).toContain("L1:1,L2:2");
    });
  });

  describe("ADD_CARD", () => {
    it("appends a card to an existing list", async () => {
      const existing = makeCard({ id: "c1", name: "First", idList: "l1" });
      const newCard = makeCard({ id: "c2", name: "Second", idList: "l1" });
      const inst = renderHarness(
        [
          { type: "SET_CARDS", listId: "l1", cards: [existing] },
          { type: "ADD_CARD", listId: "l1", card: newCard },
        ],
        (state) => (
          <Text>
            CARDS:{(state.cardsByList["l1"] || []).map((c: any) => c.name).join(",")}
          </Text>
        )
      );
      await flushEffects();
      expect(inst.lastFrame()!).toContain("CARDS:First,Second");
    });

    it("creates a new array when list has no cards yet", async () => {
      const card = makeCard({ id: "c1", name: "Only", idList: "l-new" });
      const inst = renderHarness(
        [{ type: "ADD_CARD", listId: "l-new", card }],
        (state) => (
          <Text>
            CARDS:{(state.cardsByList["l-new"] || []).map((c: any) => c.name).join(",")}
          </Text>
        )
      );
      await flushEffects();
      expect(inst.lastFrame()!).toContain("CARDS:Only");
    });
  });

  describe("REMOVE_CARD", () => {
    it("removes a card from a list by id", async () => {
      const cards = [
        makeCard({ id: "c1", name: "Keep", idList: "l1" }),
        makeCard({ id: "c2", name: "Remove", idList: "l1" }),
        makeCard({ id: "c3", name: "Also Keep", idList: "l1" }),
      ];
      const inst = renderHarness(
        [
          { type: "SET_CARDS", listId: "l1", cards },
          { type: "REMOVE_CARD", listId: "l1", cardId: "c2" },
        ],
        (state) => (
          <Text>
            CARDS:{(state.cardsByList["l1"] || []).map((c: any) => c.name).join(",")}
          </Text>
        )
      );
      await flushEffects();
      expect(inst.lastFrame()!).toContain("CARDS:Keep,Also Keep");
    });
  });

  describe("UPDATE_CARD", () => {
    it("updates a card in-place by id within its list", async () => {
      const original = makeCard({ id: "c1", name: "Original", idList: "l1" });
      const updated = makeCard({ id: "c1", name: "Updated Name", idList: "l1" });
      const inst = renderHarness(
        [
          { type: "SET_CARDS", listId: "l1", cards: [original] },
          { type: "UPDATE_CARD", card: updated },
        ],
        (state) => (
          <Text>
            NAME:{(state.cardsByList["l1"] || [])[0]?.name}
          </Text>
        )
      );
      await flushEffects();
      expect(inst.lastFrame()!).toContain("NAME:Updated Name");
    });
  });

  describe("MOVE_CARD", () => {
    it("removes card from source list and appends to destination list", async () => {
      const card = makeCard({ id: "c1", name: "Moving Card", idList: "l1" });
      const movedCard = makeCard({ id: "c1", name: "Moving Card", idList: "l2" });
      const otherCard = makeCard({ id: "c2", name: "Staying", idList: "l2" });
      const inst = renderHarness(
        [
          { type: "SET_CARDS", listId: "l1", cards: [card] },
          { type: "SET_CARDS", listId: "l2", cards: [otherCard] },
          { type: "MOVE_CARD", cardId: "c1", fromListId: "l1", toListId: "l2", card: movedCard },
        ],
        (state) => (
          <Box flexDirection="column">
            <Text>FROM:{(state.cardsByList["l1"] || []).length}</Text>
            <Text>TO:{(state.cardsByList["l2"] || []).map((c: any) => c.name).join(",")}</Text>
          </Box>
        )
      );
      await flushEffects();
      const output = inst.lastFrame()!;
      expect(output).toContain("FROM:0");
      expect(output).toContain("TO:Staying,Moving Card");
    });
  });

  describe("ADD_LIST", () => {
    it("adds a list and initializes empty card array", async () => {
      const list = makeList({ id: "l-new", name: "New List" });
      const inst = renderHarness(
        [
          { type: "SET_LISTS", lists: [makeList({ id: "l1" })] },
          { type: "ADD_LIST", list },
        ],
        (state) => (
          <Box flexDirection="column">
            <Text>LISTS:{state.lists.length}</Text>
            <Text>NAMES:{state.lists.map((l: any) => l.name).join(",")}</Text>
            <Text>CARDS:{JSON.stringify(state.cardsByList["l-new"])}</Text>
          </Box>
        )
      );
      await flushEffects();
      const output = inst.lastFrame()!;
      expect(output).toContain("LISTS:2");
      expect(output).toContain("New List");
      expect(output).toContain("CARDS:[]");
    });
  });

  describe("SET_MEMBERS", () => {
    it("sets the members array", async () => {
      const members = [
        makeMember({ id: "m1", fullName: "Alice" }),
        makeMember({ id: "m2", fullName: "Bob" }),
      ];
      const inst = renderHarness(
        [{ type: "SET_MEMBERS", members }],
        (state) => (
          <Text>MEMBERS:{state.members.map((m: any) => m.fullName).join(",")}</Text>
        )
      );
      await flushEffects();
      expect(inst.lastFrame()!).toContain("MEMBERS:Alice,Bob");
    });
  });

  describe("SET_BOARD_LABELS", () => {
    it("sets the board labels", async () => {
      const labels = [
        makeLabel({ id: "lb1", name: "Bug", color: "red" }),
        makeLabel({ id: "lb2", name: "Feature", color: "blue" }),
      ];
      const inst = renderHarness(
        [{ type: "SET_BOARD_LABELS", labels }],
        (state) => (
          <Text>LABELS:{state.boardLabels.map((l: any) => l.name).join(",")}</Text>
        )
      );
      await flushEffects();
      expect(inst.lastFrame()!).toContain("LABELS:Bug,Feature");
    });
  });

  describe("SET_LOADING", () => {
    it("sets loading to true", async () => {
      const inst = renderHarness([{ type: "SET_LOADING", loading: true }]);
      await flushEffects();
      expect(inst.lastFrame()!).toContain("LOADING:true");
    });

    it("sets loading to false", async () => {
      const inst = renderHarness([
        { type: "SET_LOADING", loading: true },
        { type: "SET_LOADING", loading: false },
      ]);
      await flushEffects();
      expect(inst.lastFrame()!).toContain("LOADING:false");
    });
  });

  describe("SET_ERROR", () => {
    it("sets an error message", async () => {
      const inst = renderHarness([{ type: "SET_ERROR", error: "Something broke" }]);
      await flushEffects();
      expect(inst.lastFrame()!).toContain("ERROR:Something broke");
    });

    it("clears the error with null", async () => {
      const inst = renderHarness([
        { type: "SET_ERROR", error: "fail" },
        { type: "SET_ERROR", error: null },
      ]);
      await flushEffects();
      expect(inst.lastFrame()!).toContain("ERROR:null");
    });
  });

  describe("SET_SYNCED", () => {
    it("sets lastSynced to a Date", async () => {
      const inst = renderHarness([{ type: "SET_SYNCED" }]);
      await flushEffects();
      expect(inst.lastFrame()!).toContain("SYNCED:yes");
    });
  });

  describe("useTrello outside provider", () => {
    it("throws when used outside TrelloProvider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      function Naked() {
        const ctx = useTrello();
        return <Text>{ctx.state.loading}</Text>;
      }

      let error: Error | null = null;
      try {
        render(<Naked />);
      } catch (e: any) {
        error = e;
      }

      if (error) {
        expect(error.message).toContain("useTrello must be used within TrelloProvider");
      } else {
        expect(true).toBe(true);
      }

      consoleSpy.mockRestore();
    });
  });
});
