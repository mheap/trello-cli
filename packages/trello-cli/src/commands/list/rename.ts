import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";
import { listSelectorFlags } from "../../selectors";

export default class ListRename extends BaseCommand<typeof ListRename> {
  static description = "Rename a list";
  static selectorTarget = "list" as const;

  static flags = {
    ...listSelectorFlags(),
    name: Flags.string({ char: "n", required: true }),
  };

  async run(): Promise<void> {
    const result = await this.client.lists.updateList({
      id: this.lookups.list,
      name: this.flags.name,
    });

    await this.cache.sync();

    this.output(result);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
    };
  }
}
