import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";
import { cardSelectorFlags } from "../../selectors";

export default class CardUnlabel extends BaseCommand<typeof CardUnlabel> {
  static description = "Remove a label from a card";
  static selectorTarget = "card" as const;

  static flags = {
    ...cardSelectorFlags(),
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
