import { Command, Flags, Interfaces } from "@oclif/core";
import Config from "@trello-cli/config";
import Cache from "@trello-cli/cache";
import * as path from "path";
import { TrelloClient } from "trello.js";
import { parse } from "json2csv";
import { run } from "./index";

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  typeof BaseCommand["baseFlags"] & T["flags"]
>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T["args"]>;

type Lookup = {
  board: string;
  list: string;
  card: string;
  user: string;
};

export abstract class BaseCommand<T extends typeof Command> extends Command {
  // define flags that can be inherited by any command that extends BaseCommand
  static baseFlags = {
    format: Flags.option({
      options: ["default", "silent", "json", "csv"] as const,
      default: "default" as const,
      description: "Output format",
    })(),
  };

  protected defaultOutput: "default" | "silent" | "json" | "csv" | "fancy" | "raw" = "silent";

  protected flags!: Flags<T>;

  protected trelloConfig: Config;
  protected cache!: Cache;
  protected client!: TrelloClient;

  protected profile: string;
  protected configDir: string;

  protected lookups: Lookup = {
    board: "!!! Missing --board Flag !!!",
    list: "!!! Missing --list Flag !!!",
    card: "!!! Missing --card Flag !!!",
    user: "!!! Missing --card Flag !!!",
  };

  constructor(a: any, b: any) {
    super(a, b);

    const homeDir =
      process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
    this.configDir = path.join(homeDir!, ".trello-cli");

    this.profile = process.env.TRELLO_CLI_PROFILE || "default";
    this.trelloConfig = new Config(this.configDir, this.profile);
  }

  public async init(): Promise<void> {
    await super.init();
    const { flags } = await this.parse(this.ctor);
    this.flags = flags as Flags<T>;

    if (this.id?.startsWith("auth:") && this.argv.length) {
      return;
    }

    try {
      const token = await this.trelloConfig.getToken();
      const appKey = await this.trelloConfig.getApiKey();

      this.client = new TrelloClient({
        key: appKey,
        token: token,
      });

      this.cache = new Cache(
        path.join(this.configDir, this.profile),
        appKey,
        token
      );

      // Auto-translate any `board` and `list` entries in this.flags
      if (this.flags.board) {
        this.lookups.board = await this.cache.getBoardIdByName(
          this.flags.board
        );
      }
      if (this.flags.list) {
        this.lookups.list = await this.cache.getListIdByBoardAndName(
          this.lookups.board,
          this.flags.list
        );
      }

      if (this.flags.user) {
        this.lookups.user = await this.cache.getUserIdByName(this.flags.user);
        if (!this.lookups.user) {
          this.lookups.user = this.flags.user;
        }
      }

      if (this.flags.card && this.flags.list) {
        let cards = await this.client.lists.getListCards({
          id: this.lookups.list,
        });

        cards = cards.filter((c) => this.flags.card == c.name);

        if (cards.length > 1) {
          throw new Error(
            `Found multiple cards with the name '${this.flags.card}'`
          );
        }

        if (cards.length < 1) {
          throw new Error(`Found no cards with the name '${this.flags.card}'`);
        }

        this.lookups.card = cards[0].id;
      } else {
        this.lookups.card = this.flags.card;
      }
    } catch (e: any) {
      // If we're in debug mode, don't show how to generate credentials
      if (this.id == "debug") {
        return;
      }

      let cmd = this.config.bin;
      if (process.env.TRELLO_CLI_PROFILE) {
        cmd = `TRELLO_CLI_PROFILE=${process.env.TRELLO_CLI_PROFILE} ${cmd}`;
      }

      let message = e.message || e;
      if (e.code == "ERR_NO_APP_KEY") {
        this.warn(
          `Visit ${e.data.url} to get an API key then run '${cmd} auth:api-key YOUR_API_KEY'`
        );
      } else if (e.code == "ERR_NO_TOKEN") {
        this.warn(e.message);
        this.logToStderr(
          `\nVisit ${e.data.url} to generate a token\n\nNext, run '${cmd} auth:token YOUR_TOKEN'`
        );
      } else {
        this.warn(message);
      }
      this.exit(1);
    }
  }

  protected async output(data: any) {
    let format: string = this.flags.format ?? "default";
    if (format === "default") {
      format = this.defaultOutput;
    }

    if (format == "silent") {
      return;
    }

    const d = await this.toData(data);
    if (format == "json") {
      return this.log(JSON.stringify(d, null, 2));
    }
    if (format == "csv") {
      return this.log(this.outputCsv(d));
    }

    if (format == "fancy") {
      return this.log(await this.format(d));
    }

    // Not user controllable - may be set as the default for a command
    if (format == "raw") {
      return this.log(d);
    }
  }

  protected toData(data: any) {
    return data;
  }

  protected outputCsv(data: any): string {
    let keyEntry = data;
    if (Array.isArray(data)) {
      keyEntry = data[0];
    }
    const fields = Object.keys(keyEntry);
    const opts = { fields };

    return parse(data, opts);
  }

  protected async format(data: any): Promise<string> {
    throw new Error(`format not implemented for [${this.id}]`);
  }

  async run(): Promise<void> {
    await run([this.id!, "--help"]);
  }

  protected async catch(err: Error & { exitCode?: number }): Promise<any> {
    // add any custom logic to handle errors from the command
    // or simply return the parent class error handling
    return super.catch(err);
  }

  protected async finally(_: Error | undefined): Promise<any> {
    // called after run and catch regardless of whether or not the command errored
    return super.finally(_);
  }
}
