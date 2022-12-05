import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class ListArchive extends BaseCommand<typeof ListArchive> {
  static description = "Archive a list";

  static flags = {
    id: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    await this.client.lists.updateList({
      id: this.flags.id,
      closed: true,
    });
  }
}
