import chalk from "chalk";
import type { ModuleType } from "../shared/types.js";
import { formatSize } from "../utils/service.js";
import type { DiffResultType, ModuleDiffType } from "./types.js";

export function diffMods(
  oldMods: ModuleType[],
  newMods: ModuleType[],
): DiffResultType {
  const oldMap = new Map(oldMods.map((m) => [m.path, m.size]));
  const newMap = new Map(newMods.map((m) => [m.path, m.size]));

  const changed: ModuleDiffType[] = [];
  const unchanged: ModuleDiffType[] = [];
  const added: ModuleDiffType[] = [];
  const removed: ModuleDiffType[] = [];

  for (const [path, newSize] of newMap) {
    const oldSize = oldMap.get(path);
    if (oldSize === undefined) {
      added.push({
        path,
        oldSize: null,
        newSize,
        delta: newSize,
        pctChange: null,
      });
    } else if (oldSize === newSize) {
      unchanged.push({ path, oldSize, newSize, delta: 0, pctChange: 0 });
    } else {
      const delta = newSize - oldSize;
      const pctChange = oldSize === 0 ? null : (delta / oldSize) * 100;
      changed.push({ path, oldSize, newSize, delta, pctChange });
    }
  }

  for (const [path, oldSize] of oldMap) {
    if (!newMap.has(path)) {
      removed.push({
        path,
        oldSize,
        newSize: null,
        delta: -oldSize,
        pctChange: null,
      });
    }
  }

  changed.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  added.sort((a, b) => b.delta - a.delta);
  removed.sort((a, b) => a.delta - b.delta);

  const oldTotal = oldMods.reduce((a, m) => a + m.size, 0);
  const newTotal = newMods.reduce((a, m) => a + m.size, 0);
  const totalDelta = newTotal - oldTotal;
  const totalPctChange = oldTotal === 0 ? 0 : (totalDelta / oldTotal) * 100;

  return {
    oldTotal,
    newTotal,
    totalDelta,
    totalPctChange,
    changed,
    unchanged,
    added,
    removed,
  };
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatSize(delta)}`;
}

function formatPct(pct: number | null): string {
  if (pct === null) return "";
  const sign = pct > 0 ? "+" : "";
  return `(${sign}${pct.toFixed(1)}%)`;
}

function padName(path: string, width: number): string {
  return path.length > width
    ? "…" + path.slice(-(width - 1))
    : path.padEnd(width);
}

export function renderDiff(result: DiffResultType): string[] {
  const lines: string[] = [];
  const nameWidth = 38;

  const totalSign = result.totalDelta > 0 ? "+" : "";
  lines.push(
    chalk.bold("bunx-ray diff"),
    "",
    `Total: ${formatSize(result.oldTotal)} → ${formatSize(result.newTotal)}  (${totalSign}${formatSize(result.totalDelta)}, ${totalSign}${result.totalPctChange.toFixed(1)}%)`,
    "",
  );

  if (result.changed.length > 0) {
    lines.push(
      ` ${""}  ${chalk.dim("Module".padEnd(nameWidth))}  ${chalk.dim("Old".padStart(8))}  ${chalk.dim("New".padStart(8))}  ${chalk.dim("Delta".padStart(10))}`,
    );
    for (const d of result.changed) {
      const arrow = d.delta > 0 ? chalk.red("▲") : chalk.green("▼");
      const name = padName(d.path, nameWidth);
      const deltaStr =
        d.delta > 0
          ? chalk.red(formatDelta(d.delta).padStart(10))
          : chalk.green(formatDelta(d.delta).padStart(10));
      const pctStr =
        d.pctChange !== null
          ? d.delta > 0
            ? chalk.red(formatPct(d.pctChange))
            : chalk.green(formatPct(d.pctChange))
          : "";
      lines.push(
        ` ${arrow}  ${name}  ${formatSize(d.oldSize!).padStart(8)}  ${formatSize(d.newSize!).padStart(8)}  ${deltaStr}  ${pctStr}`,
      );
    }
    lines.push("");
  }

  if (result.added.length > 0) {
    lines.push(chalk.yellow(" Added"));
    for (const d of result.added) {
      lines.push(
        chalk.yellow(
          ` +  ${padName(d.path, nameWidth)}  ${"".padStart(8)}  ${formatSize(d.newSize!).padStart(8)}`,
        ),
      );
    }
    lines.push("");
  }

  if (result.removed.length > 0) {
    lines.push(chalk.dim(" Removed"));
    for (const d of result.removed) {
      lines.push(
        chalk.dim(
          ` -  ${padName(d.path, nameWidth)}  ${formatSize(d.oldSize!).padStart(8)}`,
        ),
      );
    }
    lines.push("");
  }

  if (result.unchanged.length > 0) {
    lines.push(
      chalk.dim(
        ` ${result.unchanged.length} unchanged module${result.unchanged.length === 1 ? "" : "s"}`,
      ),
    );
  }

  return lines;
}
