import type { ModuleType } from "../shared/types.js";
import { formatSize, topModules, totalSize } from "../utils/service.js";
import type { JsonReportOptionsType, JsonReportType } from "./types.js";

export function renderJsonReport(
  modules: ModuleType[],
  opts: JsonReportOptionsType,
): JsonReportType {
  const total = totalSize(modules);
  const list = topModules(modules, opts.top);

  return {
    total,
    totalFormatted: formatSize(total),
    moduleCount: modules.length,
    modules: modules.map((m) => ({ path: m.path, size: m.size })),
    top: list.map((m) => ({
      path: m.path,
      size: m.size,
      pct: Number(((m.size / total) * 100).toFixed(1)),
    })),
  };
}
