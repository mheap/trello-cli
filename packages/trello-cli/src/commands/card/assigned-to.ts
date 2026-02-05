import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class AssignedTo extends BaseCommand<typeof AssignedTo> {
  static description = "Show all cards assigned to a user (default 'me')";

  protected defaultOutput = "fancy" as const;

  static flags = {
    user: Flags.string({ default: "me" }),
  };

  async run(): Promise<void> {
    const cards = await this.client.members.getMemberCards({
      id: this.lookups.user,
    });
    this.output(cards);
  }

  protected toData(data: any) {
    return data;
  }

  protected async format(data: any): Promise<string> {
    return (
      await Promise.all(
        data.map(async (b: any) => {
          const board = await this.cache.getBoard(b.idBoard);
          const list = await this.cache.getList(b.idList);
          return `${b.name} (ID: ${b.id}, Board: ${board}, List: ${list})`;
        })
      )
    ).join("\n");
  }
}
