import type { ModuleType } from "../shared/types.js";

export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

export function totalSize(mods: ModuleType[]): number {
  return mods.reduce((a, m) => a + m.size, 0);
}

export function topModules(mods: ModuleType[], n = 10): ModuleType[] {
  return [...mods].sort((a, b) => b.size - a.size).slice(0, n);
}
