import { BaseCommand } from "../../BaseCommand";

export default class BoardList extends BaseCommand<typeof BoardList> {
  static description = "List all boards that you have access to";

  protected defaultOutput: string = "fancy";

  async run(): Promise<void> {
    const boards = await this.client.members.getMemberBoards({
      id: "me",
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
