import type { ModuleType } from "../shared/types.js";

export interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
  mod: ModuleType;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TreemapItem {
  mod: ModuleType;
  area: number;
}

export interface LayoutResult {
  cells: Cell[];
  consumed: { axis: "x" | "y"; amount: number };
}
