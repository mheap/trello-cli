import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";

interface MultiLineInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  /** Whether this input is actively capturing keystrokes */
  isActive?: boolean;
  /** Color for the cursor indicator */
  cursorColor?: string;
  /** Color for hints text */
  hintColor?: string;
}

/**
 * Multi-line text input component for ink.
 *
 * - Enter: save/submit
 * - Ctrl+J: insert newline
 * - Esc: cancel
 * - Backspace: delete character (joins lines at line boundaries)
 * - Arrow keys: move cursor
 * - Regular characters: insert at cursor position
 */
export function MultiLineInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  isActive = true,
  cursorColor = "cyan",
  hintColor = "gray",
}: MultiLineInputProps) {
  // Cursor position within the flat string
  const [cursorPos, setCursorPos] = useState(value.length);

  const handleInput = useCallback(
    (input: string, key: import("ink").Key) => {
      // Ctrl+J: insert newline
      if (key.ctrl && input === "j") {
        const newValue = value.slice(0, cursorPos) + "\n" + value.slice(cursorPos);
        onChange(newValue);
        setCursorPos(cursorPos + 1);
        return;
      }

      // Esc: cancel
      if (key.escape) {
        onCancel();
        return;
      }

      // Enter: save/submit
      if (key.return) {
        onSubmit(value);
        return;
      }

      // Backspace: delete character before cursor
      // Note: on most terminals, the physical Backspace key sends \u007F which
      // ink v3 maps to key.delete, not key.backspace (\u0008). We handle both.
      if (key.backspace || key.delete) {
        if (cursorPos > 0) {
          const newValue = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
          onChange(newValue);
          setCursorPos(cursorPos - 1);
        }
        return;
      }

      // Left arrow: move cursor left
      if (key.leftArrow) {
        setCursorPos(Math.max(0, cursorPos - 1));
        return;
      }

      // Right arrow: move cursor right
      if (key.rightArrow) {
        setCursorPos(Math.min(value.length, cursorPos + 1));
        return;
      }

      // Up arrow: move cursor to same column on previous line
      if (key.upArrow) {
        const lines = value.split("\n");
        let pos = 0;
        let lineIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (pos + lines[i].length >= cursorPos) {
            lineIndex = i;
            break;
          }
          pos += lines[i].length + 1; // +1 for newline
        }
        if (lineIndex > 0) {
          const col = cursorPos - pos;
          // Calculate position of previous line start
          let prevLineStart = 0;
          for (let i = 0; i < lineIndex - 1; i++) {
            prevLineStart += lines[i].length + 1;
          }
          const prevLineLen = lines[lineIndex - 1].length;
          setCursorPos(prevLineStart + Math.min(col, prevLineLen));
        }
        return;
      }

      // Down arrow: move cursor to same column on next line
      if (key.downArrow) {
        const lines = value.split("\n");
        let pos = 0;
        let lineIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          if (pos + lines[i].length >= cursorPos) {
            lineIndex = i;
            break;
          }
          pos += lines[i].length + 1;
        }
        if (lineIndex < lines.length - 1) {
          const col = cursorPos - pos;
          const nextLineStart = pos + lines[lineIndex].length + 1;
          const nextLineLen = lines[lineIndex + 1].length;
          setCursorPos(nextLineStart + Math.min(col, nextLineLen));
        }
        return;
      }

      // Tab: insert 2 spaces
      if (key.tab) {
        const newValue = value.slice(0, cursorPos) + "  " + value.slice(cursorPos);
        onChange(newValue);
        setCursorPos(cursorPos + 2);
        return;
      }

      // Ignore other control sequences
      if (key.ctrl || key.meta) {
        return;
      }

      // Regular character input
      if (input && !key.ctrl && !key.meta) {
        const newValue = value.slice(0, cursorPos) + input + value.slice(cursorPos);
        onChange(newValue);
        setCursorPos(cursorPos + input.length);
      }
    },
    [value, cursorPos, onChange, onSubmit, onCancel]
  );

  useInput(handleInput, { isActive });

  // Render the text with a cursor indicator
  const lines = value.split("\n");
  let charCount = 0;

  return (
    <Box flexDirection="column">
      {lines.map((line, lineIdx) => {
        const lineStart = charCount;
        charCount += line.length + 1; // +1 for newline

        // Is cursor on this line?
        const cursorOnLine =
          cursorPos >= lineStart && cursorPos <= lineStart + line.length;
        const cursorCol = cursorPos - lineStart;

        if (cursorOnLine) {
          const before = line.slice(0, cursorCol);
          const cursorChar = line[cursorCol] || " ";
          const after = line.slice(cursorCol + 1);
          return (
            <Box key={lineIdx}>
              <Text>{lineIdx + 1 > 0 ? "" : ""}</Text>
              <Text>{before}</Text>
              <Text backgroundColor={cursorColor} color="black">
                {cursorChar}
              </Text>
              <Text>{after}</Text>
            </Box>
          );
        }

        return (
          <Box key={lineIdx}>
            <Text>{line || " "}</Text>
          </Box>
        );
      })}
      <Box marginTop={1}>
        <Text color={hintColor}>
          [Ctrl+J] New line  [Enter] Save  [Esc] Cancel
        </Text>
      </Box>
    </Box>
  );
}
