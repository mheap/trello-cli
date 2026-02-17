import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class ListMoveAllCards extends BaseCommand<typeof ListMoveAllCards> {
  static description = "Move all cards from one list to another";

  protected defaultOutput = "fancy" as const;

  static flags = {
    board: Flags.string({
      required: true,
      description: "The board containing the source list",
    }),
    list: Flags.string({
      required: true,
      description: "The source list containing the cards to move",
    }),
    "destination-board": Flags.string({
      required: true,
      description: "The destination board",
    }),
    "destination-list": Flags.string({
      required: true,
      description: "The destination list",
    }),
  };

  async run(): Promise<void> {
    const destinationBoardId = await this.cache.getBoardIdByName(
      this.flags["destination-board"]
    );

    const destinationListId = await this.cache.getListIdByBoardAndName(
      destinationBoardId,
      this.flags["destination-list"]
    );

    const result = await this.client.lists.moveAllCardsInList({
      id: this.lookups.list,
      idBoard: destinationBoardId,
      idList: destinationListId,
    });

    this.output(result);
  }

  protected toData(data: any) {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((card: any) => ({
      id: card.id,
      name: card.name,
    }));
  }

  protected async format(data: any): Promise<string> {
    if (!Array.isArray(data) || data.length === 0) {
      return "No cards moved";
    }

    return `${data.length} ${data.length === 1 ? "card" : "cards"} moved`;
  }
}
