import { BaseCommand } from "../../BaseCommand";

export default class BoardIndex extends BaseCommand<typeof BoardIndex> {
  static description = "Board related commands";

  async run(): Promise<void> {
    this.output("Boards");
  }
}
