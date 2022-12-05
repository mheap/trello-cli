import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class BoardClose extends BaseCommand<typeof BoardClose> {
  static description = "Create a new board";

  static flags = {
    id: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(BoardClose);

    const board = await this.client.boards.updateBoard({
      id: flags.id,
      closed: true
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
      closed: data.closed
    };
  }
}
