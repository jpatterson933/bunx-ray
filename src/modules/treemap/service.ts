import type { ModuleType } from "../shared/schema.js";
import type {
  CellType,
  LayoutResultType,
  RectangleType,
  TreemapItemType,
} from "./schema.js";

export function treemap(mods: ModuleType[], W = 80, H = 24): CellType[] {
  if (mods.length === 0 || W <= 0 || H <= 0) return [];

  const sorted = mods
    .filter((mod) => mod.size > 0)
    .sort((a, b) => b.size - a.size);
  const total = sorted.reduce((a, m) => a + m.size, 0);
  if (total === 0) return [];

  const gridArea = W * H;
  const items: TreemapItemType[] = sorted.map((mod) => ({
    mod,
    area: (mod.size / total) * gridArea,
  }));

  const cells: CellType[] = [];
  const rect: RectangleType = { x: 0, y: 0, w: W, h: H };
  let row: TreemapItemType[] = [];
  let rowSum = 0;
  let i = 0;

  while (i < items.length) {
    const side = Math.min(rect.w, rect.h);
    if (side <= 0) break;

    if (side < 2) {
      row.push(...items.slice(i));
      i = items.length;
      break;
    }

    if (row.length === 0) {
      row.push(items[i]);
      rowSum = items[i].area;
      i++;
      continue;
    }

    const currentWorst = worstAspectRatio(row, rowSum, side);
    const candidateWorst = worstAspectRatio(row, rowSum, side, items[i].area);

    if (candidateWorst <= currentWorst) {
      rowSum += items[i].area;
      row.push(items[i]);
      i++;
    } else {
      const result = layoutRow(row, rect, W, H);
      cells.push(...result.cells);
      applyLayout(result, rect);
      row = [];
      rowSum = 0;
    }
  }

  if (row.length > 0) {
    const result = layoutRow(row, rect, W, H);
    cells.push(...result.cells);
    applyLayout(result, rect);
  }

  return cells;
}

function worstAspectRatio(
  row: TreemapItemType[],
  rowSum: number,
  side: number,
  extra = 0,
): number {
  const sum = rowSum + extra;
  const s2 = side * side;
  const sum2 = sum * sum;
  let worst = 0;
  for (const item of row) {
    const r = Math.max((s2 * item.area) / sum2, sum2 / (s2 * item.area));
    if (r > worst) worst = r;
  }
  if (extra > 0) {
    const r = Math.max((s2 * extra) / sum2, sum2 / (s2 * extra));
    if (r > worst) worst = r;
  }
  return worst;
}

function rasterizeCell(
  x: number,
  y: number,
  right: number,
  bottom: number,
  W: number,
  H: number,
) {
  const cx = Math.max(0, Math.min(Math.round(x), W));
  const cy = Math.max(0, Math.min(Math.round(y), H));
  return {
    x: cx,
    y: cy,
    w: Math.max(0, Math.min(Math.round(right), W) - cx),
    h: Math.max(0, Math.min(Math.round(bottom), H) - cy),
  };
}

function layoutRow(
  row: TreemapItemType[],
  rect: RectangleType,
  W: number,
  H: number,
): LayoutResultType {
  const cells: CellType[] = [];
  const rowArea = row.reduce((s, r) => s + r.area, 0);
  const vertical = rect.w >= rect.h;

  if (vertical) {
    const rowW = rowArea / rect.h;
    let yOff = rect.y;
    for (let i = 0; i < row.length; i++) {
      const cellH =
        i === row.length - 1 ? rect.y + rect.h - yOff : row[i].area / rowW;
      const cell = rasterizeCell(
        rect.x,
        yOff,
        rect.x + rowW,
        yOff + cellH,
        W,
        H,
      );
      if (cell.w > 0 && cell.h > 0) cells.push({ ...cell, mod: row[i].mod });
      yOff += cellH;
    }
    return { cells, consumed: { axis: "x", amount: rowW } };
  } else {
    const rowH = rowArea / rect.w;
    let xOff = rect.x;
    for (let i = 0; i < row.length; i++) {
      const cellW =
        i === row.length - 1 ? rect.x + rect.w - xOff : row[i].area / rowH;
      const cell = rasterizeCell(
        xOff,
        rect.y,
        xOff + cellW,
        rect.y + rowH,
        W,
        H,
      );
      if (cell.w > 0 && cell.h > 0) cells.push({ ...cell, mod: row[i].mod });
      xOff += cellW;
    }
    return { cells, consumed: { axis: "y", amount: rowH } };
  }
}

function applyLayout(result: LayoutResultType, rect: RectangleType): void {
  if (result.consumed.axis === "x") {
    rect.x += result.consumed.amount;
    rect.w -= result.consumed.amount;
  } else {
    rect.y += result.consumed.amount;
    rect.h -= result.consumed.amount;
  }
}
