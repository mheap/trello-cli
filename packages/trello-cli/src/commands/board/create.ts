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
    const { flags } = await this.parse(BoardCreate);

    const board = await this.client.boards.createBoard({
      name: flags.name,
      desc: flags.description,
      defaultLists: !flags.skipDefaultLists, // Add them by default
      idOrganization: flags.org,
      prefs: {
        cardAging: flags.aging ? "pirate" : "regular",
        cardCovers: flags.coverImages,
        permissionLevel: flags.permissionLevel as "org" | "private" | "public",
        selfJoin: flags.selfJoin,
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
