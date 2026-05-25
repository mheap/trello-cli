import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class CardUpdateChecklistItem extends BaseCommand<typeof CardUpdateChecklistItem> {
  static description = "Rename or reposition a checklist item on a card";

  static flags = {
    board:     Flags.string({ required: true }),
    list:      Flags.string({ required: true }),
    card:      Flags.string({ required: true }),
    checklist: Flags.string({ required: true, description: "Checklist name or ID" }),
    item:      Flags.string({ required: true, description: "Item name or ID to update" }),
    name:      Flags.string({ description: "New name for the item" }),
    pos:       Flags.string({
      description: 'New position: "top", "bottom", "up", "down", or a positive number',
    }),
  };

  async run(): Promise<void> {
    if (!this.flags.name && !this.flags.pos) {
      this.error("Provide at least one of --name or --pos");
    }

    const isRelativeMove = this.flags.pos === "up" || this.flags.pos === "down";

    // Always fetch checklists when doing a relative move (need positions to compute midpoint).
    // Also fetch when either flag is a name rather than a raw ID.
    const needsFetch =
      isRelativeMove ||
      !/^[a-f0-9]{24}$/.test(this.flags.checklist) ||
      !/^[a-f0-9]{24}$/.test(this.flags.item);

    let itemId: string;
    let computedPos: string | number | undefined;

    if (needsFetch) {
      const checklists = (await this.client.cards.getCardChecklists({ id: this.lookups.card })) as any[];

      // Resolve the checklist
      const targetChecklist = checklists.find(
        (cl: any) => cl.name === this.flags.checklist || cl.id === this.flags.checklist,
      );
      if (!targetChecklist) {
        this.error(`No checklist found matching "${this.flags.checklist}"`);
      }

      // Resolve the item within that checklist
      let targetItem: any;
      if (/^[a-f0-9]{24}$/.test(this.flags.item)) {
        targetItem = targetChecklist.checkItems.find((ci: any) => ci.id === this.flags.item);
      } else {
        targetItem = targetChecklist.checkItems.find((ci: any) => ci.name === this.flags.item);
      }
      if (!targetItem) {
        this.error(`No checklist item found with name "${this.flags.item}"`);
      }
      itemId = targetItem.id;

      // Compute position for relative moves
      if (isRelativeMove) {
        computedPos = this.computeRelativePos(
          targetChecklist.checkItems,
          targetItem,
          this.flags.pos as "up" | "down",
        );
      }
    } else {
      // Both flags were raw IDs and pos is not relative — skip all fetching
      itemId = this.flags.item;
    }

    // Build the update payload — only include fields the caller actually specified
    const payload: Record<string, any> = {
      id:          this.lookups.card,
      idCheckItem: itemId,
    };

    if (this.flags.name) {
      payload.name = this.flags.name;
    }

    if (this.flags.pos !== undefined) {
      payload.pos = computedPos !== undefined ? computedPos : this.parsePos(this.flags.pos);
    }

    const result = await this.client.cards.updateCardCheckItem(payload as any);
    this.output(result);
  }

  // Computes a new fractional position so the item slots between its neighbours
  // after a relative move. Trello uses floating-point positions, so inserting a
  // midpoint value avoids collisions without reordering other items.
  private computeRelativePos(
    items: any[],
    target: any,
    direction: "up" | "down",
  ): number {
    // Sort ascending so index reflects visual order in the checklist
    const sorted = [...items].sort((a, b) => a.pos - b.pos);
    const idx = sorted.findIndex((ci) => ci.id === target.id);

    if (direction === "up") {
      if (idx === 0) this.error("Item is already at the top of the checklist");
      const prev = sorted[idx - 1];
      // No item before prev: halve prev's position to land before it
      if (idx === 1) return prev.pos / 2;
      // Otherwise: midpoint between the two items that bracket the target slot
      return (sorted[idx - 2].pos + prev.pos) / 2;
    } else {
      if (idx === sorted.length - 1) this.error("Item is already at the bottom of the checklist");
      const next = sorted[idx + 1];
      // No item after next: add a fixed increment to land after it
      if (idx === sorted.length - 2) return next.pos + 1000;
      // Otherwise: midpoint between next and the item after it
      return (next.pos + sorted[idx + 2].pos) / 2;
    }
  }

  // Trello accepts "top"/"bottom" as strings and any positive float as a number.
  // Relative moves ("up"/"down") are resolved before this is called.
  private parsePos(pos: string): string | number {
    if (pos === "top" || pos === "bottom") return pos;
    const n = parseFloat(pos);
    if (isNaN(n)) this.error(`Invalid --pos value "${pos}". Use "top", "bottom", "up", "down", or a number.`);
    return n;
  }

  protected toData(data: any) {
    return {
      id:    data.id,
      name:  data.name,
      state: data.state,
      pos:   data.pos,
    };
  }
}
