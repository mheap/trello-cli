import { BaseCommand } from "../../BaseCommand";

export default class AuthToken extends BaseCommand<typeof AuthToken> {
  static description = "Set the Trello API token (used to call the API)";
  protected defaultOutput: string = "raw";

  static args = [{ name: "token", required: true }];

  async run(): Promise<void> {
    const { args } = await this.parse(AuthToken);

    this.trelloConfig.setToken(args.token);

    this.output(
      `Token updated. Run ${this.config.bin} sync to update your local cache`
    );
  }
}
