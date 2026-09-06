import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";
import { cardSelectorFlags } from "../../selectors";

export default class Move extends BaseCommand<typeof Move> {
  static description = "Move a card";
  static selectorTarget = "card" as const;

  static flags = {
    ...cardSelectorFlags(),
    to: Flags.string({
      required: true,
      description: "The destination list name or ID",
    }),
    position: Flags.option({ options: ["top", "bottom"] as const, default: "bottom" })(),
  };

  async run(): Promise<void> {
    const to = this.flags.board
      ? await this.cache.getListIdByBoardAndName(
        this.lookups.board,
        this.flags.to
      )
      : this.flags.to;

    const card = await this.client.cards.updateCard({
      id: this.lookups.card,
      idList: to,
      pos: this.flags.position as "top" | "bottom",
    });

    this.output(card);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      due: data.due,
      description: data.desc,
      labels: data.labels,
      url: data.url,
    };
  }
}
