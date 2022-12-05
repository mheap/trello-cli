import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class BoardDelete extends BaseCommand<typeof BoardDelete> {
  static description = "Delete a board";

  static flags = {
    id: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(BoardDelete);

    await this.client.boards.deleteBoard({
      id: flags.id,
    });

    // Sync after removing a board
    await this.cache.sync();
  }
}
