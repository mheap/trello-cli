import { Command, Flags } from "@oclif/core";
import Config from "@trello-cli/config";
import Cache from "@trello-cli/cache";
import * as path from "path";
import { TrelloClient } from "trello.js";
import { render } from "ink";
import React from "react";
import { App } from "../tui/App";
import { loadTuiConfig } from "../tui/config";

export default class Interactive extends Command {
  static description = "Launch interactive terminal UI for Trello";

  static examples = [
    "$ trello interactive",
    "$ trello interactive --mouse",
    "$ trello interactive --no-mouse",
  ];

  static flags = {
    mouse: Flags.boolean({
      description: "Enable mouse support (default: from tui.json config)",
      allowNo: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Interactive);

    const homeDir =
      process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"];
    const configDir = path.join(homeDir!, ".trello-cli");
    const profile = process.env.TRELLO_CLI_PROFILE || "default";

    const trelloConfig = new Config(configDir, profile);

    let token: string;
    let appKey: string;

    try {
      token = await trelloConfig.getToken();
      appKey = await trelloConfig.getApiKey();
    } catch (e: any) {
      const message = e.message || e;
      if (e.code === "ERR_NO_APP_KEY") {
        this.warn(
          `Visit ${e.data.url} to get an API key then run 'trello auth:api-key YOUR_API_KEY'`
        );
      } else if (e.code === "ERR_NO_TOKEN") {
        this.warn(e.message);
        this.logToStderr(
          `\nVisit ${e.data.url} to generate a token\n\nNext, run 'trello auth:token YOUR_TOKEN'`
        );
      } else {
        this.warn(message);
      }
      this.exit(1);
      return;
    }

    const client = new TrelloClient({
      key: appKey,
      token: token,
    });

    const cache = new Cache(
      path.join(configDir, profile),
      appKey,
      token
    );

    // Ensure cache is bootstrapped
    await cache.bootstrap();

    // Load TUI config
    const tuiConfig = loadTuiConfig(configDir);

    // Apply mouse flag override
    if (flags.mouse !== undefined) {
      tuiConfig.mouse = flags.mouse;
    }

    const { waitUntilExit } = render(
      <App client={client} cache={cache} config={tuiConfig} />,
    );

    await waitUntilExit();
  }
}
