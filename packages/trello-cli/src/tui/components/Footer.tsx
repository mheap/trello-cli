import React from "react";
import { Box, Text } from "ink";
import { useNavigation } from "../state/NavigationContext";

interface Shortcut {
  key: string;
  label: string;
}

const HOME_SHORTCUTS: Shortcut[] = [
  { key: "Up/Down", label: "Navigate" },
  { key: "Enter", label: "Select" },
  { key: "Type", label: "Filter" },
  { key: "m", label: "My cards" },
  { key: "s", label: "Sync" },
  { key: "q/Esc", label: "Quit" },
];

const BOARD_SHORTCUTS: Shortcut[] = [
  { key: "Arrows", label: "Navigate" },
  { key: "Enter", label: "View" },
  { key: "n", label: "New card" },
  { key: "L", label: "New list" },
  { key: "Esc", label: "Back" },
  { key: "?", label: "Help" },
];

const CARD_DETAIL_SHORTCUTS: Shortcut[] = [
  { key: "e", label: "Edit" },
  { key: "l", label: "Labels" },
  { key: "d", label: "Due date" },
  { key: "o", label: "Open" },
  { key: "Esc", label: "Close" },
  { key: "?", label: "Help" },
];

const MY_CARDS_SHORTCUTS: Shortcut[] = [
  { key: "Up/Down", label: "Navigate" },
  { key: "Enter", label: "View" },
  { key: "Esc", label: "Back" },
];

export function Footer() {
  const { state, config } = useNavigation();

  let shortcuts: Shortcut[];
  switch (state.view) {
    case "home":
      shortcuts = HOME_SHORTCUTS;
      break;
    case "board":
      shortcuts = BOARD_SHORTCUTS;
      break;
    case "card-detail":
      shortcuts = CARD_DETAIL_SHORTCUTS;
      break;
    case "my-cards":
      shortcuts = MY_CARDS_SHORTCUTS;
      break;
    default:
      shortcuts = HOME_SHORTCUTS;
  }

  if (state.mode !== "normal") {
    if (state.mode === "edit-desc") {
      shortcuts = [
        { key: "Enter", label: "Save" },
        { key: "Esc", label: "Cancel" },
        { key: "Ctrl+J", label: "New line" },
      ];
    } else if (state.mode === "toggle-label" || state.mode === "toggle-member") {
      shortcuts = [
        { key: "1-9", label: "Toggle" },
        { key: "Esc", label: "Close" },
      ];
    } else if (state.mode === "toggle-checklist") {
      shortcuts = [
        { key: "1-9/a-z", label: "Select/Toggle" },
        { key: "Left/Right", label: "Page" },
        { key: "i", label: "Add item" },
        { key: "Esc", label: "Back" },
      ];
    } else if (state.mode === "view-attachments") {
      shortcuts = [
        { key: "Esc", label: "Close" },
      ];
    } else {
      shortcuts = [
        { key: "Enter", label: "Confirm" },
        { key: "Esc", label: "Cancel" },
      ];
    }
  }

  return (
    <Box
      borderStyle="single"
      borderTop={true}
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      paddingX={1}
    >
      {shortcuts.map((s, i) => (
        <Box key={s.key} marginRight={1}>
          <Text color={config.theme.primary} bold>
            [{s.key}]
          </Text>
          <Text color={config.theme.muted}> {s.label}</Text>
          {i < shortcuts.length - 1 && <Text color={config.theme.muted}> </Text>}
        </Box>
      ))}
    </Box>
  );
}
