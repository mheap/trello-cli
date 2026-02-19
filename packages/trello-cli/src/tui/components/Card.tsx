import React from "react";
import { Box, Text } from "ink";
import { TrelloCard } from "../types";
import { useNavigation } from "../state/NavigationContext";

interface CardProps {
  card: TrelloCard;
  selected: boolean;
  maxWidth: number;
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

export function Card({ card, selected, maxWidth }: CardProps) {
  const { config } = useNavigation();
  const truncatedName = truncate(card.name, maxWidth - 4);

  const dueInfo = getDueInfo(card.due);
  const hasLabels = card.labels && card.labels.length > 0;


  return (
    <Box
      flexDirection="column"
      paddingX={1}
    >
      <Box>
        <Text color={selected ? config.theme.primary : undefined} bold={selected}>
          {selected ? "> " : "  "}
          {truncatedName}
        </Text>
      </Box>

      {(hasLabels || dueInfo) && (
        <Box paddingLeft={2}>
          {hasLabels &&
            card.labels.map((label) => (
              <Text
                key={label.id}
                color={LABEL_COLORS[label.color] || config.theme.muted}
              >
                #{label.name || ""}{" "}
              </Text>
            ))}
          {dueInfo && (
            <Text color={dueInfo.color}>
              {dueInfo.icon} {dueInfo.text}{" "}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

interface DueInfo {
  text: string;
  color: string;
  icon: string;
}

function getDueInfo(due: string | null): DueInfo | null {
  if (!due) return null;

  const dueDate = new Date(due);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: "Overdue", color: "red", icon: "!!" };
  }
  if (diffDays === 0) {
    return { text: "Today", color: "yellow", icon: ">>" };
  }
  if (diffDays === 1) {
    return { text: "Tomorrow", color: "yellow", icon: ">>" };
  }
  if (diffDays <= 7) {
    return { text: `${diffDays}d`, color: "green", icon: ".." };
  }
  return { text: formatShortDate(dueDate), color: "gray", icon: ".." };
}

function formatShortDate(date: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}
