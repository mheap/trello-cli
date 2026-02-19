import React, { useState, useCallback, useEffect, useRef } from "react";
import { exec } from "child_process";
import { Box, Text, useInput, useApp, Key } from "ink";
import TextInput from "ink-text-input";
import { useTrello } from "../state/TrelloContext";
import { useNavigation } from "../state/NavigationContext";
import { ListColumn } from "../components/ListColumn";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { HelpScreen } from "../components/HelpScreen";
import { MultiLineInput } from "../components/MultiLineInput";
import { useTerminalSize, getListColumns, getListWidth } from "../hooks/useTerminalSize";
import Spinner from "ink-spinner";

// Key sequence for checklist items: 1-9, then a-h (skip i), j-z
const CHECKITEM_KEYS = [
  "1","2","3","4","5","6","7","8","9",
  "a","b","c","d","e","f","g","h", // skip "i" — reserved for add item
  "j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
];

function getCheckItemIndex(input: string): number {
  const idx = CHECKITEM_KEYS.indexOf(input.toLowerCase());
  return idx;
}

export function BoardView() {
  const {
    state: trelloState,
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
    toggleCheckItem,
    createChecklist,
    createCheckItem,
    addAttachment,
  } = useTrello();
  const { state: navState, dispatch, config } = useNavigation();
  const { exit } = useApp();
  const { columns: termWidth, rows: termHeight } = useTerminalSize();

  // Local state for input modes
  const [inputValue, setInputValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
  const [checklistPage, setChecklistPage] = useState(0);
  const prevModeRef = useRef(navState.mode);
  const [confirmAction, setConfirmAction] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const lists = trelloState.lists;
  const numColumns = getListColumns(termWidth);
  const listWidth = getListWidth(termWidth, numColumns);
  // List height: terminal height minus header(3), footer(2), content paddingY(2), list row paddingX wrapper(0)
  const listHeight = Math.max(8, termHeight - 7);
  // Max card rows: list height minus border(2), header(1), hint(1) = 4 lines of chrome
  const maxCardRows = Math.max(3, listHeight - 4);

  // Calculate visible lists based on scroll
  const visibleStart = navState.listScrollOffset;
  const visibleEnd = Math.min(lists.length, visibleStart + numColumns);
  const visibleLists = lists.slice(visibleStart, visibleEnd);

  const currentList = lists[navState.selectedListIndex];
  const currentCards = currentList
    ? trelloState.cardsByList[currentList.id] || []
    : [];
  const selectedCard =
    currentCards.length > 0
      ? currentCards[navState.selectedCardIndex]
      : null;

  // When entering edit-card, set-due, edit-desc, or checklist/attachment modes
  // from CardDetailView, initialize the input value appropriately
  useEffect(() => {
    if (navState.mode === "edit-card" && selectedCard) {
      setInputValue(selectedCard.name);
    } else if (navState.mode === "set-due") {
      setInputValue("");
    } else if (navState.mode === "edit-desc" && selectedCard) {
      setDescValue(selectedCard.desc || "");
    } else if (navState.mode === "toggle-checklist" && selectedCard) {
      // Only reset checklist selection when entering fresh (not returning from add-checkitem)
      if (prevModeRef.current !== "add-checkitem") {
        setActiveChecklistId(null);
        setChecklistPage(0);
      }
      loadCardDetails(selectedCard.id);
    } else if (navState.mode === "add-checklist") {
      setInputValue("");
    } else if (navState.mode === "add-checkitem") {
      setInputValue("");
    } else if (navState.mode === "add-attachment") {
      setInputValue("");
    } else if (navState.mode === "view-attachments" && selectedCard) {
      loadCardDetails(selectedCard.id);
    }
    prevModeRef.current = navState.mode;
  }, [navState.mode]);

  // Return to the originating view after completing an editing mode.
  // If we came from card-detail, go back there; otherwise just reset to normal mode.
  const exitEditMode = useCallback(() => {
    if (navState.modeOriginView === "card-detail") {
      dispatch({ type: "SET_VIEW", view: "card-detail", preserveSelection: true });
    } else {
      dispatch({ type: "SET_MODE", mode: "normal" });
    }
  }, [navState.modeOriginView, dispatch]);

  // Ensure selected list is visible
  const ensureListVisible = useCallback(
    (listIndex: number) => {
      if (listIndex < navState.listScrollOffset) {
        dispatch({ type: "SET_LIST_SCROLL", offset: listIndex });
      } else if (listIndex >= navState.listScrollOffset + numColumns) {
        dispatch({
          type: "SET_LIST_SCROLL",
          offset: listIndex - numColumns + 1,
        });
      }
    },
    [navState.listScrollOffset, numColumns, dispatch]
  );

  // Handle normal mode keyboard input
  useInput(
    (input: string, key: Key) => {
      if (confirmAction) return;
      if (showHelp) {
        if (key.escape || input === "?" || input === "q") {
          setShowHelp(false);
        }
        return;
      }

      // Handle card detail view
      if (navState.view === "card-detail") return;

      // Input modes
      if (navState.mode === "create-card") {
        if (key.escape) {
          dispatch({ type: "SET_MODE", mode: "normal" });
          setInputValue("");
          return;
        }
        // TextInput handles the rest
        return;
      }

      if (navState.mode === "create-list") {
        if (key.escape) {
          dispatch({ type: "SET_MODE", mode: "normal" });
          setInputValue("");
          return;
        }
        // TextInput handles the rest
        return;
      }

      if (navState.mode === "move-card") {
        // Handle list number selection for move
        const num = parseInt(input);
        if (num >= 1 && num <= lists.length && selectedCard) {
          const targetList = lists[num - 1];
          if (targetList && targetList.id !== currentList?.id) {
            moveCard(selectedCard.id, currentList!.id, targetList.id);
            dispatch({
              type: "SET_STATUS",
              message: `Moved "${selectedCard.name}" to ${targetList.name}`,
            });
            setTimeout(
              () => dispatch({ type: "SET_STATUS", message: null }),
              3000
            );
          }
          exitEditMode();
          return;
        }
        if (key.escape) {
          exitEditMode();
          return;
        }
        return;
      }

      if (navState.mode === "toggle-label") {
        if (key.escape) {
          exitEditMode();
          return;
        }
        const num = parseInt(input);
        const boardLabels = trelloState.boardLabels;
        if (num >= 1 && num <= Math.min(9, boardLabels.length) && selectedCard) {
          const label = boardLabels[num - 1];
          const hasLabel = selectedCard.labels.some((l) => l.id === label.id);
          if (hasLabel) {
            removeLabelFromCard(selectedCard.id, label.id);
            dispatch({
              type: "SET_STATUS",
              message: `Removed label "${label.name || label.color}"`,
            });
          } else {
            addLabelToCard(selectedCard.id, label.id);
            dispatch({
              type: "SET_STATUS",
              message: `Added label "${label.name || label.color}"`,
            });
          }
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            3000
          );
        }
        return;
      }

      if (navState.mode === "toggle-member") {
        if (key.escape) {
          exitEditMode();
          return;
        }
        const num = parseInt(input);
        const members = trelloState.members;
        if (num >= 1 && num <= Math.min(9, members.length) && selectedCard) {
          const member = members[num - 1];
          const hasMember = selectedCard.idMembers.includes(member.id);
          if (hasMember) {
            removeMemberFromCard(selectedCard.id, member.id);
            dispatch({
              type: "SET_STATUS",
              message: `Removed ${member.fullName}`,
            });
          } else {
            addMemberToCard(selectedCard.id, member.id);
            dispatch({
              type: "SET_STATUS",
              message: `Added ${member.fullName}`,
            });
          }
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            3000
          );
        }
        return;
      }

      if (navState.mode === "toggle-checklist") {
        const checklists = (selectedCard?.checklists || []).sort((a, b) => a.pos - b.pos);

        if (!activeChecklistId) {
          // Checklist selection level
          if (key.escape) {
            exitEditMode();
            return;
          }
          const num = parseInt(input);
          if (num >= 1 && num <= Math.min(9, checklists.length)) {
            setActiveChecklistId(checklists[num - 1].id);
            setChecklistPage(0);
          }
          return;
        }

        // Item level — a checklist is selected
        const activeChecklist = checklists.find((cl) => cl.id === activeChecklistId);
        if (!activeChecklist) {
          setActiveChecklistId(null);
          return;
        }

        if (key.escape) {
          setActiveChecklistId(null);
          setChecklistPage(0);
          return;
        }

        // Press 'i' to add new item to this checklist
        if (input === "i" && selectedCard) {
          setInputValue("");
          dispatch({ type: "SET_MODE", mode: "add-checkitem" });
          return;
        }

        const items = activeChecklist.checkItems.sort((a, b) => a.pos - b.pos);
        const itemsPerPage = CHECKITEM_KEYS.length; // 35
        const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

        // Left/right arrows to navigate pages
        if (key.leftArrow || key.rightArrow) {
          if (totalPages > 1) {
            if (key.leftArrow && checklistPage > 0) {
              setChecklistPage(checklistPage - 1);
            } else if (key.rightArrow && checklistPage < totalPages - 1) {
              setChecklistPage(checklistPage + 1);
            }
          }
          return;
        }

        // Map input key to page-relative item index
        const keyIndex = getCheckItemIndex(input);
        const globalIndex = checklistPage * itemsPerPage + keyIndex;
        if (keyIndex >= 0 && globalIndex < items.length && selectedCard) {
          const item = items[globalIndex];
          toggleCheckItem(selectedCard.id, item.id, item.state);
          dispatch({
            type: "SET_STATUS",
            message: `${item.state === "complete" ? "Unchecked" : "Checked"} "${item.name}"`,
          });
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            3000
          );
        }
        return;
      }

      if (navState.mode === "add-checklist") {
        if (key.escape) {
          exitEditMode();
          setInputValue("");
          return;
        }
        // TextInput handles the rest
        return;
      }

      if (navState.mode === "add-checkitem") {
        // Esc returns to toggle-checklist with checklist still selected
        if (key.escape) {
          dispatch({ type: "SET_MODE", mode: "toggle-checklist" });
          setInputValue("");
          return;
        }
        // TextInput handles the rest
        return;
      }

      if (navState.mode === "add-attachment") {
        if (key.escape) {
          exitEditMode();
          setInputValue("");
          return;
        }
        // TextInput handles the rest
        return;
      }

      if (navState.mode === "view-attachments") {
        if (key.escape) {
          exitEditMode();
          return;
        }
        return;
      }

      if (navState.mode === "edit-card") {
        if (key.escape) {
          exitEditMode();
          setInputValue("");
          return;
        }
        // TextInput handles the rest
        return;
      }

      if (navState.mode === "edit-desc") {
        // MultiLineInput handles this
        return;
      }

      if (navState.mode === "set-due") {
        if (key.escape) {
          exitEditMode();
          setInputValue("");
          return;
        }
        // TextInput handles the rest
        return;
      }

      if (navState.mode === "search") {
        // TextInput handles this
        return;
      }

      // Normal mode
      if (input === "q") {
        exit();
        return;
      }

      if (input === "?") {
        setShowHelp(true);
        return;
      }

      if (key.escape) {
        dispatch({ type: "SET_VIEW", view: "home" });
        return;
      }

      if (input === "b") {
        dispatch({ type: "SET_VIEW", view: "home" });
        return;
      }

      // List navigation
      if (key.leftArrow || (key.shift && key.tab)) {
        const newIndex = Math.max(0, navState.selectedListIndex - 1);
        dispatch({ type: "SELECT_LIST", index: newIndex });
        ensureListVisible(newIndex);
        return;
      }

      if (key.rightArrow || key.tab) {
        const newIndex = Math.min(
          lists.length - 1,
          navState.selectedListIndex + 1
        );
        dispatch({ type: "SELECT_LIST", index: newIndex });
        ensureListVisible(newIndex);
        return;
      }

      // Jump to list by number
      const num = parseInt(input);
      if (num >= 1 && num <= Math.min(9, lists.length)) {
        dispatch({ type: "SELECT_LIST", index: num - 1 });
        ensureListVisible(num - 1);
        return;
      }

      // Card navigation
      if (key.upArrow) {
        dispatch({
          type: "SELECT_CARD",
          index: Math.max(0, navState.selectedCardIndex - 1),
        });
        return;
      }

      if (key.downArrow) {
        dispatch({
          type: "SELECT_CARD",
          index: Math.min(
            currentCards.length - 1,
            navState.selectedCardIndex + 1
          ),
        });
        return;
      }

      // Jump to first/last card
      if (input === "g") {
        dispatch({ type: "SELECT_CARD", index: 0 });
        return;
      }

      if (input === "G") {
        dispatch({
          type: "SELECT_CARD",
          index: Math.max(0, currentCards.length - 1),
        });
        return;
      }

      // Card detail
      if (key.return && selectedCard) {
        dispatch({ type: "SET_VIEW", view: "card-detail", preserveSelection: true });
        return;
      }

      // Create card
      if (input === "n" && currentList) {
        setInputValue("");
        dispatch({ type: "SET_MODE", mode: "create-card" });
        return;
      }

      // Edit card
      if (input === "e" && selectedCard) {
        setInputValue(selectedCard.name);
        dispatch({ type: "SET_MODE", mode: "edit-card" });
        return;
      }

      // Move card
      if (input === "m" && selectedCard && lists.length > 1) {
        dispatch({ type: "SET_MODE", mode: "move-card" });
        return;
      }

      // Due date
      if (input === "d" && selectedCard) {
        setInputValue("");
        dispatch({ type: "SET_MODE", mode: "set-due" });
        return;
      }

      // Edit description
      if (input === "D" && selectedCard) {
        setDescValue(selectedCard.desc || "");
        dispatch({ type: "SET_MODE", mode: "edit-desc" });
        return;
      }

      // Toggle labels
      if (input === "l" && selectedCard) {
        dispatch({ type: "SET_MODE", mode: "toggle-label" });
        return;
      }

      // Toggle members (assign)
      if (input === "M" && selectedCard) {
        dispatch({ type: "SET_MODE", mode: "toggle-member" });
        return;
      }

      // Toggle checklist items
      if (input === "c" && selectedCard) {
        loadCardDetails(selectedCard.id);
        setActiveChecklistId(null);
        setChecklistPage(0);
        dispatch({ type: "SET_MODE", mode: "toggle-checklist" });
        return;
      }

      // Add new checklist
      if (input === "C" && selectedCard) {
        setInputValue("");
        dispatch({ type: "SET_MODE", mode: "add-checklist" });
        return;
      }

      // Add attachment
      if (input === "A" && selectedCard) {
        setInputValue("");
        dispatch({ type: "SET_MODE", mode: "add-attachment" });
        return;
      }

      // View all attachments
      if (input === "a" && selectedCard) {
        loadCardDetails(selectedCard.id);
        dispatch({ type: "SET_MODE", mode: "view-attachments" });
        return;
      }

      // Create list
      if (input === "L") {
        setInputValue("");
        dispatch({ type: "SET_MODE", mode: "create-list" });
        return;
      }

      // Open card in browser
      if (input === "o" && selectedCard) {
        openUrl(selectedCard.url);
        dispatch({ type: "SET_STATUS", message: `Opening in browser...` });
        setTimeout(() => dispatch({ type: "SET_STATUS", message: null }), 3000);
        return;
      }

      // Archive card
      if (input === "x" && selectedCard) {
        const card = selectedCard;
        const list = currentList;
        setConfirmAction({
          message: `Archive "${card.name}"?`,
          onConfirm: () => {
            archiveCard(card.id, list!.id);
            dispatch({
              type: "SET_STATUS",
              message: `Archived "${card.name}"`,
            });
            setTimeout(
              () => dispatch({ type: "SET_STATUS", message: null }),
              3000
            );
            setConfirmAction(null);
            // Adjust selection if needed
            if (
              navState.selectedCardIndex >= currentCards.length - 1 &&
              navState.selectedCardIndex > 0
            ) {
              dispatch({
                type: "SELECT_CARD",
                index: navState.selectedCardIndex - 1,
              });
            }
          },
        });
        return;
      }

      // Delete card
      if (key.delete && selectedCard) {
        const card = selectedCard;
        const list = currentList;
        setConfirmAction({
          message: `Permanently delete "${card.name}"? This cannot be undone.`,
          onConfirm: () => {
            deleteCard(card.id, list!.id);
            dispatch({
              type: "SET_STATUS",
              message: `Deleted "${card.name}"`,
            });
            setTimeout(
              () => dispatch({ type: "SET_STATUS", message: null }),
              3000
            );
            setConfirmAction(null);
            if (
              navState.selectedCardIndex >= currentCards.length - 1 &&
              navState.selectedCardIndex > 0
            ) {
              dispatch({
                type: "SELECT_CARD",
                index: navState.selectedCardIndex - 1,
              });
            }
          },
        });
        return;
      }

      // Sync
      if (input === "s") {
        if (trelloState.currentBoard) {
          loadBoard(trelloState.currentBoard);
        }
        return;
      }

      // Ctrl+R refresh
      if (key.ctrl && input === "r") {
        if (trelloState.currentBoard) {
          loadBoard(trelloState.currentBoard);
        }
        return;
      }
    },
    { isActive: navState.view === "board" }
  );

  // Handle create card submission
  const handleCreateCard = useCallback(
    async (name: string) => {
      if (name.trim() && currentList) {
        try {
          await createCard(currentList.id, name.trim());
          dispatch({
            type: "SET_STATUS",
            message: `Created "${name.trim()}"`,
          });
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            3000
          );
        } catch (e: any) {
          dispatch({
            type: "SET_STATUS",
            message: `Error: ${e.message}`,
          });
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            5000
          );
        }
      }
      dispatch({ type: "SET_MODE", mode: "normal" });
      setInputValue("");
    },
    [currentList, createCard, dispatch]
  );

  // Handle create list submission
  const handleCreateList = useCallback(
    async (name: string) => {
      if (name.trim()) {
        try {
          const list = await createList(name.trim());
          dispatch({
            type: "SET_STATUS",
            message: `Created list "${list.name}"`,
          });
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            3000
          );
          // Select the newly created list
          const newIndex = trelloState.lists.length; // will be at the end after ADD_LIST
          dispatch({ type: "SELECT_LIST", index: newIndex });
          ensureListVisible(newIndex);
        } catch (e: any) {
          dispatch({
            type: "SET_STATUS",
            message: `Error: ${e.message}`,
          });
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            5000
          );
        }
      }
      dispatch({ type: "SET_MODE", mode: "normal" });
      setInputValue("");
    },
    [createList, dispatch, trelloState.lists.length, ensureListVisible]
  );

  // Handle edit card submission
  const handleEditCard = useCallback(
    async (name: string) => {
      if (name.trim() && selectedCard) {
        try {
          await updateCard(selectedCard.id, { name: name.trim() });
          dispatch({
            type: "SET_STATUS",
            message: `Updated card name`,
          });
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            3000
          );
        } catch (e: any) {
          dispatch({
            type: "SET_STATUS",
            message: `Error: ${e.message}`,
          });
        }
      }
      exitEditMode();
      setInputValue("");
    },
    [selectedCard, updateCard, dispatch, exitEditMode]
  );

  // Handle set due date
  const handleSetDue = useCallback(
    async (dueStr: string) => {
      if (selectedCard) {
        try {
          const chrono = require("chrono-node");
          let due: string | null = null;
          if (dueStr.trim().toLowerCase() === "none" || dueStr.trim() === "") {
            due = "";
          } else {
            const parsed = chrono.parseDate(dueStr);
            if (parsed) {
              due = parsed.toISOString();
            } else {
              dispatch({
                type: "SET_STATUS",
                message: `Could not parse date: "${dueStr}"`,
              });
              setTimeout(
                () => dispatch({ type: "SET_STATUS", message: null }),
                3000
              );
              exitEditMode();
              setInputValue("");
              return;
            }
          }
          await updateCard(selectedCard.id, { due });
          dispatch({
            type: "SET_STATUS",
            message: due ? `Due date set` : `Due date cleared`,
          });
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            3000
          );
        } catch (e: any) {
          dispatch({
            type: "SET_STATUS",
            message: `Error: ${e.message}`,
          });
        }
      }
      exitEditMode();
      setInputValue("");
    },
    [selectedCard, updateCard, dispatch, exitEditMode]
  );

  // Handle edit description submission
  const handleEditDesc = useCallback(
    async (desc: string) => {
      if (selectedCard) {
        try {
          await updateCard(selectedCard.id, { desc });
          dispatch({
            type: "SET_STATUS",
            message: `Updated description`,
          });
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            3000
          );
        } catch (e: any) {
          dispatch({
            type: "SET_STATUS",
            message: `Error: ${e.message}`,
          });
        }
      }
      exitEditMode();
      setDescValue("");
    },
    [selectedCard, updateCard, dispatch, exitEditMode]
  );

  // Handle add checklist submission
  const handleAddChecklist = useCallback(
    async (name: string) => {
      if (name.trim() && selectedCard) {
        try {
          await createChecklist(selectedCard.id, name.trim());
          dispatch({
            type: "SET_STATUS",
            message: `Created checklist "${name.trim()}"`,
          });
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            3000
          );
        } catch (e: any) {
          dispatch({
            type: "SET_STATUS",
            message: `Error: ${e.message}`,
          });
        }
      }
      exitEditMode();
      setInputValue("");
    },
    [selectedCard, createChecklist, dispatch, exitEditMode]
  );

  // Handle add check item submission
  const handleAddCheckItem = useCallback(
    async (name: string) => {
      if (name.trim() && activeChecklistId && selectedCard) {
        try {
          await createCheckItem(activeChecklistId, name.trim(), selectedCard.id);
          dispatch({
            type: "SET_STATUS",
            message: `Added item "${name.trim()}"`,
          });
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            3000
          );
        } catch (e: any) {
          dispatch({
            type: "SET_STATUS",
            message: `Error: ${e.message}`,
          });
        }
      }
      // Return to toggle-checklist mode with the same checklist selected
      dispatch({ type: "SET_MODE", mode: "toggle-checklist" });
      setInputValue("");
    },
    [selectedCard, activeChecklistId, createCheckItem, dispatch]
  );

  // Handle add attachment submission
  const handleAddAttachment = useCallback(
    async (value: string) => {
      if (value.trim() && selectedCard) {
        try {
          let url: string;
          let name: string | undefined;
          if (value.includes("|")) {
            const parts = value.split("|");
            url = parts[0].trim();
            name = parts.slice(1).join("|").trim() || undefined;
          } else {
            url = value.trim();
          }
          await addAttachment(selectedCard.id, url, name);
          dispatch({
            type: "SET_STATUS",
            message: `Added attachment${name ? ` "${name}"` : ""}`,
          });
          setTimeout(
            () => dispatch({ type: "SET_STATUS", message: null }),
            3000
          );
        } catch (e: any) {
          dispatch({
            type: "SET_STATUS",
            message: `Error: ${e.message}`,
          });
        }
      }
      exitEditMode();
      setInputValue("");
    },
    [selectedCard, addAttachment, dispatch, exitEditMode]
  );

  // Handle confirm dialog
  if (confirmAction) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <ConfirmDialog
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      </Box>
    );
  }

  // Help screen
  if (showHelp) {
    return <HelpScreen onClose={() => setShowHelp(false)} />;
  }

  if (trelloState.loading && lists.length === 0) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text>
          <Text color={config.theme.primary}>
            <Spinner type="dots" />
          </Text>
          {" "}Loading board...
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Move mode indicator */}
      {navState.mode === "move-card" && (
        <Box flexDirection="column" paddingX={2} marginBottom={1}>
          <Text color={config.theme.warning} bold>
            Move "{selectedCard?.name}" to which list? [Esc] to cancel
          </Text>
          {lists.slice(0, 9).map((list, i) => {
            const isCurrent = list.id === currentList?.id;
            return (
              <Box key={list.id}>
                <Text color={config.theme.primary} bold>{i + 1}. </Text>
                <Text bold={isCurrent} color={isCurrent ? config.theme.muted : config.theme.secondary}>
                  {list.name}{isCurrent ? " (current)" : ""}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Label picker */}
      {navState.mode === "toggle-label" && (
        <Box flexDirection="column" paddingX={2} marginBottom={1}>
          <Text color={config.theme.primary} bold>
            Toggle labels for "{selectedCard?.name}" - Press number to toggle, [Esc] to close
          </Text>
          {trelloState.boardLabels.slice(0, 9).map((label, i) => {
            const hasLabel = selectedCard?.labels.some((l) => l.id === label.id) || false;
            return (
              <Box key={label.id}>
                <Text color={config.theme.primary} bold>{i + 1}. </Text>
                <Text color={hasLabel ? config.theme.accent : config.theme.muted}>
                  {hasLabel ? "[x] " : "[ ] "}
                </Text>
                <Text color={LABEL_COLORS[label.color] || config.theme.muted}>
                  {label.name || label.color || "(no color)"}
                </Text>
                {label.name && label.color ? (
                  <Text color={config.theme.muted}> ({label.color})</Text>
                ) : null}
              </Box>
            );
          })}
          {trelloState.boardLabels.length === 0 && (
            <Text color={config.theme.muted}>No labels on this board</Text>
          )}
        </Box>
      )}

      {/* Member picker */}
      {navState.mode === "toggle-member" && (
        <Box flexDirection="column" paddingX={2} marginBottom={1}>
          <Text color={config.theme.primary} bold>
            Toggle members for "{selectedCard?.name}" - Press number to toggle, [Esc] to close
          </Text>
          {trelloState.members.slice(0, 9).map((member, i) => {
            const hasMember = selectedCard?.idMembers.includes(member.id) || false;
            return (
              <Box key={member.id}>
                <Text color={config.theme.primary} bold>{i + 1}. </Text>
                <Text color={hasMember ? config.theme.accent : config.theme.muted}>
                  {hasMember ? "[x] " : "[ ] "}
                </Text>
                <Text>{member.fullName}</Text>
                <Text color={config.theme.muted}> @{member.username}</Text>
              </Box>
            );
          })}
          {trelloState.members.length === 0 && (
            <Text color={config.theme.muted}>No members on this board</Text>
          )}
        </Box>
      )}

      {/* Checklist picker / item toggle */}
      {navState.mode === "toggle-checklist" && (
        <Box flexDirection="column" paddingX={2} marginBottom={1}>
          {(() => {
            const checklists = (selectedCard?.checklists || []).sort((a, b) => a.pos - b.pos);
            if (checklists.length === 0) {
              return (
                <>
                  <Text color={config.theme.primary} bold>
                    Checklists for "{selectedCard?.name}" - [Esc] to close
                  </Text>
                  <Text color={config.theme.muted}>No checklists on this card. Press [Esc] then [C] to create one.</Text>
                </>
              );
            }

            if (!activeChecklistId) {
              // Checklist selection level
              return (
                <>
                  <Text color={config.theme.primary} bold>
                    Checklists for "{selectedCard?.name}" - Press number to select, [Esc] to close
                  </Text>
                  {checklists.slice(0, 9).map((cl, i) => {
                    const done = cl.checkItems.filter((ci) => ci.state === "complete").length;
                    const total = cl.checkItems.length;
                    return (
                      <Box key={cl.id}>
                        <Text color={config.theme.primary} bold>{i + 1}. </Text>
                        <Text bold color={config.theme.secondary}>{cl.name}</Text>
                        <Text color={config.theme.muted}> ({done}/{total})</Text>
                      </Box>
                    );
                  })}
                </>
              );
            }

            // Item level — show items of the selected checklist
            const activeChecklist = checklists.find((cl) => cl.id === activeChecklistId);
            if (!activeChecklist) return null;
            const items = activeChecklist.checkItems.sort((a, b) => a.pos - b.pos);

            // Pagination: slice items into pages of CHECKITEM_KEYS.length (35)
            const itemsPerPage = CHECKITEM_KEYS.length;
            const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
            const currentPage = Math.min(checklistPage, totalPages - 1);
            const pageItems = items.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

            // Calculate available rows and split page items into columns if needed
            // termHeight minus: header(3) + footer(2) + content paddingY(2) + title(1) + page indicator(1) + marginBottom(1) = 10
            const availableRows = Math.max(3, termHeight - 10);
            const numItemColumns = pageItems.length > 0 ? Math.ceil(pageItems.length / availableRows) : 1;
            const itemColumnWidth = numItemColumns > 1
              ? Math.floor((termWidth - 4) / numItemColumns)
              : undefined;

            // Split page items into column chunks
            const itemsPerColumn = Math.ceil(pageItems.length / numItemColumns);
            const itemColumns: typeof pageItems[] = [];
            for (let col = 0; col < numItemColumns; col++) {
              itemColumns.push(pageItems.slice(col * itemsPerColumn, (col + 1) * itemsPerColumn));
            }

            const pageLabel = totalPages > 1 ? ` (page ${currentPage + 1}/${totalPages})` : "";

            return (
              <>
                <Text color={config.theme.primary} bold>
                  {activeChecklist.name} ({items.filter((ci) => ci.state === "complete").length}/{items.length}){pageLabel} - [key] Toggle, [i] Add item, [Esc] Back
                </Text>
                {totalPages > 1 && (
                  <Text color={config.theme.muted}>
                    Use Left/Right arrows to switch pages
                  </Text>
                )}
                {items.length === 0 && (
                  <Text color={config.theme.muted}>No items. Press [i] to add one.</Text>
                )}
                {numItemColumns <= 1 ? (
                  // Single column — render flat
                  pageItems.map((item, i) => {
                    const keyLabel = CHECKITEM_KEYS[i] || "?";
                    return (
                      <Box key={item.id}>
                        <Text color={config.theme.primary} bold>{keyLabel}. </Text>
                        <Text color={item.state === "complete" ? config.theme.accent : config.theme.muted}>
                          {item.state === "complete" ? "[x] " : "[ ] "}
                        </Text>
                        <Text strikethrough={item.state === "complete"} color={item.state === "complete" ? config.theme.muted : undefined}>
                          {item.name}
                        </Text>
                      </Box>
                    );
                  })
                ) : (
                  // Multi-column layout
                  <Box flexDirection="row">
                    {itemColumns.map((colItems, colIndex) => (
                      <Box key={colIndex} flexDirection="column" width={itemColumnWidth}>
                        {colItems.map((item, i) => {
                          const pageIndex = colIndex * itemsPerColumn + i;
                          const keyLabel = CHECKITEM_KEYS[pageIndex] || "?";
                          return (
                            <Box key={item.id}>
                              <Text color={config.theme.primary} bold>{keyLabel}. </Text>
                              <Text color={item.state === "complete" ? config.theme.accent : config.theme.muted}>
                                {item.state === "complete" ? "[x] " : "[ ] "}
                              </Text>
                              <Text strikethrough={item.state === "complete"} color={item.state === "complete" ? config.theme.muted : undefined} wrap="truncate">
                                {item.name}
                              </Text>
                            </Box>
                          );
                        })}
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            );
          })()}
        </Box>
      )}

      {/* View all attachments */}
      {navState.mode === "view-attachments" && (
        <Box flexDirection="column" paddingX={2} marginBottom={1}>
          <Text color={config.theme.primary} bold>
            Attachments for "{selectedCard?.name}" - [Esc] to close
          </Text>
          {(() => {
            const attachments = selectedCard?.attachments || [];
            if (attachments.length === 0) {
              return <Text color={config.theme.muted}>No attachments on this card.</Text>;
            }
            return attachments.map((att) => (
              <Box key={att.id} paddingLeft={2}>
                <Text color={config.theme.secondary}>{att.name}</Text>
                <Text color={config.theme.muted}> - </Text>
                <Text color={config.theme.primary}>{att.url}</Text>
              </Box>
            ));
          })()}
        </Box>
      )}

      {/* Inline input for create/edit/due/checklist/attachment */}
      {(navState.mode === "create-card" ||
        navState.mode === "create-list" ||
        navState.mode === "edit-card" ||
        navState.mode === "set-due" ||
        navState.mode === "add-checklist" ||
        navState.mode === "add-checkitem" ||
        navState.mode === "add-attachment") && (
        <Box paddingX={2} marginBottom={1}>
          <Text color={config.theme.primary} bold>
            {navState.mode === "create-card"
              ? "New card: "
              : navState.mode === "create-list"
              ? "New list: "
              : navState.mode === "edit-card"
              ? "Edit name: "
              : navState.mode === "set-due"
              ? "Due date (e.g. 'tomorrow', 'next friday', 'none'): "
              : navState.mode === "add-checklist"
              ? "New checklist name: "
              : navState.mode === "add-checkitem"
              ? "New item: "
              : "Attachment (URL or URL | description): "}
          </Text>
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={(value) => {
              if (navState.mode === "create-card") handleCreateCard(value);
              else if (navState.mode === "create-list") handleCreateList(value);
              else if (navState.mode === "edit-card") handleEditCard(value);
              else if (navState.mode === "set-due") handleSetDue(value);
              else if (navState.mode === "add-checklist") handleAddChecklist(value);
              else if (navState.mode === "add-checkitem") handleAddCheckItem(value);
              else if (navState.mode === "add-attachment") handleAddAttachment(value);
            }}
          />
        </Box>
      )}

      {/* Multi-line description editor */}
      {navState.mode === "edit-desc" && (
        <Box flexDirection="column" paddingX={2} marginBottom={1}>
          <Text color={config.theme.primary} bold>
            Edit description for "{selectedCard?.name}":
          </Text>
          <Box
            borderStyle="single"
            borderColor={config.theme.primary}
            paddingX={1}
            marginTop={1}
          >
            <MultiLineInput
              value={descValue}
              onChange={setDescValue}
              onSubmit={handleEditDesc}
              onCancel={() => {
                exitEditMode();
                setDescValue("");
              }}
              cursorColor={config.theme.primary}
              hintColor={config.theme.muted}
            />
          </Box>
        </Box>
      )}

      {/* List columns - only shown in normal mode */}
      {navState.mode === "normal" && (
        <>
          <Box flexDirection="row" paddingX={1}>
            {/* Left scroll indicator */}
            {visibleStart > 0 && (
              <Box alignItems="center" marginRight={1}>
                <Text color={config.theme.muted}>{"<"}</Text>
              </Box>
            )}

            {visibleLists.map((list, i) => {
              const actualIndex = visibleStart + i;
              const cards = trelloState.cardsByList[list.id] || [];
              return (
                <ListColumn
                  key={list.id}
                  list={list}
                  cards={cards}
                  listIndex={actualIndex}
                  isSelectedList={actualIndex === navState.selectedListIndex}
                  selectedCardIndex={navState.selectedCardIndex}
                  width={listWidth}
                  height={listHeight}
                  maxCardRows={maxCardRows}
                />
              );
            })}

            {/* Right scroll indicator */}
            {visibleEnd < lists.length && (
              <Box alignItems="center" marginLeft={1}>
                <Text color={config.theme.muted}>{">"}</Text>
              </Box>
            )}
          </Box>

          {lists.length === 0 && (
            <Box paddingX={2} paddingY={1}>
              <Text color={config.theme.muted}>
                This board has no lists. Create one with 'trello list:create'.
              </Text>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

const LABEL_COLORS: Record<string, string> = {
  green: "green",
  yellow: "yellow",
  orange: "#FFA500",
  red: "red",
  purple: "magenta",
  blue: "blue",
  sky: "cyan",
  lime: "greenBright",
  pink: "magentaBright",
  black: "white",
};

function openUrl(url: string) {
  const platform = process.platform;
  const cmd =
    platform === "darwin" ? "open" :
    platform === "win32" ? "start" :
    "xdg-open";
  exec(`${cmd} ${JSON.stringify(url)}`);
}
