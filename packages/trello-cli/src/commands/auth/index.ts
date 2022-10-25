import { Command } from "@oclif/core";

export default class AuthIndex extends Command {
  static description = "Manage authentication credentials";

  async run(): Promise<void> {
    this.log("Please run auth:set");
  }
}
