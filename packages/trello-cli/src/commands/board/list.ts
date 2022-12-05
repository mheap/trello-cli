import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class BoardList extends BaseCommand<typeof BoardList> {
  static description = "List all boards that you have access to";

  protected defaultOutput: string = "fancy";

  static flags = {
    filter: Flags.enum({
      options: [
        "all",
        "closed",
        "members",
        "open",
        "organization",
        "public",
        "starred",
      ],
      default: "open",
    }),
  };

  async run(): Promise<void> {
    const boards = await this.client.members.getMemberBoards({
      id: "me",
      filter: this.flags.filter,
    });
    this.output(boards);
  }

  protected toData(data: any) {
    return data.map((d: any) => {
      return {
        id: d.id,
        name: d.name,
        desc: d.desc,
        url: d.url,
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
