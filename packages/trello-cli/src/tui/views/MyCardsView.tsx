import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { useTrello } from "../state/TrelloContext";
import { useNavigation } from "../state/NavigationContext";
import { TrelloCard } from "../types";
import Spinner from "ink-spinner";

interface CardGroup {
  title: string;
  color: string;
  cards: TrelloCard[];
}

export function MyCardsView() {
  const { loadAssignedCards, state: trelloState, cache } = useTrello();
  const { dispatch, config } = useNavigation();
  const [cards, setCards] = useState<TrelloCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [boardNames, setBoardNames] = useState<Record<string, string>>({});
  const [listNames, setListNames] = useState<Record<string, string>>({});

  useEffect(() => {
    setLoading(true);
    loadAssignedCards()
      .then(async (result) => {
        setCards(result);
        // Resolve board and list names from cache
        const boards: Record<string, string> = {};
        const lists: Record<string, string> = {};
        for (const card of result) {
          if (!boards[card.idBoard]) {
            try {
              boards[card.idBoard] = await cache.getBoard(card.idBoard);
            } catch {
              boards[card.idBoard] = card.idBoard;
            }
          }
          if (!lists[card.idList]) {
            try {
              lists[card.idList] = await cache.getList(card.idList);
            } catch {
              lists[card.idList] = card.idList;
            }
          }
        }
        setBoardNames(boards);
        setListNames(lists);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadAssignedCards, cache]);

  // Group cards by due date status
  const groups: CardGroup[] = React.useMemo(() => {
    const overdue: TrelloCard[] = [];
    const today: TrelloCard[] = [];
    const thisWeek: TrelloCard[] = [];
    const later: TrelloCard[] = [];
    const noDue: TrelloCard[] = [];

    const now = new Date();

    for (const card of cards) {
      if (!card.due) {
        noDue.push(card);
        continue;
      }

      const dueDate = new Date(card.due);
      const diffDays = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays < 0) overdue.push(card);
      else if (diffDays === 0) today.push(card);
      else if (diffDays <= 7) thisWeek.push(card);
      else later.push(card);
    }

    const result: CardGroup[] = [];
    if (overdue.length)
      result.push({ title: `Overdue (${overdue.length})`, color: "red", cards: overdue });
    if (today.length)
      result.push({ title: `Due Today (${today.length})`, color: "yellow", cards: today });
    if (thisWeek.length)
      result.push({
        title: `Due This Week (${thisWeek.length})`,
        color: "green",
        cards: thisWeek,
      });
    if (later.length)
      result.push({ title: `Later (${later.length})`, color: "blue", cards: later });
    if (noDue.length)
      result.push({
        title: `No Due Date (${noDue.length})`,
        color: "gray",
        cards: noDue,
      });

    return result;
  }, [cards]);

  // Flatten for navigation
  const allItems = React.useMemo(() => {
    const items: { type: "header" | "card"; group?: CardGroup; card?: TrelloCard }[] =
      [];
    for (const group of groups) {
      items.push({ type: "header", group });
      for (const card of group.cards) {
        items.push({ type: "card", card, group });
      }
    }
    return items;
  }, [groups]);

  useInput((input, key) => {
    if (key.escape) {
      dispatch({ type: "SET_VIEW", view: "home" });
      return;
    }

    if (key.upArrow) {
      let newIndex = selectedIndex - 1;
      // Skip headers
      while (newIndex >= 0 && allItems[newIndex]?.type === "header") {
        newIndex--;
      }
      if (newIndex >= 0) setSelectedIndex(newIndex);
      return;
    }

    if (key.downArrow) {
      let newIndex = selectedIndex + 1;
      // Skip headers
      while (
        newIndex < allItems.length &&
        allItems[newIndex]?.type === "header"
      ) {
        newIndex++;
      }
      if (newIndex < allItems.length) setSelectedIndex(newIndex);
      return;
    }
  });

  if (loading) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text>
          <Text color={config.theme.primary}>
            <Spinner type="dots" />
          </Text>
          {" "}Loading your assigned cards...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text color={config.theme.error}>Error: {error}</Text>
      </Box>
    );
  }

  if (cards.length === 0) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text color={config.theme.muted}>
          No cards assigned to you. Press [Esc] to go back.
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {allItems.map((item, index) => {
        if (item.type === "header" && item.group) {
          return (
            <Box key={`header-${item.group.title}`} marginTop={index > 0 ? 1 : 0} paddingX={1}>
              <Text bold color={item.group.color}>
                {item.group.title}
              </Text>
            </Box>
          );
        }

        if (item.type === "card" && item.card) {
          const isSelected = index === selectedIndex;
          const card = item.card;
          const boardName = boardNames[card.idBoard] || "";
          const listName = listNames[card.idList] || "";

          return (
            <Box key={card.id} paddingX={1}>
              <Text
                color={isSelected ? config.theme.primary : undefined}
                bold={isSelected}
              >
                {isSelected ? "> " : "  "}
                {card.name}
              </Text>
              <Text color={config.theme.muted}>
                {" "}{boardName} / {listName}
              </Text>
            </Box>
          );
        }

        return null;
      })}
    </Box>
  );
}
