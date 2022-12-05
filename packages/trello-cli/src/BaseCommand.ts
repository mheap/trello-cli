import { Command, Flags, Interfaces } from "@oclif/core";
import Config from "@trello-cli/config";
import Cache from "@trello-cli/cache";
import * as path from "path";
import { TrelloClient } from "trello.js";
import { parse } from "json2csv";
import { run } from "./index";

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  typeof BaseCommand["globalFlags"] & T["flags"]
>;

type Lookup = {
  board: string;
  list: string;
};

export abstract class BaseCommand<T extends typeof Command> extends Command {
  // define flags that can be inherited by any command that extends BaseCommand
  static globalFlags = {
    format: Flags.enum({
      options: ["default", "silent", "json", "csv"],
      default: "default",
      description: "Output format",
    }),
  };

  protected defaultOutput: string = "silent";

  protected flags!: Flags<T>;

  protected trelloConfig: Config;
  protected cache!: Cache;
  protected client!: TrelloClient;

  protected profile: string;
  protected configDir: string;

  protected lookups: Lookup = {
    board: "!!! Missing --board Flag !!!",
    list: "!!! Missing --list Flag !!!",
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
    const { flags } = await this.parse(
      this.constructor as Interfaces.Command.Class
    );
    this.flags = flags;

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
    } catch (e: any) {
      // If we're in debug mode, don't show how to generate credentials
      if (this.id == "debug") {
        return;
      }

      let cmd = `./bin/run`;
      if (process.env.TRELLO_CLI_PROFILE) {
        cmd = `TRELLO_CLI_PROFILE=${process.env.TRELLO_CLI_PROFILE} ${cmd}`;
      }

      let message = e.message || e;
      if (e.code == "ERR_NO_APP_KEY") {
        this.warn(
          `Visit ${e.data.url} to get an API key then run ${cmd} auth:api-key YOUR_API_KEY`
        );
      } else if (e.code == "ERR_NO_TOKEN") {
        this.warn(e.message);
        this.logToStderr(
          `\nVisit ${e.data.url} to generate a token.\n\nRun ${cmd} auth:set YOUR_TOKEN`
        );
      } else {
        this.warn(message);
      }
      this.exit(1);
    }
  }

  protected output(data: any) {
    let format = this.flags.format;
    if (this.flags.format == "default") {
      format = this.defaultOutput;
    }

    if (format == "silent") {
      return;
    }

    const d = this.toData(data);
    if (format == "json") {
      return this.log(JSON.stringify(d, null, 2));
    }
    if (format == "csv") {
      return this.log(this.outputCsv(d));
    }

    if (format == "fancy") {
      return this.log(this.format(d));
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

  protected format(data: any): string {
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
