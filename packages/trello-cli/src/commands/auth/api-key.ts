import { BaseCommand } from "../../BaseCommand";

export default class AuthApiKey extends BaseCommand<typeof AuthApiKey> {
  static description = "Set the Trello API key (used to generate a token)";

  static args = [{ name: "api_key", required: true }];

  async run(): Promise<void> {
    const { args } = await this.parse(AuthApiKey);

    this.trelloConfig.setApiKey(args.api_key);
    this.output("API Key set");
  }
}
