export type { ModuleType, ChunkType } from "./modules/shared/types.js";

export type { CellType, RectangleType } from "./modules/treemap/types.js";
export { treemap } from "./modules/treemap/service.js";

export { SHADES } from "./modules/drawing/constants.js";
export type { DrawOptionsType } from "./modules/drawing/types.js";
export { shadeFor, shadeIndex, draw } from "./modules/drawing/service.js";

export { colorForSize } from "./modules/color/service.js";

export {
  normalizeWebpack,
  normalizeVite,
  normalizeRollup,
  normalizeEsbuild,
} from "./modules/normalizers/service.js";

export { formatSize, totalSize, topModules } from "./modules/utils/service.js";

export type {
  ReportOptionsType,
  RenderedReportType,
} from "./modules/report/types.js";
export { renderReport } from "./modules/report/service.js";

export type {
  ModuleSizeViolationType,
  TotalModuleSizeViolationType,
} from "./modules/size/types.js";
export {
  parseSize,
  checkModuleSize,
  checkTotalModuleSize,
} from "./modules/size/service.js";

export type { ModuleDiffType, DiffResultType } from "./modules/diff/types.js";
export { diffMods, renderDiff } from "./modules/diff/service.js";

export type { MarkdownReportOptionsType } from "./modules/markdown/types.js";
export {
  renderMarkdownReport,
  renderMarkdownDiff,
} from "./modules/markdown/service.js";

export type {
  JsonReportType,
  JsonReportOptionsType,
} from "./modules/json-output/types.js";
export { renderJsonReport } from "./modules/json-output/service.js";

export type { ConfigType } from "./modules/config/types.js";
export { loadConfig } from "./modules/config/service.js";

export type { DuplicateGroupType } from "./modules/duplicates/types.js";
export {
  findDuplicates,
  renderDuplicateLines,
} from "./modules/duplicates/service.js";

export { extractChunks, renderChunkLines } from "./modules/chunks/service.js";

export { formatAnnotations } from "./modules/ci/service.js";

export type {
  SnapshotType,
  SnapshotComparisonType,
  TrendType,
} from "./modules/snapshot/types.js";
export {
  saveSnapshot,
  loadSnapshot,
  compareSnapshot,
  renderTrendLines,
} from "./modules/snapshot/service.js";

export type { PackageGroupType } from "./modules/grouping/types.js";
export {
  groupByPackage,
  renderPackageLines,
} from "./modules/grouping/service.js";
