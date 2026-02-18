import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class BoardShow extends BaseCommand<typeof BoardShow> {
  static description = "Show board details";

  protected defaultOutput = "fancy" as const;

  static flags = {
    board: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const board = await this.client.boards.getBoard({
      id: this.lookups.board,
    });
    this.output(board);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      description: data.desc,
      url: data.url,
      closed: data.closed,
      shortLink: data.shortLink,
    };
  }

  protected async format(data: any): Promise<string> {
    const lines = [
      `Name: ${data.name}`,
      `ID: ${data.id}`,
      `URL: ${data.url}`,
      `Status: ${data.closed ? "Closed" : "Open"}`,
      `Description: ${data.description || "None"}`,
    ];
    return lines.join("\n");
  }
}
