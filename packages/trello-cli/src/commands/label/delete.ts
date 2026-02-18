import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class LabelDelete extends BaseCommand<typeof LabelDelete> {
  static description = "Delete a label";

  static flags = {
    board: Flags.string({ required: true }),
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
    text: Flags.string({
      description:
        "Label text to match when multiple labels share the same color",
    }),
  };

  async run(): Promise<void> {
    const labelId = await this.cache.getLabelIdByBoardAndColor(
      this.lookups.board,
      this.flags.color,
      this.flags.text,
    );

    await this.client.labels.deleteLabel({ id: labelId });
    await this.cache.sync();
  }
}
