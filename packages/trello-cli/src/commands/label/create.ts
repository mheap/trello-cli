import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class LabelCreate extends BaseCommand<typeof LabelCreate> {
  static description = "Create a label on a board";

  static flags = {
    board: Flags.string({ required: true }),
    name: Flags.string({ char: "n", required: true }),
    color: Flags.option({
      required: true,
      options: [
        "green",
        "yellow",
        "orange",
        "red",
        "purple",
        "blue",
        "sky",
        "lime",
        "pink",
        "black",
      ] as const,
    })(),
  };

  async run(): Promise<void> {
    const label = await this.client.boards.createBoardLabel({
      id: this.lookups.board,
      name: this.flags.name,
      color: this.flags.color,
    });

    await this.cache.sync();

    this.output(label);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      color: data.color,
    };
  }
}
