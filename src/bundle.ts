export type Mod = {
  path: string;
  size: number;
};

export interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
  mod: Mod;
}

export const SHADES = ["░", "▒", "▓", "█"] as const;

export function shadeIndex(size: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(SHADES.length - 1, Math.floor((size / max) * SHADES.length));
}

export function shadeFor(size: number, max: number): string {
  return SHADES[shadeIndex(size, max)];
}

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

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
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
  row: { mod: Mod; area: number }[],
  rect: Rect,
  W: number,
  H: number,
): Cell[] {
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
      const clamped = clampCell(x, y, w, h, W, H);
      cells.push({ ...clamped, mod: row[i].mod });
      yOff += cellH;
    }
    rect.x += rowW;
    rect.w -= rowW;
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
      const clamped = clampCell(x, y, w, h, W, H);
      cells.push({ ...clamped, mod: row[i].mod });
      xOff += cellW;
    }
    rect.y += rowH;
    rect.h -= rowH;
  }

  return cells;
}

export function treemap(mods: Mod[], W = 80, H = 24): Cell[] {
  if (mods.length === 0) return [];

  const sorted = [...mods].sort((a, b) => b.size - a.size);
  const total = sorted.reduce((a, m) => a + m.size, 0);
  if (total === 0) return [];

  const gridArea = W * H;
  const items = sorted.map((mod) => ({
    mod,
    area: (mod.size / total) * gridArea,
  }));

  const cells: Cell[] = [];
  const rect: Rect = { x: 0, y: 0, w: W, h: H };
  let row: { mod: Mod; area: number }[] = [];
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
      cells.push(...layoutRow(row, rect, W, H));
      row = [];
    }
  }

  if (row.length > 0) {
    cells.push(...layoutRow(row, rect, W, H));
  }

  return cells;
}

export function draw(cells: Cell[], W = 80, H = 24): string {
  const grid: string[][] = Array.from({ length: H }, () => Array(W).fill(" "));
  const max = Math.max(...cells.map((c) => c.mod.size));
  for (const c of cells) {
    const shade = shadeFor(c.mod.size, max);
    for (let row = 0; row < c.h; row++) {
      for (let col = 0; col < c.w; col++) {
        const gy = c.y + row;
        const gx = c.x + col;
        if (gy < H && gx < W) grid[gy][gx] = shade;
      }
    }
  }
  return grid.map((r) => r.join("")).join("\n");
}

export function normalizeWebpack(stats: any): Mod[] {
  const mods: Mod[] = [];
  if (Array.isArray(stats.modules)) {
    for (const m of stats.modules) {
      const size = m.size ?? m.parsedSize ?? 0;
      const name = m.name ?? m.identifier ?? "";
      if (size && name) mods.push({ path: name, size });
    }
  } else if (Array.isArray(stats.children)) {
    for (const child of stats.children) mods.push(...normalizeWebpack(child));
  }
  mods.sort((a, b) => b.size - a.size);
  return mods;
}

export function normalizeVite(stats: any): Mod[] {
  const mods: Mod[] = [];
  const outputs = Array.isArray(stats.output)
    ? stats.output
    : [stats.output ?? stats];
  for (const out of outputs) {
    if (!out || !out.modules) continue;
    for (const [p, m] of Object.entries<any>(out.modules)) {
      const size = m.renderedLength ?? m.renderedSize ?? m.originalLength ?? m.size ?? 0;
      mods.push({ path: p, size });
    }
  }
  mods.sort((a, b) => b.size - a.size);
  return mods;
}

export function normalizeEsbuild(meta: any): Mod[] {
  const mods: Mod[] = [];
  if (meta.inputs && typeof meta.inputs === "object") {
    for (const [p, info] of Object.entries<any>(meta.inputs)) {
      const size = info.bytes ?? 0;
      mods.push({ path: p, size });
    }
  }
  mods.sort((a, b) => b.size - a.size);
  return mods;
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

export function totalSize(mods: Mod[]): number {
  return mods.reduce((a, m) => a + m.size, 0);
}

export function topModules(mods: Mod[], n = 10): Mod[] {
  return [...mods].sort((a, b) => b.size - a.size).slice(0, n);
}
