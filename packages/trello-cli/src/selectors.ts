import { Flags } from "@oclif/core";

export const boardSelectorFlags = () => ({
  id: Flags.string({
    description: "The Trello board ID",
    exactlyOne: ["id", "board"],
    exclusive: ["board"],
  }),
  board: Flags.string({ description: "The board name or ID" }),
});

export const boardReferenceFlags = () => ({
  board: Flags.string({
    required: true,
    description: "The board name or ID",
  }),
});

export const listSelectorFlags = () => ({
  id: Flags.string({
    description: "The Trello list ID",
    exactlyOne: ["id", "list"],
    exclusive: ["board", "list"],
  }),
  board: Flags.string({ description: "The board name or ID" }),
  list: Flags.string({
    description: "The list name or ID",
    dependsOn: ["board"],
  }),
});

export const listReferenceFlags = () => ({
  board: Flags.string({
    required: true,
    description: "The board name or ID",
  }),
  list: Flags.string({
    required: true,
    description: "The list name or ID",
    dependsOn: ["board"],
  }),
});

export const cardSelectorFlags = () => ({
  id: Flags.string({
    description: "The Trello card ID",
    exactlyOne: ["id", "card"],
    exclusive: ["board", "list", "card"],
  }),
  board: Flags.string({ description: "The board name or ID" }),
  list: Flags.string({
    description: "The list name or ID",
    dependsOn: ["board"],
  }),
  card: Flags.string({
    description: "The card name",
    dependsOn: ["board", "list"],
  }),
});
