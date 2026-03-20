export type { ModuleType } from "./modules/shared/schema.js";

export type { CellType, RectangleType } from "./modules/treemap/schema.js";
export { treemap } from "./modules/treemap/service.js";

export type { DrawOptionsType } from "./modules/drawing/schema.js";
export { SHADES, shadeFor, shadeIndex, draw } from "./modules/drawing/service.js";

export { colorForSize } from "./modules/color/service.js";

export { formatSize, totalSize, topModules, maxSize } from "./modules/utils/service.js";

export type {
  ReportOptionsType,
  RenderedReportType,
} from "./modules/report/schema.js";
export { renderReport } from "./modules/report/service.js";

export type { ConfigType } from "./modules/config/schema.js";
export { loadConfig } from "./modules/config/service.js";

export { xray } from "./modules/xray/service.js";
