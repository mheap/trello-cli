import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class CardComments extends BaseCommand<typeof CardComments> {
  static description = "List comments on a card";

  protected defaultOutput = "fancy" as const;

  static flags = {
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
    card: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const actions = await this.client.cards.getCardActions({
      id: this.lookups.card,
      filter: "commentCard",
    });
    this.output(actions);
  }

  protected toData(data: any) {
    return data.map((action: any) => ({
      id: action.id,
      text: action.data.text,
      author: action.memberCreator.fullName,
      date: action.date,
    }));
  }

  protected async format(data: any): Promise<string> {
    if (data.length === 0) {
      return "No comments";
    }
    return data
      .map((c: any) => `${c.author} [${c.date}]: ${c.text}`)
      .join("\n");
  }
}
