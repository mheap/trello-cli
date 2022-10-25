import { Command } from "@oclif/core";
import auth from "trello-auth";

export default class AuthSet extends Command {
  static description = "Set authentication details";

  static args = [{ name: "token", required: true }];

  async run(): Promise<void> {
    const { args } = await this.parse(AuthSet);

    auth.setToken(args.token);
    this.log("Token updated");
  }
}
