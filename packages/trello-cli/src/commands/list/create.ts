import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class ListCreate extends BaseCommand<typeof ListCreate> {
  static description = "Create a new list";

  static flags = {
    name: Flags.string({ char: "n", required: true }),
    position: Flags.enum({ options: ["top", "bottom"], default: "top" }),
    board: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const board = await this.client.lists.createList({
      idBoard: this.lookups.board,
      name: this.flags.name,
      pos: this.flags.position as any,
    });

    // Sync after adding a new list
    await this.cache.sync();

    this.output(board);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      desc: data.desc,
      url: data.url,
    };
  }
}
