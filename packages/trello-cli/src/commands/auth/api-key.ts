import { BaseCommand } from "../../BaseCommand";

export default class AuthApiKey extends BaseCommand<typeof AuthApiKey> {
  static description = "Set authentication details";

  static args = [{ name: "api_key", required: true }];

  async run(): Promise<void> {
    const { args } = await this.parse(AuthApiKey);

    this.trelloConfig.setApiKey(args.api_key);
    this.log("API Key set");
  }
}
