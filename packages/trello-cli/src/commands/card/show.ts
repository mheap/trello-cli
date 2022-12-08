import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Show extends BaseCommand<typeof Show> {
  static description = "Show card details";

  static flags = {
    card: Flags.string({ required: true }),
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const card = await this.client.cards.getCard({
      id: this.lookups.card,
    });
    this.output(card);
  }

  protected async toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      due: data.due,
      description: data.desc,
      labels: data.labels,
      url: data.url,
      members: await this.cache.convertMemberIdsToEntity(data.idMembers),
    };
  }
}
