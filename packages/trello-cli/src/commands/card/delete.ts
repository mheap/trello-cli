import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Delete extends BaseCommand<typeof Delete> {
  static description = "Delete a card";

  static flags = {
    card: Flags.string({ required: true }),
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    await this.client.cards.deleteCard({
      id: this.lookups.card,
    });

    this.output({});
  }
}
