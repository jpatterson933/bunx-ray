import fs from "fs";
import path from "path";
import { ConfigSchema, type ConfigType } from "./schema.js";

const CONFIG_FILE_NAMES = [".bunxrayrc.json", "bunxray.config.json"];

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
