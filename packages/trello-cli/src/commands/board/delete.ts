import { BaseCommand } from "../../BaseCommand";
import { boardSelectorFlags } from "../../selectors";

export default class BoardDelete extends BaseCommand<typeof BoardDelete> {
  static description = "Delete a board";
  static selectorTarget = "board" as const;

  static flags = {
    ...boardSelectorFlags(),
  };

  async run(): Promise<void> {
    await this.client.boards.deleteBoard({
      id: this.lookups.board,
    });

    // Sync after removing a board
    await this.cache.sync();
  }
}
