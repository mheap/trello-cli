import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class GetById extends BaseCommand<typeof GetById> {
  static description = "Show card details by ID";

  static flags = {
    id: Flags.string({ required: true, description: "The Trello card ID" }),
  };

  async run(): Promise<void> {
    const card = await this.client.cards.getCard({
      id: this.flags.id,
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
