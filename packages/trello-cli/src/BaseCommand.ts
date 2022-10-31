import { Command, Flags, Interfaces } from "@oclif/core";
import Config from "@trello-cli/config";

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  typeof BaseCommand["globalFlags"] & T["flags"]
>;

export abstract class BaseCommand<T extends typeof Command> extends Command {
  // add the --json flag
  static enableJsonFlag = true;

  // define flags that can be inherited by any command that extends BaseCommand
  static globalFlags = {};

  protected flags!: Flags<T>;

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
      Config.getToken();
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
      } else if (e.code == "ERR_NO_AUTH_TOKEN") {
        this.warn(e.message);
        this.logToStderr(
          `\nVisit ${e.data.authenticationUrl} to generate a token.\n\nRun ${cmd} auth:set YOUR_API_KEY`
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
