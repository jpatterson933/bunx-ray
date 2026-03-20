import type { ModuleType } from "../shared/types.js";

export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

export function totalSize(modules: ModuleType[]): number {
  return modules.reduce((a, m) => a + m.size, 0);
}

export function topModules(modules: ModuleType[], n = 10): ModuleType[] {
  if (modules.length <= n) return [...modules].sort((a, b) => b.size - a.size);
  const heap = modules.slice(0, n).sort((a, b) => a.size - b.size);
  for (let i = n; i < modules.length; i++) {
    if (modules[i].size > heap[0].size) {
      heap[0] = modules[i];
      let j = 0;
      while (true) {
        const l = 2 * j + 1;
        const r = 2 * j + 2;
        let min = j;
        if (l < n && heap[l].size < heap[min].size) min = l;
        if (r < n && heap[r].size < heap[min].size) min = r;
        if (min === j) break;
        [heap[j], heap[min]] = [heap[min], heap[j]];
        j = min;
      }
    }
  }
  return heap.sort((a, b) => b.size - a.size);
}
