import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class CardCheckItem extends BaseCommand<typeof CardCheckItem> {
  static description = "Update a checklist item on a card";

  static flags = {
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
    card: Flags.string({ required: true }),
    checklist: Flags.string({
      description:
        "Checklist name or ID to narrow item lookup when multiple checklists share the same item name",
    }),
    item: Flags.string({ required: true }),
    state: Flags.option({
      required: true,
      options: ["complete", "incomplete"] as const,
    })(),
  };

  async run(): Promise<void> {
    const resolved = await this.resolveCheckItem(
      this.lookups.card,
      this.flags.item,
      this.flags.checklist,
    );

    const result = await this.client.cards.updateCardCheckItem({
      id: this.lookups.card,
      idCheckItem: resolved.itemId,
      ...(resolved.checklistId && { idChecklist: resolved.checklistId }),
      state: this.flags.state,
    });
    this.output(result);
  }

  private async resolveCheckItem(
    cardId: string,
    item: string,
    checklist?: string,
  ): Promise<{ itemId: string; checklistId?: string }> {
    // If the item looks like a Trello ID already, use it directly
    if (/^[a-f0-9]{24}$/.test(item)) {
      const checklistId =
        checklist && /^[a-f0-9]{24}$/.test(checklist) ? checklist : undefined;
      return { itemId: item, checklistId };
    }

    const checklists = (await this.client.cards.getCardChecklists({
      id: cardId,
    })) as any[];

    // Optionally filter to a specific checklist
    const scope = checklist
      ? checklists.filter(
          (cl: any) => cl.name === checklist || cl.id === checklist,
        )
      : checklists;

    if (checklist && scope.length === 0) {
      this.error(`No checklist found matching "${checklist}"`);
    }

    const matches = scope.flatMap((cl: any) =>
      (cl.checkItems ?? [])
        .filter((ci: any) => ci.name === item)
        .map((ci: any) => ({ itemId: ci.id, checklistId: cl.id })),
    );

    if (matches.length === 0) {
      this.error(`No check item found with name "${item}"`);
    }

    if (matches.length > 1) {
      this.error(
        `Multiple check items found with name "${item}". Use --checklist to disambiguate.`,
      );
    }

    return matches[0];
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      state: data.state,
    };
  }
}
