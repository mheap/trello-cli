import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";
import { cardSelectorFlags } from "../../selectors";

export default class Unassign extends BaseCommand<typeof Unassign> {
  static description = "Unassign a card";
  static selectorTarget = "card" as const;

  static flags = {
    ...cardSelectorFlags(),
    user: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    await this.client.cards.deleteCardMember({
      id: this.lookups.card,
      idMember: this.lookups.user,
    });
    this.output({});
  }
}
