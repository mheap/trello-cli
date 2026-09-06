import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";
import { cardSelectorFlags } from "../../selectors";

export default class CardComment extends BaseCommand<typeof CardComment> {
  static description = "Add a comment to a card";
  static selectorTarget = "card" as const;

  static flags = {
    ...cardSelectorFlags(),
    text: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const comment = await this.client.cards.addCardComment({
      id: this.lookups.card,
      text: this.flags.text,
    });
    this.output(comment);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      text: data.data.text,
      date: data.date,
      memberCreator: data.memberCreator.fullName,
    };
  }
}
