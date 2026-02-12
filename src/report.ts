import {
  draw,
  formatSize,
  Mod,
  SHADES,
  shadeFor,
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

export interface RenderedReport {
  legendLine?: string;
  summaryLine?: string;
  grid: string;
  tableLines: string[];
}

export function renderReport(mods: Mod[], opts: ReportOptions): RenderedReport {
  const { cols, rows, top, legend, summary } = opts;
  const max = Math.max(...mods.map((m) => m.size));
  const total = totalSize(mods);

  const grid = draw(treemap(mods, cols, rows), cols, rows);

  let legendLine: string | undefined;
  if (legend) {
    const t1 = max * 0.25;
    const t2 = max * 0.5;
    const t3 = max * 0.75;
    legendLine =
      "Legend  " +
      [
        `${SHADES[3]} >${formatSize(t3)}`,
        `${SHADES[2]} ${formatSize(t2)}-${formatSize(t3)}`,
        `${SHADES[1]} ${formatSize(t1)}-${formatSize(t2)}`,
        `${SHADES[0]} <${formatSize(t1)}`,
      ].join("  ");
  }

  let summaryLine: string | undefined;
  if (summary) {
    summaryLine = `Total bundle: ${formatSize(total)} | modules: ${mods.length}`;
  }

  const list = topModules(mods, top);
  const tableLines: string[] = [`Top ${list.length} modules`];
  for (let idx = 0; idx < list.length; idx++) {
    const m = list[idx];
    const shade = shadeFor(m.size, max);
    const pct = ((m.size / total) * 100).toFixed(1).padStart(4);
    const name =
      m.path.length > 28 ? "…" + m.path.slice(-27) : m.path.padEnd(28);
    tableLines.push(
      `${(idx + 1).toString().padStart(2)} ${shade} ${name} ${formatSize(m.size).padStart(8)} (${pct}%)`,
    );
  }

  return { legendLine, summaryLine, grid, tableLines };
}
