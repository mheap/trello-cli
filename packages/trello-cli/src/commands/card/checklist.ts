import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class CardChecklist extends BaseCommand<typeof CardChecklist> {
  static description = "Add a checklist to a card";

  static flags = {
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
    card: Flags.string({ required: true }),
    name: Flags.string({ char: "n", required: true }),
  };

  async run(): Promise<void> {
    const checklist = await this.client.cards.createCardChecklist({
      id: this.lookups.card,
      name: this.flags.name,
    });
    this.output(checklist);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
    };
  }
}
