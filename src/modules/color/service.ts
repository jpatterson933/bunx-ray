import chalk from "chalk";
import type { Cell } from "../treemap/types.js";
import type { ColorFn } from "./types.js";

export function colorForSize(size: number, max: number): ColorFn {
  if (max === 0) return (t) => t;
  const ratio = size / max;
  const r = ratio < 0.5 ? Math.round(ratio * 2 * 255) : 255;
  const g = ratio < 0.5 ? 255 : Math.round((1 - (ratio - 0.5) * 2) * 255);
  return chalk.rgb(r, g, 0);
}

export function colorizeGrid(
  grid: string[][],
  cellMap: (Cell | null)[][],
  max: number,
  W: number,
  H: number,
): string {
  return grid
    .map((row, y) =>
      row
        .map((char, x) => {
          const cell = cellMap[y][x];
          if (!cell || char === " ") return char;
          return colorForSize(cell.mod.size, max)(char);
        })
        .join(""),
    )
    .join("\n");
}
