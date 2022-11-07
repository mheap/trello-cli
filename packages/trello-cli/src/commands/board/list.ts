import { BaseCommand } from "../../BaseCommand";

export default class BoardList extends BaseCommand<typeof BoardList> {
  static description = "List all boards that you have access to";

  async run(): Promise<void> {
    const boards = await this.client.members.getMemberBoards({
      id: "me",
    });
    this.log(this.format(boards));
  }

  format(data: any) {
    return data
      .map((b: any) => {
        return `${b.name} (ID: ${b.id})`;
      })
      .join("\n");
  }
}
