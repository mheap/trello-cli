import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class CardUnlabel extends BaseCommand<typeof CardUnlabel> {
  static description = "Remove a label from a card";

  static flags = {
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
    card: Flags.string({ required: true }),
    label: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const labelId = await this.cache.getLabelIdByName(this.flags.label);
    await this.client.cards.deleteCardLabel({
      id: this.lookups.card,
      idLabel: labelId,
    });
  }
}
