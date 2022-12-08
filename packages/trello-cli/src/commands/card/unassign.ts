import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Unassign extends BaseCommand<typeof Unassign> {
  static description = "Unassign a card";

  static flags = {
    card: Flags.string({ required: true }),
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
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
