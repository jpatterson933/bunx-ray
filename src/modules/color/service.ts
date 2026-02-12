import chalk from "chalk";
import type { CellType } from "../treemap/types.js";
import type { ColorForSizeResponseType } from "./types.js";

export function colorForSize(
  size: number,
  max: number,
): ColorForSizeResponseType {
  if (max === 0) return (text: string) => text;
  const ratio = size / max;
  const r = ratio < 0.5 ? Math.round(ratio * 2 * 255) : 255;
  const g = ratio < 0.5 ? 255 : Math.round((1 - (ratio - 0.5) * 2) * 255);
  return chalk.rgb(r, g, 0);
}

export function colorizeGrid(
  grid: string[][],
  cellMap: (CellType | null)[][],
  max: number,
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
