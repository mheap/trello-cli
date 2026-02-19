import React, { useEffect, useState, useMemo } from "react";
import { Box, Text, useInput, useApp } from "ink";
import TextInput from "ink-text-input";
import { useTrello } from "../state/TrelloContext";
import { useNavigation } from "../state/NavigationContext";
import Spinner from "ink-spinner";

export function HomeView() {
  const { state: trelloState, loadBoards, loadBoard, syncCache } = useTrello();
  const { state: navState, dispatch, config } = useNavigation();
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const boards = trelloState.boards;

  const filteredBoards = useMemo(() => {
    if (!filterText.trim()) return boards;
    const lower = filterText.toLowerCase();
    return boards.filter((b) => b.name.toLowerCase().includes(lower));
  }, [boards, filterText]);

  // Keep selected index within bounds when filter changes
  useEffect(() => {
    if (selectedIndex >= filteredBoards.length) {
      setSelectedIndex(Math.max(0, filteredBoards.length - 1));
    }
  }, [filteredBoards.length, selectedIndex]);

  useInput((input, key) => {
    if (navState.mode !== "normal") return;

    if (key.escape) {
      if (filterText) {
        setFilterText("");
        setSelectedIndex(0);
      } else {
        exit();
      }
      return;
    }

    if (input === "q" && !filterText) {
      exit();
      return;
    }

    if (input === "s" && !filterText) {
      syncCache().then(() => loadBoards());
      return;
    }

    if (input === "m" && !filterText) {
      dispatch({ type: "SET_VIEW", view: "my-cards" });
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(filteredBoards.length - 1, prev + 1));
      return;
    }

    if (key.return && filteredBoards.length > 0) {
      const board = filteredBoards[selectedIndex];
      if (board) {
        loadBoard(board);
        dispatch({ type: "SET_VIEW", view: "board" });
        setFilterText("");
      }
      return;
    }
  });

  if (trelloState.loading && boards.length === 0) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text>
          <Text color={config.theme.primary}>
            <Spinner type="dots" />
          </Text>
          {" "}Loading boards...
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1} paddingX={1}>
        <Text bold color={config.theme.primary}>
          Your Boards
        </Text>
        <Text color={config.theme.muted}>
          {" "}({filteredBoards.length}{filterText ? ` of ${boards.length}` : ""} boards)
        </Text>
      </Box>

      <Box paddingX={1} marginBottom={1}>
        <Text color={config.theme.primary} bold>Filter: </Text>
        <TextInput
          value={filterText}
          onChange={(val) => {
            setFilterText(val);
            setSelectedIndex(0);
          }}
          onSubmit={() => {
            if (filteredBoards.length > 0) {
              const board = filteredBoards[selectedIndex];
              if (board) {
                loadBoard(board);
                dispatch({ type: "SET_VIEW", view: "board" });
                setFilterText("");
              }
            }
          }}
        />
      </Box>

      {filteredBoards.length === 0 ? (
        <Box paddingX={1}>
          <Text color={config.theme.muted}>
            {filterText ? "No boards match your filter." : "No boards found. Press [s] to sync your data."}
          </Text>
        </Box>
      ) : (
        filteredBoards.map((board, index) => (
          <Box key={board.id} paddingX={1}>
            <Text
              color={index === selectedIndex ? config.theme.primary : undefined}
              bold={index === selectedIndex}
            >
              {index === selectedIndex ? "> " : "  "}
              {board.name}
            </Text>
            {board.desc ? (
              <Text color={config.theme.muted}>
                {" "}- {truncate(board.desc, 50)}
              </Text>
            ) : null}
          </Box>
        ))
      )}
    </Box>
  );
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}
