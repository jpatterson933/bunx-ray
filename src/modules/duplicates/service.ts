import type { ModuleType } from "../shared/types.js";
import { formatSize } from "../utils/service.js";
import type { DuplicateGroupType } from "./types.js";

function canonicalName(modulePath: string): string {
  const marker = "node_modules/";
  const lastIndex = modulePath.lastIndexOf(marker);
  if (lastIndex !== -1) {
    return modulePath.slice(lastIndex + marker.length);
  }
  return modulePath;
}

export function findDuplicates(modules: ModuleType[]): DuplicateGroupType[] {
  const groups = new Map<string, ModuleType[]>();

  for (const mod of modules) {
    const name = canonicalName(mod.path);
    const existing = groups.get(name);
    if (existing) {
      existing.push(mod);
    } else {
      groups.set(name, [mod]);
    }
  }

  const duplicates: DuplicateGroupType[] = [];

  for (const [name, instances] of groups) {
    if (instances.length < 2) continue;
    const total = instances.reduce((a, m) => a + m.size, 0);
    const max = Math.max(...instances.map((m) => m.size));
    duplicates.push({ name, instances, wastedSize: total - max });
  }

  duplicates.sort((a, b) => b.wastedSize - a.wastedSize);

  return duplicates;
}

export function renderDuplicateLines(groups: DuplicateGroupType[]): string[] {
  if (groups.length === 0) return [];

  const totalWasted = groups.reduce((a, g) => a + g.wastedSize, 0);
  const lines: string[] = [
    `Potential duplicates (${groups.length} group${groups.length === 1 ? "" : "s"}, ${formatSize(totalWasted)} wasted)`,
  ];

  for (const g of groups) {
    lines.push(
      `  ${g.name}  (${g.instances.length} copies, ${formatSize(g.wastedSize)} wasted)`,
    );
    for (const inst of g.instances) {
      lines.push(`    ${inst.path}`);
    }
  }

  return lines;
}
