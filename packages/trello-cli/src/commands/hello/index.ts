import { BaseCommand } from "../../BaseCommand";

export default class HelloIndex extends BaseCommand<typeof HelloIndex> {
  static description = "Test Command";

  async run(): Promise<void> {
    this.log("This is some output");
  }
}
