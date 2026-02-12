import type { ModuleType } from "../shared/types.js";
import type { Cell, LayoutResult, Rect, TreemapItem } from "./types.js";

function worstAspectRatio(areas: number[], side: number): number {
  const sum = areas.reduce((a, b) => a + b, 0);
  const s2 = side * side;
  const sum2 = sum * sum;
  let worst = 0;
  for (const a of areas) {
    const r = Math.max((s2 * a) / sum2, sum2 / (s2 * a));
    if (r > worst) worst = r;
  }
  return worst;
}

function clampCell(x: number, y: number, w: number, h: number, W: number, H: number) {
  const cx = Math.min(x, W - 1);
  const cy = Math.min(y, H - 1);
  return {
    x: cx,
    y: cy,
    w: Math.max(1, Math.min(w, W - cx)),
    h: Math.max(1, Math.min(h, H - cy)),
  };
}

function layoutRow(
  row: TreemapItem[],
  rect: Rect,
  W: number,
  H: number,
): LayoutResult {
  const cells: Cell[] = [];
  const rowArea = row.reduce((s, r) => s + r.area, 0);
  const vertical = rect.w <= rect.h;

  if (vertical) {
    const rowW = rowArea / rect.h;
    let yOff = rect.y;
    for (let i = 0; i < row.length; i++) {
      const cellH =
        i === row.length - 1
          ? rect.y + rect.h - yOff
          : row[i].area / rowW;
      const x = Math.round(rect.x);
      const y = Math.round(yOff);
      const w = Math.max(1, Math.round(rect.x + rowW) - x);
      const h = Math.max(1, Math.round(yOff + cellH) - y);
      cells.push({ ...clampCell(x, y, w, h, W, H), mod: row[i].mod });
      yOff += cellH;
    }
    return { cells, consumed: { axis: "x", amount: rowW } };
  } else {
    const rowH = rowArea / rect.w;
    let xOff = rect.x;
    for (let i = 0; i < row.length; i++) {
      const cellW =
        i === row.length - 1
          ? rect.x + rect.w - xOff
          : row[i].area / rowH;
      const x = Math.round(xOff);
      const y = Math.round(rect.y);
      const w = Math.max(1, Math.round(xOff + cellW) - x);
      const h = Math.max(1, Math.round(rect.y + rowH) - y);
      cells.push({ ...clampCell(x, y, w, h, W, H), mod: row[i].mod });
      xOff += cellW;
    }
    return { cells, consumed: { axis: "y", amount: rowH } };
  }
}

export function treemap(mods: ModuleType[], W = 80, H = 24): Cell[] {
  if (mods.length === 0) return [];

  const sorted = [...mods].sort((a, b) => b.size - a.size);
  const total = sorted.reduce((a, m) => a + m.size, 0);
  if (total === 0) return [];

  const gridArea = W * H;
  const items: TreemapItem[] = sorted.map((mod) => ({
    mod,
    area: (mod.size / total) * gridArea,
  }));

  const cells: Cell[] = [];
  const rect: Rect = { x: 0, y: 0, w: W, h: H };
  let row: TreemapItem[] = [];
  let i = 0;

  while (i < items.length) {
    const side = Math.min(rect.w, rect.h);
    if (side <= 0) break;

    if (side < 2) {
      row.push(...items.slice(i));
      i = items.length;
      break;
    }

    const areas = row.map((r) => r.area);

    if (row.length === 0) {
      row.push(items[i]);
      i++;
      continue;
    }

    const currentWorst = worstAspectRatio(areas, side);
    const candidateWorst = worstAspectRatio(
      [...areas, items[i].area],
      side,
    );

    if (candidateWorst <= currentWorst) {
      row.push(items[i]);
      i++;
    } else {
      const result = layoutRow(row, rect, W, H);
      cells.push(...result.cells);
      if (result.consumed.axis === "x") {
        rect.x += result.consumed.amount;
        rect.w -= result.consumed.amount;
      } else {
        rect.y += result.consumed.amount;
        rect.h -= result.consumed.amount;
      }
      row = [];
    }
  }

  if (row.length > 0) {
    const result = layoutRow(row, rect, W, H);
    cells.push(...result.cells);
    if (result.consumed.axis === "x") {
      rect.x += result.consumed.amount;
      rect.w -= result.consumed.amount;
    } else {
      rect.y += result.consumed.amount;
      rect.h -= result.consumed.amount;
    }
  }

  return cells;
}
