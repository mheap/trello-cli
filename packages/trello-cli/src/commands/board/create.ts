import { BaseCommand } from "../../BaseCommand";
import { Flags } from "@oclif/core";

export default class BoardCreate extends BaseCommand<typeof BoardCreate> {
  static description = "Create a board";

  static flags = {
    name: Flags.string({ char: "n", required: true }),
    description: Flags.string({ char: "d" }),
    org: Flags.string({
      description:
        "The id or name of the Workspace the board should belong to.",
    }),
    "prefs.permissionLevel": Flags.option({
      options: ["org", "private", "public"] as const,
    })(),
    "prefs.cardAging": Flags.option({ options: ["regular", "pirate"] as const })(),
    "prefs.cardCovers": Flags.boolean({
      description: "Whether card covers should be displayed on this board",
    }),
    "prefs.selfJoin": Flags.boolean({
      description:
        "Determines whether users can join the boards themselves or whether they have to be invited.",
    }),
    defaultLists: Flags.boolean({"default": true}),
  };

  async run(): Promise<void> {
    const board = await this.client.boards.createBoard({
      name: this.flags.name,
      desc: this.flags.description,
      defaultLists: this.flags.defaultLists, // Add them by default
      idOrganization: this.flags.org,
      prefs: {
        cardAging: this.flags["prefs.cardAging"] as "regular" | "pirate",
        cardCovers: this.flags["prefs.cardCovers"],
        permissionLevel: this.flags["prefs.permissionLevel"] as
          | "org"
          | "private"
          | "public",
        selfJoin: this.flags["prefs.selfJoin"],
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
