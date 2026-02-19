import React, { createContext, useContext, useReducer, useCallback } from "react";
import { TrelloClient } from "trello.js";
import Cache from "@trello-cli/cache";
import {
  TrelloBoard,
  TrelloList,
  TrelloCard,
  TrelloLabel,
  TrelloMember,
  TrelloChecklist,
  TrelloCheckItem,
  TrelloAttachment,
} from "../types";

// Helper to normalize any API card response into our TrelloCard type
function toTrelloCard(c: any): TrelloCard {
  return {
    id: c.id,
    name: c.name,
    desc: c.desc || "",
    due: c.due ?? null,
    closed: c.closed,
    url: c.url || "",
    shortLink: c.shortLink || "",
    idList: c.idList || "",
    idBoard: c.idBoard || "",
    idMembers: (c.idMembers as string[]) || [],
    labels: ((c.labels || []) as any[]).map((l: any) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      idBoard: l.idBoard,
    })),
  };
}

interface TrelloState {
  boards: TrelloBoard[];
  currentBoard: TrelloBoard | null;
  lists: TrelloList[];
  cardsByList: Record<string, TrelloCard[]>;
  boardLabels: TrelloLabel[];
  members: TrelloMember[];
  loading: boolean;
  error: string | null;
  lastSynced: Date | null;
}

type TrelloAction =
  | { type: "SET_BOARDS"; boards: TrelloBoard[] }
  | { type: "SET_CURRENT_BOARD"; board: TrelloBoard | null }
  | { type: "SET_LISTS"; lists: TrelloList[] }
  | { type: "SET_CARDS"; listId: string; cards: TrelloCard[] }
  | { type: "SET_ALL_CARDS"; cardsByList: Record<string, TrelloCard[]> }
  | { type: "ADD_CARD"; listId: string; card: TrelloCard }
  | { type: "REMOVE_CARD"; listId: string; cardId: string }
  | { type: "UPDATE_CARD"; card: TrelloCard }
  | { type: "MOVE_CARD"; cardId: string; fromListId: string; toListId: string; card: TrelloCard }
  | { type: "ADD_LIST"; list: TrelloList }
  | { type: "SET_MEMBERS"; members: TrelloMember[] }
  | { type: "SET_BOARD_LABELS"; labels: TrelloLabel[] }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_SYNCED" };

function trelloReducer(state: TrelloState, action: TrelloAction): TrelloState {
  switch (action.type) {
    case "SET_BOARDS":
      return { ...state, boards: action.boards };
    case "SET_CURRENT_BOARD":
      return { ...state, currentBoard: action.board };
    case "SET_LISTS":
      return { ...state, lists: action.lists };
    case "SET_CARDS":
      return {
        ...state,
        cardsByList: { ...state.cardsByList, [action.listId]: action.cards },
      };
    case "SET_ALL_CARDS":
      return { ...state, cardsByList: action.cardsByList };
    case "ADD_CARD": {
      const existing = state.cardsByList[action.listId] || [];
      return {
        ...state,
        cardsByList: {
          ...state.cardsByList,
          [action.listId]: [...existing, action.card],
        },
      };
    }
    case "REMOVE_CARD": {
      const existing = state.cardsByList[action.listId] || [];
      return {
        ...state,
        cardsByList: {
          ...state.cardsByList,
          [action.listId]: existing.filter((c) => c.id !== action.cardId),
        },
      };
    }
    case "UPDATE_CARD": {
      const listId = action.card.idList;
      const existing = state.cardsByList[listId] || [];
      return {
        ...state,
        cardsByList: {
          ...state.cardsByList,
          [listId]: existing.map((c) =>
            c.id === action.card.id ? action.card : c
          ),
        },
      };
    }
    case "MOVE_CARD": {
      const fromCards = (state.cardsByList[action.fromListId] || []).filter(
        (c) => c.id !== action.cardId
      );
      const toCards = [
        ...(state.cardsByList[action.toListId] || []),
        action.card,
      ];
      return {
        ...state,
        cardsByList: {
          ...state.cardsByList,
          [action.fromListId]: fromCards,
          [action.toListId]: toCards,
        },
      };
    }
    case "ADD_LIST":
      return { ...state, lists: [...state.lists, action.list], cardsByList: { ...state.cardsByList, [action.list.id]: [] } };
    case "SET_MEMBERS":
      return { ...state, members: action.members };
    case "SET_BOARD_LABELS":
      return { ...state, boardLabels: action.labels };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "SET_SYNCED":
      return { ...state, lastSynced: new Date() };
    default:
      return state;
  }
}

const initialState: TrelloState = {
  boards: [],
  currentBoard: null,
  lists: [],
  cardsByList: {},
  boardLabels: [],
  members: [],
  loading: false,
  error: null,
  lastSynced: null,
};

interface TrelloContextType {
  state: TrelloState;
  dispatch: React.Dispatch<TrelloAction>;
  client: TrelloClient;
  cache: Cache;
  loadBoards: () => Promise<void>;
  loadBoard: (board: TrelloBoard) => Promise<void>;
  createCard: (listId: string, name: string, opts?: { desc?: string; due?: string; position?: "top" | "bottom" }) => Promise<TrelloCard>;
  createList: (name: string) => Promise<TrelloList>;
  moveCard: (cardId: string, fromListId: string, toListId: string) => Promise<void>;
  archiveCard: (cardId: string, listId: string) => Promise<void>;
  deleteCard: (cardId: string, listId: string) => Promise<void>;
  updateCard: (cardId: string, updates: { name?: string; desc?: string; due?: string | null }) => Promise<TrelloCard>;
  addLabelToCard: (cardId: string, labelId: string) => Promise<void>;
  removeLabelFromCard: (cardId: string, labelId: string) => Promise<void>;
  addMemberToCard: (cardId: string, memberId: string) => Promise<void>;
  removeMemberFromCard: (cardId: string, memberId: string) => Promise<void>;
  loadCardDetails: (cardId: string) => Promise<void>;
  createChecklist: (cardId: string, name: string) => Promise<void>;
  deleteChecklist: (cardId: string, checklistId: string) => Promise<void>;
  createCheckItem: (checklistId: string, name: string, cardId: string) => Promise<void>;
  deleteCheckItem: (cardId: string, checkItemId: string) => Promise<void>;
  toggleCheckItem: (cardId: string, checkItemId: string, currentState: "complete" | "incomplete") => Promise<void>;
  addAttachment: (cardId: string, url: string, name?: string) => Promise<void>;
  deleteAttachment: (cardId: string, attachmentId: string) => Promise<void>;
  syncCache: () => Promise<void>;
  loadAssignedCards: () => Promise<TrelloCard[]>;
}

const TrelloContext = createContext<TrelloContextType | null>(null);

export function TrelloProvider({
  children,
  client,
  cache,
}: {
  children: React.ReactNode;
  client: TrelloClient;
  cache: Cache;
}) {
  const [state, dispatch] = useReducer(trelloReducer, initialState);

  const loadBoards = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "SET_ERROR", error: null });
    try {
      const boards = await client.members.getMemberBoards({
        id: "me",
        filter: "open",
      });
      dispatch({
        type: "SET_BOARDS",
        boards: (boards as any[]).map((b: any) => ({
          id: b.id,
          name: b.name,
          desc: b.desc || "",
          url: b.url,
          shortLink: b.shortLink,
          closed: b.closed,
        })),
      });
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", error: e.message || "Failed to load boards" });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, [client]);

  const loadBoard = useCallback(
    async (board: TrelloBoard) => {
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_ERROR", error: null });
      dispatch({ type: "SET_CURRENT_BOARD", board });
      try {
        const lists = await client.boards.getBoardLists({
          id: board.id,
          filter: "open",
        });
        const trelloLists: TrelloList[] = (lists as any[]).map((l: any) => ({
          id: l.id,
          name: l.name,
          closed: l.closed,
          idBoard: l.idBoard,
        }));
        dispatch({ type: "SET_LISTS", lists: trelloLists });

        // Load cards for all lists in parallel
        const cardsByList: Record<string, TrelloCard[]> = {};
        await Promise.all(
          trelloLists.map(async (list) => {
            const cards = await client.lists.getListCards({ id: list.id });
            cardsByList[list.id] = (cards as any[]).map(toTrelloCard);
          })
        );
        dispatch({ type: "SET_ALL_CARDS", cardsByList });

        // Load members
        const members = await client.boards.getBoardMembers({ id: board.id });
        dispatch({
          type: "SET_MEMBERS",
          members: (members as any[]).map((m: any) => ({
            id: m.id,
            username: m.username,
            fullName: m.fullName,
            initials: m.initials || "",
          })),
        });

        // Load board labels
        const labels = await client.boards.getBoardLabels({ id: board.id });
        dispatch({
          type: "SET_BOARD_LABELS",
          labels: (labels as any[]).map((l: any) => ({
            id: l.id,
            name: l.name || "",
            color: l.color || "",
            idBoard: l.idBoard || board.id,
          })),
        });
      } catch (e: any) {
        dispatch({
          type: "SET_ERROR",
          error: e.message || "Failed to load board",
        });
      } finally {
        dispatch({ type: "SET_LOADING", loading: false });
      }
    },
    [client]
  );

  const createCard = useCallback(
    async (listId: string, name: string, opts?: { desc?: string; due?: string; position?: "top" | "bottom" }) => {
      const card = await client.cards.createCard({
        idList: listId,
        name,
        desc: opts?.desc,
        due: opts?.due as any,
        pos: (opts?.position || "bottom") as "top" | "bottom",
      });

      const trelloCard = toTrelloCard(card);
      dispatch({ type: "ADD_CARD", listId, card: trelloCard });
      return trelloCard;
    },
    [client]
  );

  const createList = useCallback(
    async (name: string): Promise<TrelloList> => {
      if (!state.currentBoard) {
        throw new Error("No board selected");
      }
      const list = await client.lists.createList({
        name,
        idBoard: state.currentBoard.id,
        pos: "bottom",
      });
      const trelloList: TrelloList = {
        id: (list as any).id,
        name: (list as any).name,
        closed: (list as any).closed,
        idBoard: (list as any).idBoard,
      };
      dispatch({ type: "ADD_LIST", list: trelloList });
      return trelloList;
    },
    [client, state.currentBoard]
  );

  const moveCard = useCallback(
    async (cardId: string, fromListId: string, toListId: string) => {
      const updated = await client.cards.updateCard({
        id: cardId,
        idList: toListId,
      });

      const card = toTrelloCard(updated);
      dispatch({ type: "MOVE_CARD", cardId, fromListId, toListId, card });
    },
    [client]
  );

  const archiveCard = useCallback(
    async (cardId: string, listId: string) => {
      await client.cards.updateCard({ id: cardId, closed: true });
      dispatch({ type: "REMOVE_CARD", listId, cardId });
    },
    [client]
  );

  const deleteCard = useCallback(
    async (cardId: string, listId: string) => {
      await client.cards.deleteCard({ id: cardId });
      dispatch({ type: "REMOVE_CARD", listId, cardId });
    },
    [client]
  );

  const updateCard = useCallback(
    async (cardId: string, updates: { name?: string; desc?: string; due?: string | null }) => {
      const updated = await client.cards.updateCard({
        id: cardId,
        ...updates,
      } as any);

      const card = toTrelloCard(updated);
      dispatch({ type: "UPDATE_CARD", card });
      return card;
    },
    [client]
  );

  const addLabelToCard = useCallback(
    async (cardId: string, labelId: string) => {
      await client.cards.addCardLabel({ id: cardId, value: labelId });
      // Re-fetch card to get updated labels
      const updated = await client.cards.getCard({ id: cardId });
      const card = toTrelloCard(updated);
      dispatch({ type: "UPDATE_CARD", card });
    },
    [client]
  );

  const removeLabelFromCard = useCallback(
    async (cardId: string, labelId: string) => {
      await client.cards.deleteCardLabel({ id: cardId, idLabel: labelId });
      // Re-fetch card to get updated labels
      const updated = await client.cards.getCard({ id: cardId });
      const card = toTrelloCard(updated);
      dispatch({ type: "UPDATE_CARD", card });
    },
    [client]
  );

  const addMemberToCard = useCallback(
    async (cardId: string, memberId: string) => {
      await client.cards.addCardMember({ id: cardId, value: memberId });
      // Re-fetch card to get updated members
      const updated = await client.cards.getCard({ id: cardId });
      const card = toTrelloCard(updated);
      dispatch({ type: "UPDATE_CARD", card });
    },
    [client]
  );

  const removeMemberFromCard = useCallback(
    async (cardId: string, memberId: string) => {
      await client.cards.deleteCardMember({ id: cardId, idMember: memberId });
      // Re-fetch card to get updated members
      const updated = await client.cards.getCard({ id: cardId });
      const card = toTrelloCard(updated);
      dispatch({ type: "UPDATE_CARD", card });
    },
    [client]
  );

  // Helper to re-fetch card with checklists and attachments, then update state
  const refetchCardDetails = useCallback(
    async (cardId: string) => {
      const [card, checklists, attachments] = await Promise.all([
        client.cards.getCard({ id: cardId }),
        client.cards.getCardChecklists({ id: cardId }),
        client.cards.getCardAttachments({ id: cardId }),
      ]);
      const trelloCard = toTrelloCard(card);
      trelloCard.checklists = (checklists as any[]).map((cl: any) => ({
        id: cl.id,
        name: cl.name,
        idCard: cl.idCard,
        pos: cl.pos,
        checkItems: ((cl.checkItems || []) as any[]).map((ci: any) => ({
          id: ci.id,
          name: ci.name,
          state: ci.state,
          pos: ci.pos,
          idChecklist: ci.idChecklist,
        })),
      }));
      trelloCard.attachments = (attachments as any[]).map((att: any) => ({
        id: att.id,
        name: att.name,
        url: att.url,
        date: att.date,
        mimeType: att.mimeType || "",
        bytes: att.bytes ?? null,
        isUpload: att.isUpload || false,
        fileName: att.fileName || null,
      }));
      dispatch({ type: "UPDATE_CARD", card: trelloCard });
    },
    [client]
  );

  const loadCardDetails = useCallback(
    async (cardId: string) => {
      await refetchCardDetails(cardId);
    },
    [refetchCardDetails]
  );

  const createChecklist = useCallback(
    async (cardId: string, name: string) => {
      await client.cards.createCardChecklist({ id: cardId, name } as any);
      await refetchCardDetails(cardId);
    },
    [client, refetchCardDetails]
  );

  const deleteChecklist = useCallback(
    async (cardId: string, checklistId: string) => {
      await client.cards.deleteCardChecklist({ id: cardId, idChecklist: checklistId });
      await refetchCardDetails(cardId);
    },
    [client, refetchCardDetails]
  );

  const createCheckItem = useCallback(
    async (checklistId: string, name: string, cardId: string) => {
      await (client.checklists as any).createChecklistCheckItems({ id: checklistId, name });
      await refetchCardDetails(cardId);
    },
    [client, refetchCardDetails]
  );

  const deleteCheckItem = useCallback(
    async (cardId: string, checkItemId: string) => {
      await client.cards.deleteCardChecklistItem({ id: cardId, idCheckItem: checkItemId });
      await refetchCardDetails(cardId);
    },
    [client, refetchCardDetails]
  );

  const toggleCheckItem = useCallback(
    async (cardId: string, checkItemId: string, currentState: "complete" | "incomplete") => {
      const newState = currentState === "complete" ? "incomplete" : "complete";
      await client.cards.updateCardCheckItem({
        id: cardId,
        idCheckItem: checkItemId,
        state: newState,
      } as any);
      await refetchCardDetails(cardId);
    },
    [client, refetchCardDetails]
  );

  const addAttachment = useCallback(
    async (cardId: string, url: string, name?: string) => {
      await client.cards.createCardAttachment({ id: cardId, url, name } as any);
      await refetchCardDetails(cardId);
    },
    [client, refetchCardDetails]
  );

  const deleteAttachment = useCallback(
    async (cardId: string, attachmentId: string) => {
      await client.cards.deleteCardAttachment({ id: cardId, idAttachment: attachmentId });
      await refetchCardDetails(cardId);
    },
    [client, refetchCardDetails]
  );

  const syncCache = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      await cache.bootstrap();
      await cache.sync();
      dispatch({ type: "SET_SYNCED" });
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", error: e.message || "Sync failed" });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, [cache]);

  const loadAssignedCards = useCallback(async () => {
    const cards = await client.members.getMemberCards({ id: "me" });
    return (cards as any[]).map(toTrelloCard);
  }, [client]);

  const value: TrelloContextType = {
    state,
    dispatch,
    client,
    cache,
    loadBoards,
    loadBoard,
    createCard,
    createList,
    moveCard,
    archiveCard,
    deleteCard,
    updateCard,
    addLabelToCard,
    removeLabelFromCard,
    addMemberToCard,
    removeMemberFromCard,
    loadCardDetails,
    createChecklist,
    deleteChecklist,
    createCheckItem,
    deleteCheckItem,
    toggleCheckItem,
    addAttachment,
    deleteAttachment,
    syncCache,
    loadAssignedCards,
  };

  return (
    <TrelloContext.Provider value={value}>{children}</TrelloContext.Provider>
  );
}

export function useTrello(): TrelloContextType {
  const ctx = useContext(TrelloContext);
  if (!ctx) {
    throw new Error("useTrello must be used within TrelloProvider");
  }
  return ctx;
}
