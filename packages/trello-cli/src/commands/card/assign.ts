import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";
import { cardSelectorFlags } from "../../selectors";

export default class Assign extends BaseCommand<typeof Assign> {
  static description = "Assign a card";
  static selectorTarget = "card" as const;

  static flags = {
    ...cardSelectorFlags(),
    user: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const card = await this.client.cards.addCardMember({
      id: this.lookups.card,
      value: this.lookups.user,
    });
    this.output(card);
  }

  protected toData(data: any) {
    data = data[0];
    return {
      id: data.id,
      username: data.username,
      fullName: data.fullName,
      initials: data.initials,
    };
  }
}
