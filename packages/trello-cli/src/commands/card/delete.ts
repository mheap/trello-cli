import { BaseCommand } from "../../BaseCommand";
import { cardSelectorFlags } from "../../selectors";

export default class Delete extends BaseCommand<typeof Delete> {
  static description = "Delete a card";
  static selectorTarget = "card" as const;

  static flags = {
    ...cardSelectorFlags(),
  };

  async run(): Promise<void> {
    await this.client.cards.deleteCard({
      id: this.lookups.card,
    });

    this.output({});
  }
}
