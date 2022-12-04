import { BaseCommand } from "../../BaseCommand";

export default class HelloIndex extends BaseCommand<typeof HelloIndex> {
  static description = "Test Command";

  async run(): Promise<void> {
    this.output([
      {
        message: "This is some output",
        value: 123,
      },
      {
        message: "And another",
        value: 999,
      },
    ]);
  }
}
