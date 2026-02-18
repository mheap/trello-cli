import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class ListRename extends BaseCommand<typeof ListRename> {
  static description = "Rename a list";

  static flags = {
    board: Flags.string({ required: true }),
    list: Flags.string({ required: true }),
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
