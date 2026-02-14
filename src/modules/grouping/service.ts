import type { ModuleType } from "../shared/types.js";
import { formatSize } from "../utils/service.js";
import type { PackageGroupType } from "./types.js";

function extractPackageName(modulePath: string): string | null {
  const marker = "node_modules/";
  const lastIndex = modulePath.lastIndexOf(marker);
  if (lastIndex === -1) return null;

  const afterNodeModules = modulePath.slice(lastIndex + marker.length);

  if (afterNodeModules.startsWith("@")) {
    const parts = afterNodeModules.split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return afterNodeModules;
  }

  const slashIndex = afterNodeModules.indexOf("/");
  return slashIndex !== -1
    ? afterNodeModules.slice(0, slashIndex)
    : afterNodeModules;
}

export function groupByPackage(modules: ModuleType[]): PackageGroupType[] {
  const groups = new Map<string, { size: number; count: number }>();

  for (const mod of modules) {
    const pkgName = extractPackageName(mod.path);
    if (!pkgName) continue;

    const existing = groups.get(pkgName);
    if (existing) {
      existing.size += mod.size;
      existing.count++;
    } else {
      groups.set(pkgName, { size: mod.size, count: 1 });
    }
  }

  const result: PackageGroupType[] = [];
  for (const [name, { size, count }] of groups) {
    result.push({ name, size, moduleCount: count });
  }

  result.sort((a, b) => b.size - a.size);

  return result;
}

export function renderPackageLines(groups: PackageGroupType[]): string[] {
  if (groups.length === 0) return [];

  const lines: string[] = ["Heaviest packages"];

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const name =
      g.name.length > 25 ? "…" + g.name.slice(-24) : g.name.padEnd(25);
    lines.push(
      `${(i + 1).toString().padStart(3)}  ${name}  ${formatSize(g.size).padStart(10)}  (${g.moduleCount} module${g.moduleCount === 1 ? "" : "s"})`,
    );
  }

  return lines;
}
