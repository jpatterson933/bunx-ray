import type { ModuleType } from "../shared/schema.js";
import { treemap } from "../treemap/service.js";
import { draw, shadeFor, SHADES } from "../drawing/service.js";
import { colorForSize } from "../color/service.js";
import { formatSize, topModules, totalSize, maxSize } from "../utils/service.js";
import type { RenderedReportType, ReportOptionsType } from "./schema.js";

export function renderReport(
  modules: ModuleType[],
  opts: ReportOptionsType,
): RenderedReportType {
  const { cols, rows, top } = opts;
  const max = maxSize(modules);
  const total = totalSize(modules);

  const grid = draw(treemap(modules, cols, rows), cols, rows, {
    color: true,
  });

  const t1 = max * 0.25;
  const t2 = max * 0.5;
  const t3 = max * 0.75;
  const entries = [
    { shade: SHADES[3], label: `>${formatSize(t3)}`, ratio: 1.0 },
    { shade: SHADES[2], label: `${formatSize(t2)}-${formatSize(t3)}`, ratio: 0.625 },
    { shade: SHADES[1], label: `${formatSize(t1)}-${formatSize(t2)}`, ratio: 0.375 },
    { shade: SHADES[0], label: `<${formatSize(t1)}`, ratio: 0.125 },
  ];
  const legendLine =
    "Legend  " +
    entries
      .map((e) => {
        const shadeChar = colorForSize(e.ratio * max, max)(e.shade);
        return `${shadeChar} ${e.label}`;
      })
      .join("  ");

  const summaryLine = `Total bundle: ${formatSize(total)} | modules: ${modules.length}`;

  const list = topModules(modules, top);
  const tableLines: string[] = [`Top ${list.length} modules`];
  for (let idx = 0; idx < list.length; idx++) {
    const m = list[idx];
    const shade = shadeFor(m.size, max);
    const coloredShade = colorForSize(m.size, max)(shade);
    const pctValue = total === 0 ? 0 : (m.size / total) * 100;
    const pct = pctValue.toFixed(1).padStart(4);
    const name =
      m.path.length > 28 ? "…" + m.path.slice(-27) : m.path.padEnd(28);
    tableLines.push(
      `${(idx + 1).toString().padStart(2)} ${coloredShade} ${name} ${formatSize(m.size).padStart(8)} (${pct}%)`,
    );
  }

  return { legendLine, summaryLine, grid, tableLines };
}
