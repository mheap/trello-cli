import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class Move extends BaseCommand<typeof Move> {
  static description = "Move a card";

  static flags = {
    card: Flags.string({ required: true }),
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
    to: Flags.string({ required: true }),
    position: Flags.enum({ options: ["top", "bottom"], default: "bottom" }),
  };

  async run(): Promise<void> {
    const to = await this.cache.getListIdByBoardAndName(
      this.lookups.board,
      this.flags.to
    );

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
