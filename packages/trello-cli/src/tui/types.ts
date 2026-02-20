export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  url: string;
  shortLink: string;
  closed: boolean;
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  idBoard: string;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  closed: boolean;
  url: string;
  shortLink: string;
  idList: string;
  idBoard: string;
  idMembers: string[];
  labels: TrelloLabel[];
  checklists?: TrelloChecklist[];
  attachments?: TrelloAttachment[];
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
  idBoard: string;
}

export interface TrelloChecklist {
  id: string;
  name: string;
  idCard: string;
  pos: number;
  checkItems: TrelloCheckItem[];
}

export interface TrelloCheckItem {
  id: string;
  name: string;
  state: "complete" | "incomplete";
  pos: number;
  idChecklist: string;
}

export interface TrelloAttachment {
  id: string;
  name: string;
  url: string;
  date: string;
  mimeType: string;
  bytes: number | null;
  isUpload: boolean;
  fileName: string | null;
}

export interface TrelloMember {
  id: string;
  username: string;
  fullName: string;
  initials: string;
}

export type View = "home" | "board" | "card-detail" | "my-cards";

export type InputMode = "normal" | "create-card" | "create-list" | "move-card" | "search" | "edit-card" | "edit-desc" | "set-due" | "toggle-label" | "toggle-member" | "toggle-checklist" | "add-checklist" | "add-checkitem" | "add-attachment" | "view-attachments";

export interface TuiConfig {
  mouse: boolean;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    warning: string;
    error: string;
    muted: string;
  };
  syncIntervalMs: number;
  defaultView: View;
}

export const DEFAULT_TUI_CONFIG: TuiConfig = {
  mouse: true,
  theme: {
    primary: "cyan",
    secondary: "blue",
    accent: "green",
    warning: "yellow",
    error: "red",
    muted: "gray",
  },
  syncIntervalMs: 300000, // 5 minutes
  defaultView: "home",
};
