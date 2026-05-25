import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class CardDeleteChecklist extends BaseCommand<typeof CardDeleteChecklist> {
  static description = "Delete a checklist from a card";

  static flags = {
    board:     Flags.string({ required: true }),
    list:      Flags.string({ required: true }),
    card:      Flags.string({ required: true }),
    checklist: Flags.string({ required: true, description: "Checklist name or ID" }),
  };

  async run(): Promise<void> {
    // resolveChecklistId handles both names and raw IDs (see BaseCommand)
    const checklistId = await this.resolveChecklistId(this.lookups.card, this.flags.checklist);

    await this.client.cards.deleteCardChecklist({
      id: this.lookups.card,
      idChecklist: checklistId,
    });
  }
}
