import React, { useMemo, useEffect, useState } from "react";
import { exec } from "child_process";
import { Box, Text, useInput } from "ink";
import { useTrello } from "../state/TrelloContext";
import { useNavigation } from "../state/NavigationContext";
import { TrelloCard } from "../types";

const CARD_DETAIL_HELP = [
  { key: "e", desc: "Edit card name" },
  { key: "D", desc: "Edit description (multi-line)" },
  { key: "m", desc: "Move card to a different list" },
  { key: "d", desc: "Set / update due date" },
  { key: "l", desc: "Toggle labels on card" },
  { key: "M", desc: "Toggle members on card" },
  { key: "c", desc: "Toggle checklist items" },
  { key: "C", desc: "Create new checklist on card" },
  { key: "A", desc: "Add attachment (URL or URL | description)" },
  { key: "a", desc: "View all attachments" },
  { key: "o", desc: "Open card in browser" },
  { key: "x", desc: "Archive card" },
  { key: "Esc/Enter", desc: "Close card detail" },
];

export function CardDetailView() {
  const {
    state: trelloState,
    archiveCard,
    moveCard,
    updateCard,
    loadCardDetails,
  } = useTrello();
  const { state: navState, dispatch, config } = useNavigation();
  const [showHelp, setShowHelp] = useState(false);

  const lists = trelloState.lists;
  const currentList = lists[navState.selectedListIndex];
  const cards = currentList
    ? trelloState.cardsByList[currentList.id] || []
    : [];
  const card = cards[navState.selectedCardIndex] as TrelloCard | undefined;

  // Load checklists and attachments when entering card detail view
  useEffect(() => {
    if (card && navState.view === "card-detail") {
      loadCardDetails(card.id);
    }
  }, [card?.id, navState.view]);

  // Resolve member names from cache
  const memberNames = useMemo(() => {
    if (!card || !card.idMembers.length) return [];
    return card.idMembers.map((id) => {
      const member = trelloState.members.find((m) => m.id === id);
      return member ? member.fullName : id;
    });
  }, [card, trelloState.members]);

  useInput((input, key) => {
    // Help screen takes priority
    if (showHelp) {
      if (key.escape || input === "?" || input === "q") {
        setShowHelp(false);
      }
      return;
    }

    if (input === "?") {
      setShowHelp(true);
      return;
    }

    if (key.escape || key.return) {
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      return;
    }

    // Edit card - switch to board view in edit mode
    if (input === "e" && card) {
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      dispatch({ type: "SET_MODE", mode: "edit-card", originView: "card-detail" });
      return;
    }

    // Move card - switch to board view in move mode
    if (input === "m" && card) {
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      dispatch({ type: "SET_MODE", mode: "move-card", originView: "card-detail" });
      return;
    }

    // Set due date - switch to board view in due mode
    if (input === "d" && card) {
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      dispatch({ type: "SET_MODE", mode: "set-due", originView: "card-detail" });
      return;
    }

    // Toggle labels - switch to board view in toggle-label mode
    if (input === "l" && card) {
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      dispatch({ type: "SET_MODE", mode: "toggle-label", originView: "card-detail" });
      return;
    }

    // Toggle members - switch to board view in toggle-member mode
    if (input === "M" && card) {
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      dispatch({ type: "SET_MODE", mode: "toggle-member", originView: "card-detail" });
      return;
    }

    // Edit description - switch to board view in edit-desc mode
    if (input === "D" && card) {
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      dispatch({ type: "SET_MODE", mode: "edit-desc", originView: "card-detail" });
      return;
    }

    // Open card in browser
    if (input === "o" && card) {
      openUrl(card.url);
      dispatch({ type: "SET_STATUS", message: `Opening in browser...` });
      setTimeout(() => dispatch({ type: "SET_STATUS", message: null }), 3000);
      return;
    }

    // Toggle checklist items - switch to board view in toggle-checklist mode
    if (input === "c" && card) {
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      dispatch({ type: "SET_MODE", mode: "toggle-checklist", originView: "card-detail" });
      return;
    }

    // Add checklist - switch to board view in add-checklist mode
    if (input === "C" && card) {
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      dispatch({ type: "SET_MODE", mode: "add-checklist", originView: "card-detail" });
      return;
    }

    // Add attachment - switch to board view in add-attachment mode
    if (input === "A" && card) {
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      dispatch({ type: "SET_MODE", mode: "add-attachment", originView: "card-detail" });
      return;
    }

    // View all attachments - switch to board view in view-attachments mode
    if (input === "a" && card) {
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      dispatch({ type: "SET_MODE", mode: "view-attachments", originView: "card-detail" });
      return;
    }

    if (input === "x" && card && currentList) {
      archiveCard(card.id, currentList.id);
      dispatch({ type: "SET_STATUS", message: `Archived "${card.name}"` });
      setTimeout(() => dispatch({ type: "SET_STATUS", message: null }), 3000);
      dispatch({ type: "SET_VIEW", view: "board", preserveSelection: true });
      return;
    }
  }, { isActive: navState.view === "card-detail" });

  if (!card) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text color={config.theme.muted}>No card selected</Text>
      </Box>
    );
  }

  // Help overlay for card detail
  if (showHelp) {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={config.theme.primary}
        paddingX={2}
        paddingY={1}
        marginX={2}
      >
        <Text bold color={config.theme.primary}>
          Card Detail Shortcuts
        </Text>
        <Text color={config.theme.muted}>
          Press ? or Esc to close
        </Text>
        <Text> </Text>
        {CARD_DETAIL_HELP.map((item) => (
          <Box key={item.key}>
            <Box width={14}>
              <Text color={config.theme.primary} bold>
                {item.key}
              </Text>
            </Box>
            <Text>{item.desc}</Text>
          </Box>
        ))}
      </Box>
    );
  }

  const dueInfo = getDueInfo(card.due);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={config.theme.primary}
      paddingX={2}
      paddingY={1}
      marginX={2}
    >
      {/* Board / List / Card title */}
      <Text>
        <Text color={config.theme.secondary}>{trelloState.currentBoard?.name || "Unknown"}</Text>
        <Text color={config.theme.muted}> / </Text>
        <Text color={config.theme.secondary}>{currentList?.name || "Unknown"}</Text>
        <Text color={config.theme.muted}> / </Text>
        <Text bold color={config.theme.primary}>{card.name}</Text>
      </Text>

      {/* Metadata */}
      <Text> </Text>
      <Box flexDirection="column">
        <Box>
          <Box width={12}>
            <Text bold>ID:</Text>
          </Box>
          <Text color={config.theme.secondary}>{card.id}</Text>
        </Box>
        <Box>
          <Box width={12}>
            <Text bold>URL:</Text>
          </Box>
          <Text color={config.theme.secondary}>{card.url}</Text>
        </Box>

        <Text> </Text>

        {/* Labels — hidden when empty */}
        {card.labels.length > 0 && (
          <Box>
            <Box width={12}>
              <Text>
                <Text bold>Labels:</Text>
                <Text color={config.theme.primary}> [l]</Text>
              </Text>
            </Box>
            <Box>
              {card.labels.map((label) => (
                <Text
                  key={label.id}
                  color={LABEL_COLORS[label.color] || config.theme.muted}
                >
                  {" "}#{label.name || ""}
                </Text>
              ))}
            </Box>
          </Box>
        )}

        {/* Members — hidden when empty */}
        {memberNames.length > 0 && (
          <Box>
            <Box width={12}>
              <Text bold>Members:</Text>
            </Box>
            <Text>{memberNames.join(", ")}</Text>
          </Box>
        )}

        {/* Due date — hidden when empty */}
        {dueInfo && (
          <Box>
            <Box width={12}>
              <Text bold>Due:</Text>
            </Box>
            <Text color={dueInfo.color}>
              {dueInfo.icon} {dueInfo.fullText}
            </Text>
          </Box>
        )}

        {/* Description — hidden when empty */}
        {card.desc ? (
          <Box flexDirection="column" marginTop={1}>
            <Text>
              <Text bold>Description:</Text>
              <Text color={config.theme.primary}> [D]</Text>
            </Text>
            <Box paddingLeft={2} marginTop={0}>
              <Text wrap="wrap">{card.desc}</Text>
            </Box>
          </Box>
        ) : null}

        {/* Checklists */}
        {card.checklists && card.checklists.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text>
              <Text bold>Checklists:</Text>
              <Text color={config.theme.primary}> [c]</Text>
            </Text>
            {card.checklists.length === 1 ? (
              // Single checklist — show items (max 5)
              card.checklists.map((checklist) => {
                const total = checklist.checkItems.length;
                const done = checklist.checkItems.filter(
                  (ci) => ci.state === "complete"
                ).length;
                const sorted = checklist.checkItems.sort((a, b) => a.pos - b.pos);
                const shown = sorted.slice(0, 5);
                const remaining = sorted.length - shown.length;
                return (
                  <Box key={checklist.id} flexDirection="column" paddingLeft={2}>
                    <Text bold color={config.theme.secondary}>
                      {checklist.name} ({done}/{total})
                    </Text>
                    {shown.map((item) => (
                      <Box key={item.id} paddingLeft={2}>
                        <Text
                          color={
                            item.state === "complete"
                              ? config.theme.accent
                              : config.theme.muted
                          }
                        >
                          {item.state === "complete" ? "[x] " : "[ ] "}
                        </Text>
                        <Text
                          strikethrough={item.state === "complete"}
                          color={
                            item.state === "complete"
                              ? config.theme.muted
                              : undefined
                          }
                        >
                          {item.name}
                        </Text>
                      </Box>
                    ))}
                    {remaining > 0 && (
                      <Box paddingLeft={2}>
                        <Text color={config.theme.muted} italic>
                          ... and {remaining} more (press c to view all)
                        </Text>
                      </Box>
                    )}
                  </Box>
                );
              })
            ) : (
              // Multiple checklists — title and count only
              card.checklists.map((checklist) => {
                const total = checklist.checkItems.length;
                const done = checklist.checkItems.filter(
                  (ci) => ci.state === "complete"
                ).length;
                return (
                  <Box key={checklist.id} paddingLeft={2}>
                    <Text bold color={config.theme.secondary}>
                      {checklist.name}
                    </Text>
                    <Text color={config.theme.muted}> ({done}/{total})</Text>
                  </Box>
                );
              })
            )}
          </Box>
        )}

        {/* Attachments — count + [a] indicator */}
        {card.attachments && card.attachments.length > 0 && (
          <Box marginTop={1}>
            <Text bold>Attachments:</Text>
            <Text color={config.theme.muted}> {card.attachments.length}</Text>
            <Text color={config.theme.primary}> [a]</Text>
          </Box>
        )}
      </Box>

      <Text> </Text>

      {/* Actions — essentials only, full list behind ? */}
      <Box>
        <Text color={config.theme.muted}>
          [Esc] Close  [e] Edit  [l] Labels  [d] Due date  [o] Open  [?] Help
        </Text>
      </Box>
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

interface DueInfo {
  fullText: string;
  color: string;
  icon: string;
}

function getDueInfo(due: string | null): DueInfo | null {
  if (!due) return null;

  const dueDate = new Date(due);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = dueDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffDays < 0) {
    return {
      fullText: `${formatted} (Overdue by ${Math.abs(diffDays)} days)`,
      color: "red",
      icon: "!!",
    };
  }
  if (diffDays === 0) {
    return { fullText: `${formatted} (Today)`, color: "yellow", icon: ">>" };
  }
  if (diffDays === 1) {
    return {
      fullText: `${formatted} (Tomorrow)`,
      color: "yellow",
      icon: ">>",
    };
  }
  if (diffDays <= 7) {
    return {
      fullText: `${formatted} (${diffDays} days)`,
      color: "green",
      icon: "..",
    };
  }
  return { fullText: formatted, color: "gray", icon: ".." };
}

function openUrl(url: string) {
  const platform = process.platform;
  const cmd =
    platform === "darwin" ? "open" :
    platform === "win32" ? "start" :
    "xdg-open";
  exec(`${cmd} ${JSON.stringify(url)}`);
}
