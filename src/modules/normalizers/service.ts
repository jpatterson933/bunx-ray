import type { ModuleType } from "../shared/types.js";

export function normalizeWebpack(stats: any): ModuleType[] {
  const mods: ModuleType[] = [];
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

export function normalizeVite(stats: any): ModuleType[] {
  const mods: ModuleType[] = [];
  const outputs = Array.isArray(stats.output)
    ? stats.output
    : stats.output
      ? [stats.output]
      : [];

  if (outputs.length === 0) {
    throw new Error("Vite stats missing 'output' field");
  }

  let hasModules = false;
  for (const out of outputs) {
    if (!out || !out.modules) continue;
    hasModules = true;
    for (const [p, m] of Object.entries<any>(out.modules)) {
      const size = m.renderedLength ?? m.renderedSize ?? m.originalLength ?? m.size ?? 0;
      mods.push({ path: p, size });
    }
  }

  if (!hasModules) {
    throw new Error("Vite stats contain no modules in any output entry");
  }

  mods.sort((a, b) => b.size - a.size);
  return mods;
}

export function normalizeEsbuild(meta: any): ModuleType[] {
  const mods: ModuleType[] = [];
  if (meta.inputs && typeof meta.inputs === "object") {
    for (const [p, info] of Object.entries<any>(meta.inputs)) {
      const size = info.bytes ?? 0;
      mods.push({ path: p, size });
    }
  }
  mods.sort((a, b) => b.size - a.size);
  return mods;
}
