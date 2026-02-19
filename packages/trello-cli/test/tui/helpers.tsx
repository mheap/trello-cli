import React from "react";
import {
  TuiConfig,
  DEFAULT_TUI_CONFIG,
  View,
  InputMode,
  TrelloBoard,
  TrelloList,
  TrelloCard,
  TrelloLabel,
  TrelloMember,
} from "../../src/tui/types";

// Re-export for convenience
export { DEFAULT_TUI_CONFIG };

// ---------- Mock NavigationContext ----------

export interface MockNavState {
  view?: View;
  previousView?: View | null;
  modeOriginView?: View | null;
  selectedListIndex?: number;
  selectedCardIndex?: number;
  listScrollOffset?: number;
  mode?: InputMode;
  searchQuery?: string;
  statusMessage?: string | null;
  confirmAction?: { message: string; onConfirm: () => void } | null;
}

export function createMockNavState(overrides: MockNavState = {}) {
  return {
    view: "home" as View,
    previousView: null as View | null,
    modeOriginView: null as View | null,
    selectedListIndex: 0,
    selectedCardIndex: 0,
    listScrollOffset: 0,
    mode: "normal" as InputMode,
    searchQuery: "",
    statusMessage: null as string | null,
    confirmAction: null as { message: string; onConfirm: () => void } | null,
    ...overrides,
  };
}

export function createMockNavContext(
  stateOverrides: MockNavState = {},
  config?: TuiConfig
) {
  return {
    state: createMockNavState(stateOverrides),
    dispatch: jest.fn(),
    config: config || DEFAULT_TUI_CONFIG,
  };
}

// ---------- Mock TrelloContext ----------

export interface MockTrelloState {
  boards?: TrelloBoard[];
  currentBoard?: TrelloBoard | null;
  lists?: TrelloList[];
  cardsByList?: Record<string, TrelloCard[]>;
  boardLabels?: TrelloLabel[];
  members?: TrelloMember[];
  loading?: boolean;
  error?: string | null;
  lastSynced?: Date | null;
}

export function createMockTrelloState(overrides: MockTrelloState = {}) {
  return {
    boards: [],
    currentBoard: null,
    lists: [],
    cardsByList: {},
    boardLabels: [],
    members: [],
    loading: false,
    error: null,
    lastSynced: null,
    ...overrides,
  };
}

export function createMockTrelloContext(stateOverrides: MockTrelloState = {}) {
  return {
    state: createMockTrelloState(stateOverrides),
    dispatch: jest.fn(),
    client: {} as any,
    cache: {} as any,
    loadBoards: jest.fn(),
    loadBoard: jest.fn(),
    createCard: jest.fn(),
    createList: jest.fn(),
    moveCard: jest.fn(),
    archiveCard: jest.fn(),
    deleteCard: jest.fn(),
    updateCard: jest.fn(),
    addLabelToCard: jest.fn(),
    removeLabelFromCard: jest.fn(),
    addMemberToCard: jest.fn(),
    removeMemberFromCard: jest.fn(),
    loadCardDetails: jest.fn(),
    createChecklist: jest.fn(),
    deleteChecklist: jest.fn(),
    createCheckItem: jest.fn(),
    deleteCheckItem: jest.fn(),
    toggleCheckItem: jest.fn(),
    addAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
    syncCache: jest.fn(),
    loadAssignedCards: jest.fn(),
  };
}

// ---------- Test data factories ----------

export function makeBoard(overrides: Partial<TrelloBoard> = {}): TrelloBoard {
  return {
    id: "board-1",
    name: "Test Board",
    desc: "A test board",
    url: "https://trello.com/b/abc123/test-board",
    shortLink: "abc123",
    closed: false,
    ...overrides,
  };
}

export function makeList(overrides: Partial<TrelloList> = {}): TrelloList {
  return {
    id: "list-1",
    name: "To Do",
    closed: false,
    idBoard: "board-1",
    ...overrides,
  };
}

export function makeCard(overrides: Partial<TrelloCard> = {}): TrelloCard {
  return {
    id: "card-1",
    name: "Test Card",
    desc: "",
    due: null,
    closed: false,
    url: "https://trello.com/c/xyz789",
    shortLink: "xyz789",
    idList: "list-1",
    idBoard: "board-1",
    idMembers: [],
    labels: [],
    ...overrides,
  };
}

export function makeLabel(overrides: Partial<TrelloLabel> = {}): TrelloLabel {
  return {
    id: "label-1",
    name: "Bug",
    color: "red",
    idBoard: "board-1",
    ...overrides,
  };
}

export function makeMember(
  overrides: Partial<TrelloMember> = {}
): TrelloMember {
  return {
    id: "member-1",
    username: "johndoe",
    fullName: "John Doe",
    initials: "JD",
    ...overrides,
  };
}
