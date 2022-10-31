import { BaseCommand } from "../../BaseCommand";
import config from "@trello-cli/config";

export default class AuthSet extends BaseCommand<typeof AuthSet> {
  static description = "Set authentication details";

  static args = [{ name: "token", required: true }];

  async run(): Promise<void> {
    const { args } = await this.parse(AuthSet);

    config.setToken(args.token);
    this.log("Token updated");
  }
}
