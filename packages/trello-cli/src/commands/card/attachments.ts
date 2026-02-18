import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class CardAttachments extends BaseCommand<typeof CardAttachments> {
  static description = "List attachments on a card";

  protected defaultOutput = "fancy" as const;

  static flags = {
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
    card: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const attachments = await this.client.cards.getCardAttachments({
      id: this.lookups.card,
    });
    this.output(attachments);
  }

  protected toData(data: any) {
    return data.map((a: any) => ({
      id: a.id,
      name: a.name,
      url: a.url,
      date: a.date,
    }));
  }

  protected async format(data: any): Promise<string> {
    if (data.length === 0) {
      return "No attachments";
    }
    return data
      .map((a: any) => `${a.name} (${a.url})`)
      .join("\n");
  }
}
