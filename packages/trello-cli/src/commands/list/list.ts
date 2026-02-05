import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class ListList extends BaseCommand<typeof ListList> {
  static description = "Show all lists on a board";

  protected defaultOutput = "fancy" as const;

  static flags = {
    board: Flags.string({ required: true }),
    filter: Flags.option({
      options: ["all", "closed", "none", "open"] as const,
      default: "open",
    })(),
  };

  async run(): Promise<void> {
    const boards = await this.client.boards.getBoardLists({
      id: this.lookups.board,
      filter: this.flags.filter,
    });
    this.output(boards);
  }

  protected toData(data: any) {
    return data.map((d: any) => {
      return {
        id: d.id,
        name: d.name,
      };
    });
  }

  protected format(data: any): Promise<string> {
    return data
      .map((b: any) => {
        return `${b.name} (ID: ${b.id})`;
      })
      .join("\n");
  }
}
