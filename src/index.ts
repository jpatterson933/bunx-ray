export type { ModuleType } from "./modules/shared/types.js";

export type { CellType, RectangleType } from "./modules/treemap/types.js";
export { treemap } from "./modules/treemap/service.js";

export { SHADES } from "./modules/drawing/constants.js";
export type { DrawOptionsType } from "./modules/drawing/types.js";
export { shadeFor, shadeIndex, draw } from "./modules/drawing/service.js";

export { colorForSize } from "./modules/color/service.js";

export { formatSize, totalSize, topModules } from "./modules/utils/service.js";

export type {
  ReportOptionsType,
  RenderedReportType,
} from "./modules/report/types.js";
export { renderReport } from "./modules/report/service.js";

export type { ConfigType } from "./modules/config/types.js";
export { loadConfig } from "./modules/config/service.js";

export { xray } from "./modules/xray/service.js";
