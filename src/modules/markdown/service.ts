import type { DiffResultType } from "../diff/types.js";
import { formatSize, topModules, totalSize } from "../utils/service.js";
import type { MarkdownReportOptionsType } from "./types.js";
import type { ModuleType } from "../shared/types.js";

const BAR_WIDTH = 16;

function renderBar(ratio: number): string {
  const filled = Math.round(ratio * BAR_WIDTH);
  return "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
}

export function renderMarkdownReport(
  modules: ModuleType[],
  opts: MarkdownReportOptionsType,
): string {
  const { top } = opts;
  const total = totalSize(modules);
  const list = topModules(modules, top);
  const max = list.length > 0 ? list[0].size : 0;

  const lines: string[] = [
    "### bunx-ray — Bundle Report",
    "",
    `**Total:** ${formatSize(total)} | **Modules:** ${modules.length}`,
    "",
    "| # | Module | Size | % | |",
    "|---|--------|------|---|---|",
  ];

  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    const pct = ((m.size / total) * 100).toFixed(1);
    const bar = renderBar(max > 0 ? m.size / max : 0);
    const name = m.path.length > 50 ? "…" + m.path.slice(-49) : m.path;
    lines.push(
      `| ${i + 1} | \`${name}\` | ${formatSize(m.size)} | ${pct}% | \`${bar}\` |`,
    );
  }

  return lines.join("\n");
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatSize(delta)}`;
}

function formatPct(pct: number | null): string {
  if (pct === null) return "";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function renderMarkdownDiff(result: DiffResultType): string {
  const totalSign = result.totalDelta > 0 ? "+" : "";
  const lines: string[] = [
    "### bunx-ray — Diff Report",
    "",
    `**Total:** ${formatSize(result.oldTotal)} → ${formatSize(result.newTotal)} (${totalSign}${formatSize(result.totalDelta)}, ${totalSign}${result.totalPctChange.toFixed(1)}%)`,
    "",
  ];

  if (result.changed.length > 0) {
    lines.push(
      "#### Changed",
      "| Module | Old | New | Delta | |",
      "|--------|-----|-----|-------|-|",
    );
    for (const d of result.changed) {
      const arrow = d.delta > 0 ? "▲" : "▼";
      const name = d.path.length > 40 ? "…" + d.path.slice(-39) : d.path;
      const pctStr = formatPct(d.pctChange);
      const deltaStr = pctStr
        ? `${formatDelta(d.delta)} (${pctStr})`
        : formatDelta(d.delta);
      lines.push(
        `| \`${name}\` | ${formatSize(d.oldSize!)} | ${formatSize(d.newSize!)} | ${deltaStr} | ${arrow} |`,
      );
    }
    lines.push("");
  }

  if (result.added.length > 0) {
    lines.push("#### Added", "| Module | Size |", "|--------|------|");
    for (const d of result.added) {
      const name = d.path.length > 50 ? "…" + d.path.slice(-49) : d.path;
      lines.push(`| \`${name}\` | ${formatSize(d.newSize!)} |`);
    }
    lines.push("");
  }

  if (result.removed.length > 0) {
    lines.push("#### Removed", "| Module | Size |", "|--------|------|");
    for (const d of result.removed) {
      const name = d.path.length > 50 ? "…" + d.path.slice(-49) : d.path;
      lines.push(`| \`${name}\` | ${formatSize(d.oldSize!)} |`);
    }
    lines.push("");
  }

  if (result.unchanged.length > 0) {
    lines.push(
      `*${result.unchanged.length} unchanged module${result.unchanged.length === 1 ? "" : "s"}*`,
    );
  }

  return lines.join("\n");
}
