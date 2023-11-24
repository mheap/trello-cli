import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Assign extends BaseCommand<typeof Assign> {
  static description = "Assign a card";

  static flags = {
    card: Flags.string({ required: true }),
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
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
