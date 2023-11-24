import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class BoardDelete extends BaseCommand<typeof BoardDelete> {
  static description = "Delete a board";

  static flags = {
    board: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    await this.client.boards.deleteBoard({
      id: this.lookups.board,
    });

    // Sync after removing a board
    await this.cache.sync();
  }
}
