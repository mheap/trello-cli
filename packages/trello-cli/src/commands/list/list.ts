import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class ListList extends BaseCommand<typeof ListList> {
  static description = "List all boards that you have access to";

  protected defaultOutput: string = "fancy";

  static flags = {
    board: Flags.string({ required: true }),
    filter: Flags.enum({
      options: ["all", "closed", "none", "open"],
      default: "open",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ListList);
    const boards = await this.client.boards.getBoardLists({
      id: flags.board,
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

  protected format(data: any): string {
    return data
      .map((b: any) => {
        return `${b.name} (ID: ${b.id})`;
      })
      .join("\n");
  }
}
