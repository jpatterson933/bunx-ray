/// <reference types="vitest" />

import chalk from "chalk";
import { beforeAll, describe, expect, it } from "vitest";
import type { CellType } from "../src/modules/treemap/schema";
import type { ModuleType } from "../src/modules/shared/schema";
import { treemap } from "../src/modules/treemap/service";
import { draw, shadeFor, shadeIndex } from "../src/modules/drawing/service";

beforeAll(() => {
  chalk.level = 3;
});
import { SHADES } from "../src/modules/drawing/service";
import {
  formatSize,
  topModules,
  totalSize,
} from "../src/modules/utils/service";

const sampleMods: ModuleType[] = [
  { path: "node_modules/lodash/lodash.js", size: 72000 },
  { path: "node_modules/react-dom/index.js", size: 42000 },
  { path: "node_modules/react/index.js", size: 28000 },
  { path: "node_modules/axios/index.js", size: 18000 },
  { path: "node_modules/moment/moment.js", size: 15000 },
  { path: "node_modules/chalk/index.js", size: 12000 },
  { path: "src/components/App.tsx", size: 9000 },
  { path: "src/components/Header.tsx", size: 7000 },
  { path: "src/utils/api.ts", size: 5500 },
  { path: "src/utils/helpers.ts", size: 4200 },
  { path: "src/index.ts", size: 3500 },
  { path: "src/config.ts", size: 2800 },
  { path: "src/types.ts", size: 2100 },
  { path: "src/constants.ts", size: 1500 },
  { path: "src/env.ts", size: 1000 },
];

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

  it("gives visible cells to files that fit on the canvas", () => {
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
    const W = 60,
      H = 20;
    const cells = treemap(sampleMods, W, H);
    for (const c of cells) {
      expect(c.x + c.w).toBeLessThanOrEqual(W);
      expect(c.y + c.h).toBeLessThanOrEqual(H);
    }
  });

  it("produces a 2D layout, not a single column", () => {
    const cells = treemap(sampleMods, 80, 24);
    const hasVaryingX = new Set(cells.map((c) => c.x)).size > 1;
    expect(hasVaryingX).toBe(true);
  });

  it("does not assign area to empty files", () => {
    const cells = treemap(
      [
        { path: "main.js", size: 100 },
        { path: "empty.js", size: 0 },
      ],
      20,
      5,
    );
    expect(cells).toEqual([
      { x: 0, y: 0, w: 20, h: 5, mod: { path: "main.js", size: 100 } },
    ]);
  });

  it("does not inflate files smaller than a terminal cell", () => {
    const mods = [
      { path: "main.js", size: 100000 },
      ...Array.from({ length: 30 }, (_, i) => ({ path: `tiny-${i}`, size: 1 })),
    ];
    const cells = treemap(mods, 20, 5);
    expect(cells).toHaveLength(1);
    expect(cells[0].mod.path).toBe("main.js");
    expect(cells[0].w * cells[0].h).toBe(100);
  });

  it("preserves exact proportions when the canvas can represent them", () => {
    const mods = [50, 25, 25].map((size, index) => ({
      path: String(index),
      size,
    }));
    const cells = treemap(mods, 20, 10);
    expect(cells.map((cell) => cell.w * cell.h)).toEqual([100, 50, 50]);
  });

  it.each([
    [1, 1],
    [2, 7],
    [20, 5],
    [80, 24],
  ])("tiles a %ix%i canvas without overlaps or gaps", (width, height) => {
    for (const count of [1, 20, 200, 2000]) {
      const mods = Array.from({ length: count }, (_, i) => ({
        path: `file-${i}`,
        size: ((i * 7919) % 1000) + 1,
      }));
      const cells = treemap(mods, width, height);
      const occupied = new Set<string>();
      for (const cell of cells) {
        expect(cell.x).toBeGreaterThanOrEqual(0);
        expect(cell.y).toBeGreaterThanOrEqual(0);
        expect(cell.x + cell.w).toBeLessThanOrEqual(width);
        expect(cell.y + cell.h).toBeLessThanOrEqual(height);
        for (let y = cell.y; y < cell.y + cell.h; y++) {
          for (let x = cell.x; x < cell.x + cell.w; x++) {
            const position = `${x}:${y}`;
            expect(occupied.has(position)).toBe(false);
            occupied.add(position);
          }
        }
      }
      expect(occupied.size).toBe(width * height);
    }
  });
});

describe("draw", () => {
  it("fills the entire grid with no empty space for a single module", () => {
    const cells: CellType[] = [
      { x: 0, y: 0, w: 10, h: 5, mod: { path: "a", size: 100 } },
    ];
    const grid = draw(cells, 10, 5);
    const lines = grid.split("\n");
    expect(lines.length).toBe(5);
    for (const line of lines) {
      expect(line.length).toBe(10);
      expect(line).not.toContain(" ");
    }
  });

  it("produces correct grid dimensions", () => {
    const W = 30,
      H = 8;
    const grid = draw(treemap(sampleMods.slice(0, 2), W, H), W, H);
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

  it("color option produces ANSI escape codes", () => {
    const cells: CellType[] = [
      { x: 0, y: 0, w: 10, h: 3, mod: { path: "a", size: 100 } },
    ];
    const plain = draw(cells, 10, 3, { color: false });
    const colored = draw(cells, 10, 3, { color: true });
    expect(colored.length).toBeGreaterThan(plain.length);
  });

  it("centers labels inside their own rectangles", () => {
    const cells = treemap(
      [
        { path: "a", size: 50 },
        { path: "b", size: 50 },
      ],
      20,
      6,
    ).map((cell, index) => ({ ...cell, label: `[${index + 1}]` }));
    const lines = draw(cells, 20, 6).split("\n");
    for (const cell of cells) {
      const region = lines
        .slice(cell.y, cell.y + cell.h)
        .map((line) => line.slice(cell.x, cell.x + cell.w))
        .join("\n");
      expect(region).toContain(cell.label);
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
