import { Args } from "@oclif/core";
import { BaseCommand } from "../../BaseCommand";

export default class AuthToken extends BaseCommand<typeof AuthToken> {
  static description = "Set the Trello API token (used to call the API)";
  protected defaultOutput = "raw" as const;

  static args = {
    token: Args.string({ required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(AuthToken);

    this.trelloConfig.setToken(args.token);

    this.output(
      `Token updated. Run ${this.config.bin} sync to update your local cache`
    );
  }
}
