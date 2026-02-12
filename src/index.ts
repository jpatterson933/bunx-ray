export type { ModuleType } from "./modules/shared/types.js";

export type { Cell, Rect } from "./modules/treemap/types.js";
export { treemap } from "./modules/treemap/service.js";

export { SHADES } from "./modules/drawing/constants.js";
export type { DrawOptions } from "./modules/drawing/types.js";
export { shadeFor, shadeIndex, draw } from "./modules/drawing/service.js";

export { colorForSize } from "./modules/color/service.js";

export {
  normalizeWebpack,
  normalizeVite,
  normalizeEsbuild,
} from "./modules/normalizers/service.js";

export { formatSize, totalSize, topModules } from "./modules/utils/service.js";

export type { ReportOptionsType, RenderedReportType } from "./modules/report/types.js";
export { renderReport } from "./modules/report/service.js";

export type {
  ModuleSizeViolationType,
  TotalModuleSizeViolationType,
} from "./modules/budget/types.js";
export { parseSize, checkBudget, checkTotalBudget } from "./modules/budget/service.js";

export type { ModuleDiffType, DiffResultType } from "./modules/diff/types.js";
export { diffMods, renderDiff } from "./modules/diff/service.js";
