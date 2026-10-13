import type { ModuleType } from "../shared/schema.js";
import { treemap } from "../treemap/service.js";
import { draw, shadeFor } from "../drawing/service.js";
import { colorForSize } from "../color/service.js";
import {
  formatSize,
  topModules,
  totalSize,
  maxSize,
} from "../utils/service.js";
import { fitPath, fitText, padText } from "../text/service.js";
import type { RenderedReportType, ReportOptionsType } from "./schema.js";

export function renderReport(
  modules: ModuleType[],
  opts: ReportOptionsType,
): RenderedReportType {
  const { cols, rows, top } = opts;
  const list = topModules(modules, top);
  const total = totalSize(modules);
  const { cells, labels, other, otherCount } = createLabeledMap(
    modules,
    list,
    cols,
    rows,
  );
  const grid = draw(cells, cols, rows, { color: true });
  const max = Math.max(maxSize(modules), other.size);
  const legendLine = fitText(
    cols >= 45
      ? "Map: [#] file  [O] Other  ░→█ smaller to larger"
      : "[#] file  [O] Other",
    cols,
  );
  const summaryLine = fitText(
    `Total: ${formatSize(total)} | ${modules.length} files`,
    cols,
  );
  const tableLines = [fitText(`Top ${list.length} files`, cols)];

  for (const mod of list) {
    const label = labels.get(mod) ?? (mod.size > 0 ? "[O]" : " - ");
    tableLines.push(renderFileLine(mod, label, total, max, cols));
  }

  if (otherCount > 0) {
    const otherCell = cells.find((cell) => cell.mod === other);
    const size = formatSize(other.size);
    const note = otherCell?.label
      ? `[O] Other: ${otherCount} files, ${size}`
      : otherCell
        ? `Other: ${otherCount} files, ${size} (unlabeled on map)`
        : `Other: ${otherCount} files, ${size} (below map resolution)`;
    tableLines.push(fitText(note, cols));
  }

  return { legendLine, summaryLine, grid, tableLines };
}

export function renderTerminalReport(
  modules: ModuleType[],
  opts: ReportOptionsType,
  all = false,
): string {
  const availableRows = Math.max(1, opts.rows - 1);
  const top = all
    ? modules.length
    : Math.min(opts.top, Math.max(1, Math.floor((availableRows - 7) / 2)));
  const tableRows = Math.min(modules.length, top) + 2;
  const rows = all
    ? Math.max(4, Math.min(12, availableRows - 10))
    : Math.max(0, Math.min(12, availableRows - tableRows - 4));
  const report = renderReport(modules, { cols: opts.cols, rows, top });
  const lines = [report.summaryLine, report.legendLine];
  if (rows > 0) lines.push("", report.grid, "");
  lines.push(...report.tableLines);
  const output = lines.join("\n").split("\n");
  if (!all && output.length > availableRows) {
    return output.slice(0, availableRows).join("\n");
  }
  return output.join("\n");
}

function createLabeledMap(
  modules: ModuleType[],
  list: ModuleType[],
  cols: number,
  rows: number,
) {
  const total = totalSize(modules);
  const labels = new Map(list.map((mod, index) => [mod, `[${index + 1}]`]));
  let visible = list.filter(
    (mod) =>
      mod.size > 0 &&
      (mod.size / total) * cols * rows >= labels.get(mod)!.length,
  );

  while (true) {
    const visibleSet = new Set(visible);
    const otherFiles = modules.filter(
      (mod) => mod.size > 0 && !visibleSet.has(mod),
    );
    const other = { path: "Other", size: totalSize(otherFiles) };
    const cells = treemap(
      other.size > 0 ? [...visible, other] : visible,
      cols,
      rows,
    );
    const labeled = new Set(
      cells
        .filter((cell) => cell.w >= (labels.get(cell.mod)?.length ?? 3))
        .map((cell) => cell.mod),
    );
    const nextVisible = visible.filter((mod) => labeled.has(mod));

    if (nextVisible.length === visible.length) {
      const visibleLabels = new Map(
        visible.map((mod) => [mod, labels.get(mod)!]),
      );
      for (const cell of cells) {
        const label =
          cell.mod === other
            ? cell.w >= 3
              ? "[O]"
              : "O"
            : visibleLabels.get(cell.mod);
        if (label && label.length <= cell.w) cell.label = label;
      }
      return {
        cells,
        labels: visibleLabels,
        other,
        otherCount: otherFiles.length,
      };
    }
    visible = nextVisible;
  }
}

function renderFileLine(
  mod: ModuleType,
  label: string,
  total: number,
  max: number,
  cols: number,
): string {
  const size = formatSize(mod.size);
  const percent = `${(total === 0 ? 0 : (mod.size / total) * 100).toFixed(1)}%`;
  const shade = colorForSize(mod.size, max)(shadeFor(mod.size, max));
  const prefix = `${label.padStart(3)} ${shade} `;
  const prefixWidth = Math.max(3, label.length) + 3;
  const suffix =
    cols >= 40 ? ` ${size.padStart(8)} (${percent.padStart(5)})` : ` ${size}`;
  const nameWidth = cols - prefixWidth - suffix.length;
  if (nameWidth < 3)
    return fitText(`${label} ${fitPath(mod.path, cols)} ${size}`, cols);
  return prefix + padText(fitPath(mod.path, nameWidth), nameWidth) + suffix;
}
