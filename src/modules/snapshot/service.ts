import fs from "fs";
import path from "path";
import type { ModuleType } from "../shared/types.js";
import { formatSize } from "../utils/service.js";
import type { SnapshotComparisonType, SnapshotType } from "./types.js";

const DEFAULT_SNAPSHOT_FILE = ".bunxray-history.json";

export function saveSnapshot(modules: ModuleType[], filePath?: string): void {
  const file = path.resolve(filePath ?? DEFAULT_SNAPSHOT_FILE);
  const snapshot: SnapshotType = {
    timestamp: new Date().toISOString(),
    total: modules.reduce((a, m) => a + m.size, 0),
    modules: modules.map((m) => ({ path: m.path, size: m.size })),
  };
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2));
}

export function loadSnapshot(filePath?: string): SnapshotType | null {
  const file = path.resolve(filePath ?? DEFAULT_SNAPSHOT_FILE);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw);
}

export function compareSnapshot(
  current: ModuleType[],
  snapshot: SnapshotType,
): SnapshotComparisonType {
  const previousMap = new Map(snapshot.modules.map((m) => [m.path, m.size]));
  const currentMap = new Map(current.map((m) => [m.path, m.size]));

  const changed: SnapshotComparisonType["changed"] = [];
  let unchangedCount = 0;
  let newCount = 0;

  for (const mod of current) {
    const previousSize = previousMap.get(mod.path);
    if (previousSize === undefined) {
      newCount++;
    } else if (previousSize !== mod.size) {
      changed.push({
        path: mod.path,
        currentSize: mod.size,
        previousSize,
        delta: mod.size - previousSize,
      });
    } else {
      unchangedCount++;
    }
  }

  let removedCount = 0;
  for (const [p] of previousMap) {
    if (!currentMap.has(p)) removedCount++;
  }

  changed.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return { changed, unchangedCount, newCount, removedCount };
}

export function renderTrendLines(comparison: SnapshotComparisonType): string[] {
  if (
    comparison.changed.length === 0 &&
    comparison.newCount === 0 &&
    comparison.removedCount === 0
  ) {
    return ["Trends (vs last snapshot)", "  → No changes"];
  }

  const lines: string[] = ["Trends (vs last snapshot)"];

  for (const t of comparison.changed) {
    const arrow = t.delta > 0 ? "↑" : "↓";
    const sign = t.delta > 0 ? "+" : "";
    const name =
      t.path.length > 35 ? "…" + t.path.slice(-34) : t.path.padEnd(35);
    lines.push(`  ${arrow} ${name}  ${sign}${formatSize(t.delta)}`);
  }

  const summaryParts: string[] = [];
  if (comparison.unchangedCount > 0)
    summaryParts.push(`${comparison.unchangedCount} unchanged`);
  if (comparison.newCount > 0) summaryParts.push(`${comparison.newCount} new`);
  if (comparison.removedCount > 0)
    summaryParts.push(`${comparison.removedCount} removed`);

  if (summaryParts.length > 0) {
    lines.push(`  ${summaryParts.join(", ")}`);
  }

  return lines;
}
