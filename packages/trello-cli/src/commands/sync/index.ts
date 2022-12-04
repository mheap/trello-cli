import { BaseCommand } from "../../BaseCommand";

export default class SyncIndex extends BaseCommand<typeof SyncIndex> {
  static description = "Build a local cache of name to ID mappings";

  async run(): Promise<void> {
    await this.cache.bootstrap();
    await this.cache.sync();
    this.output("Sync complete");
  }
}
