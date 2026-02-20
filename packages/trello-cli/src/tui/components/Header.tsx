import React from "react";
import { Box, Text } from "ink";
import { useNavigation } from "../state/NavigationContext";
import { useTrello } from "../state/TrelloContext";

export function Header() {
  const { state: navState, config } = useNavigation();
  const { state: trelloState } = useTrello();

  let title = "Trello CLI";
  let visibleInfo = "";

  if (navState.view === "board" && trelloState.currentBoard) {
    if (navState.mode !== "normal") {
      // Show breadcrumb: Board / List / Card Title
      const currentList = trelloState.lists[navState.selectedListIndex];
      const cards = currentList
        ? trelloState.cardsByList[currentList.id] || []
        : [];
      const card = cards[navState.selectedCardIndex];
      const parts = [trelloState.currentBoard.name];
      if (currentList) parts.push(currentList.name);
      if (card) parts.push(card.name);
      title = parts.join(" / ");
    } else {
      title = trelloState.currentBoard.name;
      const listCount = trelloState.lists.length;
      if (listCount > 0) {
        visibleInfo = ` (${listCount} lists)`;
      }
    }
  } else if (navState.view === "my-cards") {
    title = "My Assigned Cards";
  }

  return (
    <Box
      borderStyle="single"
      borderBottom={true}
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      paddingX={1}
      justifyContent="space-between"
    >
      <Text bold color={config.theme.primary}>
        {title}
        <Text color={config.theme.muted}>{visibleInfo}</Text>
      </Text>
      <Box>
        {trelloState.loading && (
          <Text color={config.theme.warning}> Loading... </Text>
        )}
        {trelloState.error && (
          <Text color={config.theme.error}> {trelloState.error} </Text>
        )}
        {navState.statusMessage && (
          <Text color={config.theme.accent}> {navState.statusMessage} </Text>
        )}
        {trelloState.lastSynced && !trelloState.loading && (
          <Text color={config.theme.muted}>
            {" "}
            Synced {formatTimeSince(trelloState.lastSynced)}{" "}
          </Text>
        )}
      </Box>
    </Box>
  );
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
