import { Args } from "@oclif/core";
import { BaseCommand } from "../../BaseCommand";
import { run } from "../../index";

export default class AuthApiKey extends BaseCommand<typeof AuthApiKey> {
  static description = "Set the Trello API key (used to generate a token)";
  protected defaultOutput = "raw" as const;

  static args = {
    api_key: Args.string({ required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(AuthApiKey);

    this.trelloConfig.setApiKey(args.api_key);
    this.output("✅ API Key set\n");

    // Run the CLI again to show the next step
    await run(["auth"]);
  }
}
