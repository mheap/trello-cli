import { BaseCommand } from "../../BaseCommand";
import { listSelectorFlags } from "../../selectors";

export default class ListArchive extends BaseCommand<typeof ListArchive> {
  static description = "Archive a list";
  static selectorTarget = "list" as const;

  static flags = {
    ...listSelectorFlags(),
  };

  async run(): Promise<void> {
    await this.client.lists.updateList({
      id: this.lookups.list,
      closed: true,
    });
  }
}
