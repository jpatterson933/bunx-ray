import fs from "fs";
import path from "path";
import { CONFIG_FILE_NAMES } from "./constants.js";
import { ConfigSchema, type ConfigType } from "./types.js";

export function loadConfig(cwd?: string): ConfigType | null {
  const dir = cwd ?? process.cwd();

  for (const name of CONFIG_FILE_NAMES) {
    const filePath = path.resolve(dir, name);
    if (!fs.existsSync(filePath)) continue;

    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return ConfigSchema.parse(parsed);
  }

  return null;
}
