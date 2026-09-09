import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class CardDeleteChecklistItem extends BaseCommand<typeof CardDeleteChecklistItem> {
  static description = "Delete an item from a checklist on a card";

  static flags = {
    board:     Flags.string({ required: true }),
    list:      Flags.string({ required: true }),
    card:      Flags.string({ required: true }),
    checklist: Flags.string({ required: true, description: "Checklist name or ID" }),
    item:      Flags.string({ required: true, description: "Item name or ID to delete" }),
  };

  async run(): Promise<void> {
    const itemId = await this.resolveItemId(this.lookups.card, this.flags.checklist, this.flags.item);

    await this.client.cards.deleteCardChecklistItem({
      id: this.lookups.card,
      idCheckItem: itemId,
    });
  }

  // Resolves an item name to its ID within the scoped checklist.
  // When the item value is already a 24-char hex ID, skips all API calls entirely.
  // The checklist flag scopes the search so identically-named items in other
  // checklists on the same card don't cause false matches.
  private async resolveItemId(cardId: string, checklist: string, item: string): Promise<string> {
    if (/^[a-f0-9]{24}$/.test(item) && /^[a-f0-9]{24}$/.test(checklist)) {
      return item;
    }

    const checklists = (await this.client.cards.getCardChecklists({ id: cardId })) as any[];

    // Scope the search to the specified checklist
    const targetChecklist = checklists.find(
      (cl: any) => cl.name === checklist || cl.id === checklist,
    );
    if (!targetChecklist) {
      this.error(`No checklist found matching "${checklist}"`);
    }

    // Item may already be an ID even if checklist was a name
    if (/^[a-f0-9]{24}$/.test(item)) {
      return item;
    }

    const found = targetChecklist.checkItems.find((ci: any) => ci.name === item);
    if (!found) {
      this.error(`No checklist item found with name "${item}"`);
    }

    return found.id;
  }
}
