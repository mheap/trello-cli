import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class BoardSetClosed extends BaseCommand<typeof BoardSetClosed> {
  static description = "Change a board's 'closed' status";

  static flags = {
    board: Flags.string({ required: true, description: "The board's ID" }),
    open: Flags.boolean({
      default: false,
      description: "Set the board status to `closed: false`",
    }),
  };

  async run(): Promise<void> {
    const board = await this.client.boards.updateBoard({
      id: this.lookups.board,
      closed: !this.flags.open,
    });

    // Sync after closing a board
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
