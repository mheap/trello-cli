import { Command, Flags, Interfaces } from "@oclif/core";
import Config from "@trello-cli/config";
import Cache from "@trello-cli/cache";
import * as path from "path";
import { TrelloClient } from "trello.js";

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  typeof BaseCommand["globalFlags"] & T["flags"]
>;

export abstract class BaseCommand<T extends typeof Command> extends Command {
  // add the --json flag
  static enableJsonFlag = true;

  // define flags that can be inherited by any command that extends BaseCommand
  static globalFlags = {};

  protected flags!: Flags<T>;

  protected trelloConfig: Config;
  protected cache!: Cache;
  protected client!: TrelloClient;

  protected profile: string;
  protected configDir: string;

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
    } catch (e: any) {
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
