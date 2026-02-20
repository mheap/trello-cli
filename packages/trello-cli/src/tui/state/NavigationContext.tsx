import React, { createContext, useContext, useReducer, useCallback } from "react";
import { View, InputMode, TuiConfig, DEFAULT_TUI_CONFIG } from "../types";

interface NavigationState {
  view: View;
  previousView: View | null;
  modeOriginView: View | null;
  selectedListIndex: number;
  selectedCardIndex: number;
  listScrollOffset: number;
  mode: InputMode;
  searchQuery: string;
  statusMessage: string | null;
  confirmAction: { message: string; onConfirm: () => void } | null;
}

type NavigationAction =
  | { type: "SET_VIEW"; view: View; preserveSelection?: boolean }
  | { type: "GO_BACK" }
  | { type: "SELECT_LIST"; index: number }
  | { type: "SELECT_CARD"; index: number }
  | { type: "SET_LIST_SCROLL"; offset: number }
  | { type: "SET_MODE"; mode: InputMode; originView?: View }
  | { type: "SET_SEARCH"; query: string }
  | { type: "SET_STATUS"; message: string | null }
  | { type: "SET_CONFIRM"; action: { message: string; onConfirm: () => void } | null }
  | { type: "RESET_SELECTION" };

function navigationReducer(
  state: NavigationState,
  action: NavigationAction
): NavigationState {
  switch (action.type) {
    case "SET_VIEW":
      return {
        ...state,
        previousView: state.view,
        view: action.view,
        mode: "normal",
        modeOriginView: null,
        ...(action.preserveSelection
          ? {}
          : {
              selectedListIndex: 0,
              selectedCardIndex: 0,
              listScrollOffset: 0,
            }),
      };
    case "GO_BACK":
      return {
        ...state,
        view: state.previousView || "home",
        previousView: null,
        mode: "normal",
        selectedListIndex: 0,
        selectedCardIndex: 0,
        listScrollOffset: 0,
      };
    case "SELECT_LIST":
      return { ...state, selectedListIndex: action.index, selectedCardIndex: 0 };
    case "SELECT_CARD":
      return { ...state, selectedCardIndex: action.index };
    case "SET_LIST_SCROLL":
      return { ...state, listScrollOffset: action.offset };
    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
        // When entering an editing mode, snapshot the origin view.
        // If originView is explicitly provided (from CardDetailView), use that.
        // When transitioning between modes (e.g. toggle-checklist → add-checkitem),
        // preserve the existing modeOriginView.
        // When returning to normal, clear it.
        ...(action.mode !== "normal"
          ? {
              modeOriginView:
                action.originView || state.modeOriginView || state.view,
            }
          : { modeOriginView: null }),
      };
    case "SET_SEARCH":
      return { ...state, searchQuery: action.query };
    case "SET_STATUS":
      return { ...state, statusMessage: action.message };
    case "SET_CONFIRM":
      return { ...state, confirmAction: action.action };
    case "RESET_SELECTION":
      return { ...state, selectedListIndex: 0, selectedCardIndex: 0, listScrollOffset: 0 };
    default:
      return state;
  }
}

const initialState: NavigationState = {
  view: "home",
  previousView: null,
  modeOriginView: null,
  selectedListIndex: 0,
  selectedCardIndex: 0,
  listScrollOffset: 0,
  mode: "normal",
  searchQuery: "",
  statusMessage: null,
  confirmAction: null,
};

interface NavigationContextType {
  state: NavigationState;
  dispatch: React.Dispatch<NavigationAction>;
  config: TuiConfig;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({
  children,
  config,
}: {
  children: React.ReactNode;
  config?: TuiConfig;
}) {
  const [state, dispatch] = useReducer(navigationReducer, initialState);

  return (
    <NavigationContext.Provider
      value={{ state, dispatch, config: config || DEFAULT_TUI_CONFIG }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return ctx;
}
