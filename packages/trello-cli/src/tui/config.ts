import * as fs from "fs";
import * as path from "path";
import { TuiConfig, DEFAULT_TUI_CONFIG } from "./types";

export function loadTuiConfig(configDir: string): TuiConfig {
  const configPath = path.join(configDir, "tui.json");

  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_TUI_CONFIG };
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const userConfig = JSON.parse(raw);
    return {
      ...DEFAULT_TUI_CONFIG,
      ...userConfig,
      theme: {
        ...DEFAULT_TUI_CONFIG.theme,
        ...(userConfig.theme || {}),
      },
    };
  } catch {
    return { ...DEFAULT_TUI_CONFIG };
  }
}

export function saveTuiConfig(configDir: string, config: TuiConfig): void {
  const configPath = path.join(configDir, "tui.json");

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
