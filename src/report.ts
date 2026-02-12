import {
  draw,
  formatSize,
  Mod,
  topModules,
  totalSize,
  treemap,
} from "./bundle.js";

export interface ReportOptions {
  cols: number;
  rows: number;
  top: number;
  legend: boolean;
  summary: boolean;
}

const SHADES = ["░", "▒", "▓", "█"] as const;

function calcThresholds(max: number): number[] {
  return [0.25, 0.5, 0.75].map((p) => max * p);
}

function shadeForSize(size: number, max: number): string {
  const idx = Math.floor((size / max) * (SHADES.length - 1));
  return SHADES[idx];
}

export interface RenderedReport {
  legendLine?: string;
  summaryLine?: string;
  grid: string;
  tableLines: string[];
}

export function renderReport(mods: Mod[], opts: ReportOptions): RenderedReport {
  const { cols, rows, top, legend, summary } = opts;
  const max = Math.max(...mods.map((m) => m.size));
  const thresholds = calcThresholds(max);

  // grid
  const grid = draw(treemap(mods, cols, rows), cols, rows);

  // legend
  let legendLine: string | undefined;
  if (legend) {
    legendLine =
      "Legend  " +
      [
        `${SHADES[3]} >${formatSize(thresholds[2])}`,
        `${SHADES[2]} ${formatSize(thresholds[1])}-${formatSize(thresholds[2])}`,
        `${SHADES[1]} ${formatSize(thresholds[0])}-${formatSize(thresholds[1])}`,
        `${SHADES[0]} <${formatSize(thresholds[0])}`,
      ].join("  ");
  }

  // summary
  let summaryLine: string | undefined;
  if (summary) {
    summaryLine = `Total bundle: ${formatSize(totalSize(mods))} | modules: ${mods.length}`;
  }

  // table
  const list = topModules(mods, top);
  const tableLines: string[] = [`Top ${list.length} modules`];
  list.forEach((m, idx) => {
    const shade = shadeForSize(m.size, max);
    const pct = ((m.size / totalSize(mods)) * 100).toFixed(1).padStart(4);
    const name =
      m.path.length > 28 ? "…" + m.path.slice(-27) : m.path.padEnd(28);
    tableLines.push(
      `${(idx + 1).toString().padStart(2)} ${shade} ${name} ${formatSize(m.size).padStart(8)} (${pct}%)`,
    );
  });

  return { legendLine, summaryLine, grid, tableLines };
}
