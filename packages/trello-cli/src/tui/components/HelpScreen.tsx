import React from "react";
import { Box, Text, useInput } from "ink";
import { useNavigation } from "../state/NavigationContext";

const ALL_SHORTCUTS = [
  { section: "Navigation", items: [
    { key: "Up / Down", desc: "Navigate items in a list" },
    { key: "Left / Right", desc: "Switch between lists (Board view)" },
    { key: "1-9", desc: "Jump to list by number" },
    { key: "Enter", desc: "Select / Open details" },
    { key: "Esc", desc: "Go back / Cancel" },
    { key: "Tab", desc: "Cycle through lists" },
    { key: "g / G", desc: "Jump to first / last card" },
  ]},
  { section: "Card Actions", items: [
    { key: "n", desc: "Create new card in current list" },
    { key: "e", desc: "Edit card name" },
    { key: "D", desc: "Edit card description (multi-line)" },
    { key: "m", desc: "Move card to a different list" },
    { key: "d", desc: "Set / update due date" },
    { key: "l", desc: "Toggle labels on card" },
    { key: "M", desc: "Toggle members on card" },
    { key: "c", desc: "Toggle checklist items" },
    { key: "C", desc: "Create new checklist on card" },
    { key: "A", desc: "Add attachment (URL or URL | description)" },
    { key: "a", desc: "View all attachments" },
    { key: "x", desc: "Archive card" },
    { key: "o", desc: "Open card in browser" },
    { key: "Delete", desc: "Delete card (with confirmation)" },
  ]},
  { section: "List Actions", items: [
    { key: "L", desc: "Create new list on current board" },
  ]},
  { section: "Global", items: [
    { key: "b", desc: "Switch board (from Board view)" },
    { key: "s", desc: "Sync cache" },
    { key: "Ctrl+R", desc: "Force refresh board" },
    { key: "?", desc: "Toggle this help screen" },
    { key: "q", desc: "Quit" },
  ]},
];

export function HelpScreen({ onClose }: { onClose: () => void }) {
  const { config } = useNavigation();

  useInput((_input, key) => {
    if (key.escape || _input === "?" || _input === "q") {
      onClose();
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text bold color={config.theme.primary}>
        Keyboard Shortcuts
      </Text>
      <Text color={config.theme.muted}>
        Press ? or Esc to close
      </Text>
      <Text> </Text>

      {ALL_SHORTCUTS.map((section) => (
        <Box key={section.section} flexDirection="column" marginBottom={1}>
          <Text bold underline color={config.theme.secondary}>
            {section.section}
          </Text>
          {section.items.map((item) => (
            <Box key={item.key}>
              <Box width={16}>
                <Text color={config.theme.primary} bold>
                  {item.key}
                </Text>
              </Box>
              <Text>{item.desc}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
