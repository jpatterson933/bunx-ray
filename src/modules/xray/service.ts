import fs from "fs";
import path from "path";
import { ModuleSchema, type ModuleType } from "../shared/schema.js";

export function xray(dirPath: string): ModuleType[] {
  return fs
    .readdirSync(dirPath, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => {
      const full = path.join(e.parentPath, e.name);
      return ModuleSchema.parse({
        path: path.relative(dirPath, full),
        size: fs.statSync(full).size,
      });
    });
}
