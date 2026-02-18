import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class ListArchiveCards extends BaseCommand<typeof ListArchiveCards> {
  static description = "Archive all cards in a list";

  protected defaultOutput = "fancy" as const;

  static flags = {
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const result = await this.client.lists.archiveAllCardsInList({
      id: this.lookups.list,
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
      return "No cards archived";
    }
    return `${data.length} ${data.length === 1 ? "card" : "cards"} archived`;
  }
}
