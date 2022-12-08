import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Archive extends BaseCommand<typeof Archive> {
  static description = "Archive a card";

  static flags = {
    card: Flags.string({ required: true }),
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const card = await this.client.cards.updateCard({
      id: this.lookups.card,
      closed: true,
    });

    this.output(card);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      due: data.due,
      description: data.desc,
      labels: data.labels,
      url: data.url,
    };
  }
}
