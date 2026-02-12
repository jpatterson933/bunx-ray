/// <reference types="vitest" />

import chalk from "chalk";
import { readFileSync } from "fs";
import { beforeAll, describe, expect, it } from "vitest";
import type { Cell } from "../src/modules/treemap/types";
import type { ModuleType } from "../src/modules/shared/types";
import { treemap } from "../src/modules/treemap/service";
import { draw, shadeFor, shadeIndex } from "../src/modules/drawing/service";

beforeAll(() => {
  chalk.level = 3;
});
import { SHADES } from "../src/modules/drawing/constants";
import {
  normalizeEsbuild,
  normalizeVite,
  normalizeWebpack,
} from "../src/modules/normalizers/service";
import { formatSize, topModules, totalSize } from "../src/modules/utils/service";

const fixturesDir = new URL("../fixtures/", import.meta.url).pathname;

function load(name: string) {
  return JSON.parse(readFileSync(`${fixturesDir}${name}`, "utf8"));
}

describe("normalizeWebpack", () => {
  it("extracts modules with path and size", () => {
    const mods = normalizeWebpack(load("webpack-sample.json"));
    expect(mods.length).toBeGreaterThan(0);
    for (const m of mods) {
      expect(m.path).toBeTruthy();
      expect(m.size).toBeGreaterThan(0);
    }
  });

  it("returns modules sorted by size descending", () => {
    const mods = normalizeWebpack(load("webpack-sample.json"));
    for (let i = 1; i < mods.length; i++) {
      expect(mods[i - 1].size).toBeGreaterThanOrEqual(mods[i].size);
    }
  });
});

describe("normalizeVite", () => {
  it("extracts modules from output array", () => {
    const mods = normalizeVite(load("vite-sample.json"));
    expect(mods.length).toBe(2);
    expect(mods[0].size).toBeGreaterThanOrEqual(mods[1].size);
  });

  it("throws on missing output field", () => {
    expect(() => normalizeVite({})).toThrow("missing 'output' field");
  });

  it("throws when output entries have no modules", () => {
    expect(() => normalizeVite({ output: [{}] })).toThrow("no modules");
  });
});

describe("normalizeEsbuild", () => {
  it("extracts inputs with byte sizes", () => {
    const mods = normalizeEsbuild(load("esbuild-sample.json"));
    expect(mods.length).toBe(2);
    expect(mods[0].path).toContain("index.ts");
    expect(mods[0].size).toBe(71);
  });

  it("handles realistic fixture with many modules", () => {
    const mods = normalizeEsbuild(load("esbuild-realistic.json"));
    expect(mods.length).toBe(15);
    expect(mods[0].path).toContain("lodash");
    expect(mods[0].size).toBe(72000);
  });
});

describe("treemap", () => {
  it("returns empty array for empty input", () => {
    expect(treemap([], 80, 24)).toEqual([]);
  });

  it("returns one cell for a single module", () => {
    const cells = treemap([{ path: "a.js", size: 100 }], 40, 10);
    expect(cells.length).toBe(1);
    expect(cells[0].x).toBe(0);
    expect(cells[0].y).toBe(0);
    expect(cells[0].w).toBe(40);
    expect(cells[0].h).toBe(10);
  });

  it("every module gets a visible cell", () => {
    const mods: ModuleType[] = Array.from({ length: 20 }, (_, i) => ({
      path: `mod-${i}.js`,
      size: (20 - i) * 1000,
    }));
    const cells = treemap(mods, 80, 24);
    expect(cells.length).toBe(20);
    for (const c of cells) {
      expect(c.w).toBeGreaterThanOrEqual(1);
      expect(c.h).toBeGreaterThanOrEqual(1);
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.w).toBeLessThanOrEqual(80);
      expect(c.y + c.h).toBeLessThanOrEqual(24);
    }
  });

  it("cells do not extend beyond grid bounds", () => {
    const mods = normalizeEsbuild(load("esbuild-realistic.json"));
    const W = 60, H = 20;
    const cells = treemap(mods, W, H);
    for (const c of cells) {
      expect(c.x + c.w).toBeLessThanOrEqual(W);
      expect(c.y + c.h).toBeLessThanOrEqual(H);
    }
  });

  it("produces a 2D layout, not a single column", () => {
    const mods = normalizeEsbuild(load("esbuild-realistic.json"));
    const cells = treemap(mods, 80, 24);
    const hasVaryingX = new Set(cells.map((c) => c.x)).size > 1;
    expect(hasVaryingX).toBe(true);
  });

  it("top 3 modules get reasonable aspect ratios", () => {
    const mods = normalizeEsbuild(load("esbuild-realistic.json"));
    const cells = treemap(mods, 80, 24);
    const sorted = [...cells].sort((a, b) => b.mod.size - a.mod.size);
    for (const c of sorted.slice(0, 3)) {
      const ratio = Math.max(c.w / c.h, c.h / c.w);
      expect(ratio).toBeLessThan(20);
    }
  });
});

describe("draw", () => {
  it("fills the entire grid with no empty space for a single module", () => {
    const cells: Cell[] = [{ x: 0, y: 0, w: 10, h: 5, mod: { path: "a", size: 100 } }];
    const grid = draw(cells, 10, 5);
    const lines = grid.split("\n");
    expect(lines.length).toBe(5);
    for (const line of lines) {
      expect(line.length).toBe(10);
      expect(line).not.toContain(" ");
    }
  });

  it("produces correct grid dimensions", () => {
    const mods = normalizeEsbuild(load("esbuild-sample.json"));
    const W = 30, H = 8;
    const grid = draw(treemap(mods, W, H), W, H);
    const lines = grid.split("\n");
    expect(lines.length).toBe(H);
    for (const line of lines) {
      expect(line.length).toBe(W);
    }
  });

  it("returns empty grid for empty cells", () => {
    const grid = draw([], 10, 3);
    const lines = grid.split("\n");
    expect(lines.length).toBe(3);
    for (const line of lines) {
      expect(line.length).toBe(10);
      expect(line.trim()).toBe("");
    }
  });

  it("draws borders between adjacent cells", () => {
    const cells: Cell[] = [
      { x: 0, y: 0, w: 5, h: 4, mod: { path: "a", size: 100 } },
      { x: 5, y: 0, w: 5, h: 4, mod: { path: "b", size: 50 } },
    ];
    const grid = draw(cells, 10, 4, { borders: true });
    const lines = grid.split("\n");
    for (const line of lines) {
      expect(line[4]).toBe("│");
    }
  });

  it("no-borders option disables borders", () => {
    const cells: Cell[] = [
      { x: 0, y: 0, w: 5, h: 4, mod: { path: "a", size: 100 } },
      { x: 5, y: 0, w: 5, h: 4, mod: { path: "b", size: 50 } },
    ];
    const grid = draw(cells, 10, 4, { borders: false });
    const lines = grid.split("\n");
    for (const line of lines) {
      expect(line).not.toContain("│");
    }
  });

  it("overlays labels on large cells", () => {
    const cells: Cell[] = [
      { x: 0, y: 0, w: 20, h: 5, mod: { path: "node_modules/lodash.js", size: 100 } },
    ];
    const grid = draw(cells, 20, 5, { labels: true, borders: false });
    expect(grid).toContain("lodash.js");
  });

  it("does not label small cells", () => {
    const cells: Cell[] = [
      { x: 0, y: 0, w: 8, h: 2, mod: { path: "tiny.js", size: 100 } },
    ];
    const grid = draw(cells, 8, 2, { labels: true, borders: false });
    expect(grid).not.toContain("tiny.js");
  });

  it("color option produces ANSI escape codes", () => {
    const cells: Cell[] = [
      { x: 0, y: 0, w: 10, h: 3, mod: { path: "a", size: 100 } },
    ];
    const plain = draw(cells, 10, 3, { color: false, borders: false });
    const colored = draw(cells, 10, 3, { color: true, borders: false });
    expect(colored.length).toBeGreaterThan(plain.length);
  });
});

describe("shadeIndex / shadeFor", () => {
  it("returns 0 for max=0", () => {
    expect(shadeIndex(0, 0)).toBe(0);
  });

  it("maps smallest value to lightest shade", () => {
    expect(shadeFor(1, 100)).toBe(SHADES[0]);
  });

  it("maps max value to darkest shade", () => {
    expect(shadeFor(100, 100)).toBe(SHADES[3]);
  });

  it("shade index increases with size", () => {
    const a = shadeIndex(10, 100);
    const b = shadeIndex(50, 100);
    const c = shadeIndex(100, 100);
    expect(a).toBeLessThanOrEqual(b);
    expect(b).toBeLessThanOrEqual(c);
  });
});

describe("formatSize", () => {
  it("formats bytes", () => {
    expect(formatSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatSize(2048)).toBe("2.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatSize(1024 * 1024 * 3.5)).toBe("3.5 MB");
  });
});

describe("totalSize", () => {
  it("sums all module sizes", () => {
    const mods: ModuleType[] = [
      { path: "a", size: 100 },
      { path: "b", size: 200 },
    ];
    expect(totalSize(mods)).toBe(300);
  });
});

describe("topModules", () => {
  it("returns the N largest modules", () => {
    const mods: ModuleType[] = [
      { path: "a", size: 10 },
      { path: "b", size: 50 },
      { path: "c", size: 30 },
    ];
    const top = topModules(mods, 2);
    expect(top.length).toBe(2);
    expect(top[0].size).toBe(50);
    expect(top[1].size).toBe(30);
  });
});
