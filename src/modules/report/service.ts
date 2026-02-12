import type { ModuleType } from "../shared/types.js";
import { treemap } from "../treemap/service.js";
import { draw, shadeFor } from "../drawing/service.js";
import { SHADES } from "../drawing/constants.js";
import { colorForSize } from "../color/service.js";
import { formatSize, topModules, totalSize } from "../utils/service.js";
import type { RenderedReportType, ReportOptionsType } from "./types.js";

export function renderReport(mods: ModuleType[], opts: ReportOptionsType): RenderedReportType {
  const { cols, rows, top, legend, summary, color, labels, borders } = opts;
  const max = mods.reduce((m, mod) => Math.max(m, mod.size), 0);
  const total = totalSize(mods);

  const grid = draw(treemap(mods, cols, rows), cols, rows, {
    color,
    labels,
    borders,
  });

  let legendLine: string | undefined;
  if (legend) {
    const t1 = max * 0.25;
    const t2 = max * 0.5;
    const t3 = max * 0.75;
    const entries = [
      { shade: SHADES[3], label: `>${formatSize(t3)}`, ratio: 1.0 },
      { shade: SHADES[2], label: `${formatSize(t2)}-${formatSize(t3)}`, ratio: 0.625 },
      { shade: SHADES[1], label: `${formatSize(t1)}-${formatSize(t2)}`, ratio: 0.375 },
      { shade: SHADES[0], label: `<${formatSize(t1)}`, ratio: 0.125 },
    ];
    legendLine =
      "Legend  " +
      entries
        .map((e) => {
          const shadeChar = color
            ? colorForSize(e.ratio * max, max)(e.shade)
            : e.shade;
          return `${shadeChar} ${e.label}`;
        })
        .join("  ");
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
    const coloredShade = color ? colorForSize(m.size, max)(shade) : shade;
    const pct = ((m.size / total) * 100).toFixed(1).padStart(4);
    const name =
      m.path.length > 28 ? "…" + m.path.slice(-27) : m.path.padEnd(28);
    tableLines.push(
      `${(idx + 1).toString().padStart(2)} ${coloredShade} ${name} ${formatSize(m.size).padStart(8)} (${pct}%)`,
    );
  }

  return { legendLine, summaryLine, grid, tableLines };
}
