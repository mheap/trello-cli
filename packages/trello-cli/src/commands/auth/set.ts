import { BaseCommand } from "../../BaseCommand";

export default class AuthSet extends BaseCommand<typeof AuthSet> {
  static description = "Set authentication details";

  static args = [{ name: "token", required: true }];

  async run(): Promise<void> {
    const { args } = await this.parse(AuthSet);

    this.trelloConfig.setToken(args.token);
    this.log("Token updated");
  }
}
