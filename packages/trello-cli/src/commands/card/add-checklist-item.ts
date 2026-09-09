import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class CardAddChecklistItem extends BaseCommand<typeof CardAddChecklistItem> {
  static description = "Add an item to a checklist on a card";

  static flags = {
    board:     Flags.string({ required: true }),
    list:      Flags.string({ required: true }),
    card:      Flags.string({ required: true }),
    checklist: Flags.string({ required: true, description: "Checklist name or ID" }),
    item:      Flags.string({ required: true, description: "Name for the new checklist item" }),
    pos:       Flags.string({
      description: 'Position of the new item: "top", "bottom", or a positive number',
    }),
  };

  async run(): Promise<void> {
    const checklistId = await this.resolveChecklistId(this.lookups.card, this.flags.checklist);

    // Build the API payload. pos is optional — omitting it lets Trello default to bottom.
    const payload: Record<string, any> = { id: checklistId, name: this.flags.item };

    if (this.flags.pos !== undefined) {
      payload.pos = this.parsePos(this.flags.pos);
    }

    const item = await (this.client.checklists as any).createChecklistCheckItems(payload);
    this.output(item);
  }

  // Trello accepts "top"/"bottom" as strings and any positive float as a number.
  // The CLI always receives strings, so numeric strings must be coerced.
  private parsePos(pos: string): string | number {
    if (pos === "top" || pos === "bottom") return pos;
    const n = parseFloat(pos);
    if (isNaN(n)) this.error(`Invalid --pos value "${pos}". Use "top", "bottom", or a number.`);
    return n;
  }

  protected toData(data: any) {
    return {
      id:   data.id,
      name: data.name,
      pos:  data.pos,
    };
  }
}
