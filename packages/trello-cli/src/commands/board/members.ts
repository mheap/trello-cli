import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class BoardMembers extends BaseCommand<typeof BoardMembers> {
  static description = "List board members";

  protected defaultOutput = "fancy" as const;

  static flags = {
    board: Flags.string({ required: true }),
  };

  async run(): Promise<void> {
    const members = await this.client.boards.getBoardMembers({
      id: this.lookups.board,
    });
    this.output(members);
  }

  protected toData(data: any) {
    return data.map((m: any) => ({
      id: m.id,
      username: m.username,
      fullName: m.fullName,
    }));
  }

  protected async format(data: any): Promise<string> {
    return data
      .map((m: any) => `${m.username} (${m.fullName})`)
      .join("\n");
  }
}
