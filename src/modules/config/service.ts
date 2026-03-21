import fs from "fs";
import path from "path";
import { z } from "zod";
import { ConfigSchema, type ConfigType } from "./schema.js";

const CONFIG_FILE_NAMES = [".bunxrayrc.json", "bunxray.config.json"];

export function loadConfig(cwd?: string): ConfigType | null {
  const dir = cwd ?? process.cwd();

  for (const name of CONFIG_FILE_NAMES) {
    const filePath = path.resolve(dir, name);
    if (!fs.existsSync(filePath)) continue;

    const raw = fs.readFileSync(filePath, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON in ${name}`);
    }
    const result = ConfigSchema.safeParse(parsed);
    if (!result.success) {
      const tree = z.treeifyError(result.error);
      throw new Error(
        `Invalid config in ${name}:\n${JSON.stringify(tree, null, 2)}`,
      );
    }
    return result.data;
  }

  return null;
}
