import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class LabelUpdate extends BaseCommand<typeof LabelUpdate> {
  static description =
    "Update a label's text. Creates the label if no matching color exists on the board.";

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
    name: Flags.string({
      char: "n",
      required: true,
      description: "New label name",
    }),
    "old-name": Flags.string({
      description:
        "Existing label name to match when multiple labels share the same color",
    }),
  };

  async run(): Promise<void> {
    const labels = await this.cache.getLabelsByBoardAndColor(
      this.lookups.board,
      this.flags.color,
    );

    let result: any;

    if (labels.length === 0) {
      // No label with this color exists — create one
      result = await this.client.boards.createBoardLabel({
        id: this.lookups.board,
        name: this.flags.name,
        color: this.flags.color,
      });
    } else if (labels.length === 1) {
      // Exactly one match — update it
      result = await this.client.labels.updateLabel({
        id: labels[0].id,
        name: this.flags.name,
      });
    } else {
      // Multiple labels with the same color — need --old-name to disambiguate
      if (!this.flags["old-name"]) {
        throw new Error(
          `Multiple labels with color [${this.flags.color}] found on board. Use --old-name to disambiguate.`,
        );
      }

      const match = labels.filter((l) => l.name === this.flags["old-name"]);
      if (match.length === 0) {
        throw new Error(
          `No label with color [${this.flags.color}] and name [${this.flags["old-name"]}] found on board.`,
        );
      }
      if (match.length > 1) {
        throw new Error(
          `Multiple labels with color [${this.flags.color}] and name [${this.flags["old-name"]}] found on board.`,
        );
      }

      result = await this.client.labels.updateLabel({
        id: match[0].id,
        name: this.flags.name,
      });
    }

    await this.cache.sync();

    this.output(result);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      color: data.color,
    };
  }
}
