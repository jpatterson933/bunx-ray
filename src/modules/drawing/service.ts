import type { CellType } from "../treemap/types.js";
import { colorizeGrid } from "../color/service.js";
import { SHADES } from "./constants.js";
import type { DrawOptionsType } from "./types.js";

export function shadeIndex(size: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(SHADES.length - 1, Math.floor((size / max) * SHADES.length));
}

export function shadeFor(size: number, max: number): string {
  return SHADES[shadeIndex(size, max)];
}

function overlayBorders(
  grid: string[][],
  cellMap: (CellType | null)[][],
  W: number,
  H: number,
): void {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const current = cellMap[y][x];
      const right = x + 1 < W ? cellMap[y][x + 1] : null;
      const below = y + 1 < H ? cellMap[y + 1][x] : null;

      const diffRight = right !== null && current !== right;
      const diffBelow = below !== null && current !== below;

      if (diffRight && diffBelow) grid[y][x] = "┼";
      else if (diffRight) grid[y][x] = "│";
      else if (diffBelow) grid[y][x] = "─";
    }
  }
}

function overlayLabels(
  grid: string[][],
  cells: CellType[],
  W: number,
  H: number,
): void {
  for (const c of cells) {
    if (c.w < 12 || c.h < 3) continue;

    const basename = c.mod.path.split("/").pop() || c.mod.path;
    const maxLabelWidth = c.w - 2;
    const label =
      basename.length > maxLabelWidth
        ? basename.slice(0, maxLabelWidth - 1) + "…"
        : basename;

    const midRow = c.y + Math.floor(c.h / 2);
    const startCol = c.x + Math.floor((c.w - label.length) / 2);

    for (let i = 0; i < label.length; i++) {
      const gx = startCol + i;
      if (midRow < H && gx < W) {
        grid[midRow][gx] = label[i];
      }
    }
  }
}

export function draw(
  cells: CellType[],
  W = 80,
  H = 24,
  opts: DrawOptionsType = {},
): string {
  const { color = false, labels = false, borders = true } = opts;

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

  if (borders) overlayBorders(grid, cellMap, W, H);

  if (labels) overlayLabels(grid, cells, W, H);

  if (color) return colorizeGrid(grid, cellMap, max);

  return grid.map((r) => r.join("")).join("\n");
}
