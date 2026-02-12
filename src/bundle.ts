// Core functions for bunx-ray MVP

export type Mod = {
  path: string;
  size: number; // bytes
};

export interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
  mod: Mod;
}

// simple slice-and-dice treemap mapped to character grid
export function treemap(mods: Mod[], W = 80, H = 24): Cell[] {
  const cells: Cell[] = [];
  let x = 0,
    y = 0,
    rowH = H;
  const total = mods.reduce((a, m) => a + m.size, 0);
  for (const m of mods) {
    const frac = m.size / total;
    const w = Math.max(1, Math.round((frac * W * H) / rowH));
    if (x + w > W) {
      y += rowH;
      x = 0;
    }
    cells.push({ x, y, w, h: rowH, mod: m });
    x += w;
  }
  return cells;
}

export function draw(cells: Cell[], W = 80, H = 24): string {
  const grid: string[][] = Array.from({ length: H }, () => Array(W).fill(" "));
  const shades = ["░", "▒", "▓", "█"];
  const max = Math.max(...cells.map((c) => c.mod.size));
  for (const c of cells) {
    const shade = shades[Math.floor((c.mod.size / max) * (shades.length - 1))];
    for (let i = 0; i < c.h; i++) {
      for (let j = 0; j < c.w; j++) {
        if (c.y + i < H && c.x + j < W) {
          grid[c.y + i][c.x + j] = shade;
        }
      }
    }
  }
  return grid.map((r) => r.join("")).join("\n");
}

// Normalize Webpack stats → Mod[]
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

// Vite / Rollup stats (array of outputs with modules)
export function normalizeVite(stats: any): Mod[] {
  const mods: Mod[] = [];
  const outputs = Array.isArray(stats.output)
    ? stats.output
    : [stats.output ?? stats];
  for (const out of outputs) {
    if (!out || !out.modules) continue;
    const modulesObj = out.modules;
    for (const [p, m] of Object.entries<any>(modulesObj)) {
      const size =
        (m as any).renderedLength ??
        (m as any).renderedSize ??
        (m as any).originalLength ??
        (m as any).size ??
        0;
      mods.push({ path: p, size });
    }
  }
  mods.sort((a, b) => b.size - a.size);
  return mods;
}

// esbuild metafile JSON
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
