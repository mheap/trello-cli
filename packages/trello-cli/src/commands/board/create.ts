import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class BoardCreate extends BaseCommand<typeof BoardCreate> {
  static description = "Create a new board";

  static flags = {
    name: Flags.string({ char: "n", required: true }),
    description: Flags.string({ char: "d" }),
    aging: Flags.boolean(),
    coverImages: Flags.boolean(),
    skipDefaultLists: Flags.boolean(),
    org: Flags.string(),
    permissionLevel: Flags.enum({ options: ["org", "private", "public"] }),
    selfJoin: Flags.boolean(),
  };

  async run(): Promise<void> {
    const board = await this.client.boards.createBoard({
      name: this.flags.name,
      desc: this.flags.description,
      defaultLists: !this.flags.skipDefaultLists, // Add them by default
      idOrganization: this.flags.org,
      prefs: {
        cardAging: this.flags.aging ? "pirate" : "regular",
        cardCovers: this.flags.coverImages,
        permissionLevel: this.flags.permissionLevel as
          | "org"
          | "private"
          | "public",
        selfJoin: this.flags.selfJoin,
      },
    });

    // Sync after adding a new board
    await this.cache.sync();

    this.output(board);
  }

  protected toData(data: any) {
    return {
      id: data.id,
      name: data.name,
      desc: data.desc,
      url: data.url,
    };
  }
}
