import { z } from "zod";
import type { CellType } from "../treemap/schema.js";
import { colorizeGrid } from "../color/service.js";
import { DrawOptionsSchema, type DrawOptionsInputType } from "./schema.js";

export const ShadeSchema = z.enum(["░", "▒", "▓", "█"]);
export const SHADES = ShadeSchema.options;

export function shadeIndex(size: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(SHADES.length - 1, Math.floor((size / max) * SHADES.length));
}

export function shadeFor(size: number, max: number): string {
  return SHADES[shadeIndex(size, max)];
}

export function draw(
  cells: CellType[],
  W = 80,
  H = 24,
  opts: DrawOptionsInputType = {},
): string {
  const { color } = DrawOptionsSchema.parse(opts);

  const grid: string[][] = Array.from({ length: H }, () => Array(W).fill(" "));
  if (cells.length === 0) return grid.map((r) => r.join("")).join("\n");

  const max = cells.reduce((m, c) => Math.max(m, c.mod.size), 0);

  const cellMap: (CellType | null)[][] = Array.from({ length: H }, () =>
    Array(W).fill(null),
  );
  for (const c of cells) {
    const shade = shadeFor(c.mod.size, max);
    for (let row = 0; row < c.h; row++) {
      for (let col = 0; col < c.w; col++) {
        const gy = c.y + row;
        const gx = c.x + col;
        if (gy < H && gx < W) {
          grid[gy][gx] = shade;
          cellMap[gy][gx] = c;
        }
      }
    }
  }

  if (color) return colorizeGrid(grid, cellMap, max);

  return grid.map((r) => r.join("")).join("\n");
}
