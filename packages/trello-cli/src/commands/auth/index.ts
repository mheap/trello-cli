import { BaseCommand } from "../../BaseCommand";

export default class AuthIndex extends BaseCommand<typeof AuthIndex> {
  static description = "Manage authentication credentials";

  async run(): Promise<void> {
    this.log("Please run auth:set");
  }
}
