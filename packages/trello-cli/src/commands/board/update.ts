import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class BoardUpdate extends BaseCommand<typeof BoardUpdate> {
  static description = "Update a board";

  static flags = {
    board: Flags.string({ required: true }),
    name: Flags.string({ char: "n" }),
    description: Flags.string(),
  };

  async run(): Promise<void> {
    const updates: Record<string, any> = { id: this.lookups.board };

    if (this.flags.name) updates.name = this.flags.name;
    if (this.flags.description !== undefined) updates.desc = this.flags.description;

    if (Object.keys(updates).length <= 1) {
      this.warn("No update flags provided. Use --name or --description.");
      this.exit(1);
    }

    const board = await this.client.boards.updateBoard(updates as any);
    await this.cache.sync();
    this.output(board);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      desc: data.desc,
      url: data.url,
      closed: data.closed,
    };
  }
}
