import { BaseCommand } from "../../BaseCommand";
import config from "@trello-cli/config";

export default class AuthApiKey extends BaseCommand<typeof AuthApiKey> {
  static description = "Set authentication details";

  static args = [{ name: "api_key", required: true }];

  async run(): Promise<void> {
    const { args } = await this.parse(AuthApiKey);

    config.setApiKey(args.api_key);
    this.log("API Key set");
  }
}
