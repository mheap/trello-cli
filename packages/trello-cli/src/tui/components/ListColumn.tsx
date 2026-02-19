import React from "react";
import { Box, Text } from "ink";
import { TrelloList, TrelloCard } from "../types";
import { Card } from "./Card";
import { useNavigation } from "../state/NavigationContext";

interface ListColumnProps {
  list: TrelloList;
  cards: TrelloCard[];
  listIndex: number;
  isSelectedList: boolean;
  selectedCardIndex: number;
  width: number;
  height: number;
  maxCardRows: number;
}

export function ListColumn({
  list,
  cards,
  listIndex,
  isSelectedList,
  selectedCardIndex,
  width,
  height,
  maxCardRows,
}: ListColumnProps) {
  const { config } = useNavigation();

  // Scroll cards if there are more than fit
  const visibleCards = getVisibleCards(cards, selectedCardIndex, maxCardRows);

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      borderStyle={isSelectedList ? "bold" : "single"}
      borderColor={isSelectedList ? config.theme.primary : config.theme.muted}
      marginRight={1}
    >
      {/* List header */}
      <Box paddingX={1} justifyContent="space-between">
        <Text
          bold
          color={isSelectedList ? config.theme.primary : undefined}
        >
          {truncate(list.name, width - 8)}
        </Text>
        <Text color={config.theme.muted}>
          [{listIndex + 1}]
        </Text>
      </Box>

      {/* Scroll indicator top */}
      {visibleCards.scrollTop > 0 && (
        <Box justifyContent="center">
          <Text color={config.theme.muted}>-- {visibleCards.scrollTop} more --</Text>
        </Box>
      )}

      {/* Cards */}
      {visibleCards.cards.length === 0 ? (
        <Box paddingX={1} paddingY={1}>
          <Text color={config.theme.muted} italic>
            No cards
          </Text>
        </Box>
      ) : (
        visibleCards.cards.map((card, i) => (
          <Box key={card.id}>
            <Card
              card={card}
              selected={isSelectedList && visibleCards.startIndex + i === selectedCardIndex}
              maxWidth={width - 2}
            />
          </Box>
        ))
      )}

      {/* Scroll indicator bottom */}
      {visibleCards.scrollBottom > 0 && (
        <Box justifyContent="center">
          <Text color={config.theme.muted}>-- {visibleCards.scrollBottom} more --</Text>
        </Box>
      )}

      {/* Add card hint */}
      {isSelectedList && (
        <Box paddingX={1}>
          <Text color={config.theme.muted}>[n] + New card</Text>
        </Box>
      )}
    </Box>
  );
}

interface VisibleCards {
  cards: TrelloCard[];
  startIndex: number;
  scrollTop: number;
  scrollBottom: number;
}

function getVisibleCards(
  cards: TrelloCard[],
  selectedIndex: number,
  maxRows: number
): VisibleCards {
  if (cards.length <= maxRows) {
    return {
      cards,
      startIndex: 0,
      scrollTop: 0,
      scrollBottom: 0,
    };
  }

  // Keep selected card visible with some context
  let start = Math.max(0, selectedIndex - Math.floor(maxRows / 2));
  let end = start + maxRows;

  if (end > cards.length) {
    end = cards.length;
    start = Math.max(0, end - maxRows);
  }

  return {
    cards: cards.slice(start, end),
    startIndex: start,
    scrollTop: start,
    scrollBottom: cards.length - end,
  };
}

function truncate(str: string, maxLen: number): string {
  if (maxLen < 4) return str.slice(0, maxLen);
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}
