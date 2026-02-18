import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class LabelList extends BaseCommand<typeof LabelList> {
  static description = "List all labels on a board";

  protected defaultOutput = "fancy" as const;

  static flags = {
    board: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const labels = await this.client.boards.getBoardLabels({
      id: this.lookups.board,
    });
    this.output(labels);
  }

  protected toData(data: any) {
    return data
      .filter((l: any) => l.name)
      .map((l: any) => ({
        id: l.id,
        name: l.name,
        color: l.color,
      }));
  }

  protected async format(data: any): Promise<string> {
    return data
      .map((l: any) => `[${l.color}] ${l.name} (ID: ${l.id})`)
      .join("\n");
  }
}
