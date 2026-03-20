import fs from "fs";
import path from "path";
import type { ModuleType } from "../shared/types.js";

export function xray(dirPath: string): ModuleType[] {
  const modules: ModuleType[] = [];
  walk(dirPath, dirPath, modules);
  return modules;
}

function walk(base: string, dir: string, out: ModuleType[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(base, full, out);
    } else if (entry.isFile()) {
      out.push({
        path: path.relative(base, full),
        size: fs.statSync(full).size,
      });
    }
  }
}
