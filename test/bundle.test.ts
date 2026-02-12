/// <reference types="vitest" />

import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import {
  Cell,
  draw,
  formatSize,
  Mod,
  normalizeEsbuild,
  normalizeVite,
  normalizeWebpack,
  SHADES,
  shadeFor,
  shadeIndex,
  topModules,
  totalSize,
  treemap,
} from "../src/bundle";

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
    const mods: Mod[] = Array.from({ length: 20 }, (_, i) => ({
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
    const mods: Mod[] = [
      { path: "a", size: 100 },
      { path: "b", size: 200 },
    ];
    expect(totalSize(mods)).toBe(300);
  });
});

describe("topModules", () => {
  it("returns the N largest modules", () => {
    const mods: Mod[] = [
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
