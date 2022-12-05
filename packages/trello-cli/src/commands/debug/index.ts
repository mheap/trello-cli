import { BaseCommand } from "../../BaseCommand";

export default class DebugIndex extends BaseCommand<typeof DebugIndex> {
  static description = "Debug your installation";
  protected defaultOutput: string = "json";

  async run(): Promise<void> {
    let validCredentials = false;
    try {
      const trelloMember = await this.client.members.getMember({
        id: "me",
      });
      validCredentials = true;
    } catch (e) {}

    const config = {
      configDirectory: this.configDir,
      profile: this.profile,
      authType: process.env.TRELLO_TOKEN ? "environment" : "config",
      validCredentials,
    };
    this.output(config);
  }
}
