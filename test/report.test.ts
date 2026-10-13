/// <reference types="vitest" />

import { describe, expect, it } from "vitest";
import {
  renderReport,
  renderTerminalReport,
} from "../src/modules/report/service";
import { textWidth } from "../src/modules/text/service";
import { stripVTControlCharacters } from "node:util";
import { SHADES } from "../src/modules/drawing/service";
import type { ModuleType } from "../src/modules/shared/schema";

const sampleMods: ModuleType[] = [
  { path: "node_modules/lodash/index.js", size: 72000 },
  { path: "node_modules/react/index.js", size: 6400 },
  { path: "src/components/App.tsx", size: 2400 },
  { path: "src/utils/api.ts", size: 1500 },
  { path: "src/index.ts", size: 820 },
];

const defaultOpts = {
  cols: 40,
  rows: 10,
  top: 10,
};

describe("renderReport", () => {
  it("returns all expected fields", () => {
    const report = renderReport(sampleMods, defaultOpts);
    expect(report.grid).toBeDefined();
    expect(report.tableLines).toBeDefined();
    expect(report.legendLine).toBeDefined();
    expect(report.summaryLine).toBeDefined();
  });

  it("grid dimensions match cols x rows", () => {
    const report = renderReport(sampleMods, {
      ...defaultOpts,
      cols: 30,
      rows: 8,
    });
    const lines = report.grid.split("\n");
    expect(lines.length).toBe(8);
    for (const line of lines) {
      expect(line.length).toBe(30);
    }
  });

  it("top limits listed files and accounts for the rest in Other", () => {
    const report = renderReport(sampleMods, { ...defaultOpts, top: 3 });
    expect(report.tableLines[0]).toBe("Top 3 of 5 files");
    expect(report.tableLines).toHaveLength(5);
    expect(report.tableLines.at(-1)).toContain("Other total:");
  });

  it("table lines contain shade characters", () => {
    const report = renderReport(sampleMods, defaultOpts);
    const shadeChars = SHADES.join("");
    for (let i = 1; i <= sampleMods.length; i++) {
      const hasShade = [...report.tableLines[i]].some((ch) =>
        shadeChars.includes(ch),
      );
      expect(hasShade).toBe(true);
    }
  });

  it("table lines contain percentage values", () => {
    const report = renderReport(sampleMods, defaultOpts);
    for (let i = 1; i <= sampleMods.length; i++) {
      expect(report.tableLines[i]).toMatch(/\(\s*\d+\.\d+%\)/);
    }
  });

  it("summary line shows total size and module count", () => {
    const report = renderReport(sampleMods, defaultOpts);
    expect(report.summaryLine).toMatch(/Total:/);
    expect(report.summaryLine).toMatch(/5 files/);
  });

  it("explains how labels connect the map to files", () => {
    const report = renderReport(sampleMods, defaultOpts);
    expect(report.legendLine).toContain("[#] file");
    expect(report.legendLine).toContain("[O] Other");
  });

  it("truncates long module paths with ellipsis", () => {
    const longPathMods: ModuleType[] = [
      {
        path: "node_modules/some-very-long-package-name/dist/index.js",
        size: 5000,
      },
    ];
    const report = renderReport(longPathMods, { ...defaultOpts, top: 1 });
    expect(report.tableLines[1]).toContain("…");
  });

  it("handles single module correctly", () => {
    const single: ModuleType[] = [{ path: "app.js", size: 1000 }];
    const report = renderReport(single, { ...defaultOpts, top: 1 });
    expect(report.tableLines.length).toBe(2);
    expect(report.tableLines[1]).toMatch(/100\.0%/);
  });

  it("uses 0.0% when total size is zero", () => {
    const zeroMods: ModuleType[] = [
      { path: "a.js", size: 0 },
      { path: "b.js", size: 0 },
    ];
    const report = renderReport(zeroMods, { ...defaultOpts, top: 2 });
    expect(report.tableLines[1]).toContain("( 0.0%)");
    expect(report.tableLines[2]).toContain("( 0.0%)");
  });

  it("matches equal-size regions to their filenames with distinct labels", () => {
    const mods = [
      { path: "first.js", size: 100 },
      { path: "second.js", size: 100 },
    ];
    const report = renderReport(mods, defaultOpts);
    expect(report.grid).toContain("[1]");
    expect(report.grid).toContain("[2]");
    expect(report.tableLines[1]).toMatch(/\[1\].*first\.js/);
    expect(report.tableLines[2]).toMatch(/\[2\].*second\.js/);
  });

  it("groups small files and keeps every byte in the total", () => {
    const mods = [
      { path: "main.js", size: 1000 },
      ...Array.from({ length: 100 }, (_, i) => ({
        path: `tiny-${i}.js`,
        size: 2,
      })),
    ];
    const report = renderReport(mods, { cols: 80, rows: 10, top: 5 });
    expect(report.summaryLine).toBe("Total: 1.2 KB | 101 files");
    expect(report.grid).toContain("[1]");
    expect(report.grid).toContain("[O]");
    expect(report.tableLines.at(-1)).toBe(
      "Other group total: 100 files, 200 B (includes [O] rows)",
    );
    expect(report.tableLines[2]).toMatch(/\[O\].*tiny-0\.js/);
  });

  it("reports groups below map resolution without giving them false area", () => {
    const mods = [
      { path: "main.js", size: 100000 },
      { path: "tiny.js", size: 1 },
    ];
    const report = renderReport(mods, { cols: 80, rows: 5, top: 10 });
    expect(report.grid).not.toContain("[O]");
    expect(report.tableLines.at(-1)).toContain("below map resolution");
  });

  it("keeps an actual file named Other separate from the aggregate", () => {
    const mods = [
      { path: "Other", size: 100 },
      { path: "a", size: 50 },
      { path: "b", size: 50 },
    ];
    const report = renderReport(mods, { cols: 80, rows: 10, top: 1 });
    expect(report.grid).toContain("[1]");
    expect(report.grid).toContain("[O]");
    expect(report.tableLines[1]).toMatch(/\[1\].*Other/);
    expect(report.tableLines.at(-1)).toBe("Other group total: 2 files, 100 B");
  });

  it("explains overlapping Other rows even in a narrow report", () => {
    const mods = [
      { path: "main.js", size: 1000 },
      ...Array.from({ length: 100 }, (_, i) => ({
        path: `tiny-${i}.js`,
        size: 2,
      })),
    ];
    const report = renderReport(mods, { cols: 40, rows: 10, top: 5 });
    expect(report.tableLines.at(-1)).toBe(
      "Other total: 200 B (includes [O] rows)",
    );
  });

  it("offers the existing all-files option only when more files are hidden and the hint fits", () => {
    const wide = renderReport(sampleMods, { cols: 80, rows: 10, top: 3 });
    const narrow = renderReport(sampleMods, { cols: 40, rows: 10, top: 3 });
    const complete = renderReport(sampleMods, { cols: 80, rows: 10, top: 10 });
    expect(wide.tableLines[0]).toBe(
      "Top 3 of 5 files (--all to list every file)",
    );
    expect(narrow.tableLines[0]).toBe("Top 3 of 5 files");
    expect(complete.tableLines[0]).toBe("Top 5 of 5 files");
  });

  it.each([
    [1, "<0.1%"],
    [9, "<0.1%"],
    [10, " 0.1%"],
    [0, " 0.0%"],
  ])(
    "formats a %i-byte share without rounding positive values to zero",
    (size, expected) => {
      const mods = [
        { path: "main.js", size: 10000 - size },
        { path: "tiny.js", size },
      ];
      const report = renderReport(mods, { cols: 80, rows: 10, top: 2 });
      expect(report.tableLines[2]).toContain(`(${expected})`);
      expect(textWidth(report.tableLines[2])).toBeLessThanOrEqual(80);
    },
  );

  it("identifies the directory without changing totals", () => {
    const report = renderReport([{ path: "main.js", size: 1024 ** 3 * 2 }], {
      cols: 80,
      rows: 10,
      top: 10,
      directory: "dist",
    });
    expect(report.summaryLine).toBe("dist/ | Total: 2.0 GB | 1 files");
  });

  it.each(["assets/界面/very-long-directory/dist", "/", "dist/", "bad\nname"])(
    "keeps directory summaries within the terminal width for %s",
    (directory) => {
      const report = renderReport(sampleMods, { ...defaultOpts, directory });
      expect(textWidth(report.summaryLine)).toBeLessThanOrEqual(40);
      expect(report.summaryLine).toContain("Total: 81.2 KB | 5 files");
      expect(report.summaryLine).not.toContain("\n");
      expect(report.summaryLine).not.toContain("//");
    },
  );
});

describe("terminal report", () => {
  const mods = Array.from({ length: 50 }, (_, i) => ({
    path: `assets/界面/cafe\u0301-👩‍💻-component-${i}.js`,
    size: (50 - i) * 100,
  }));

  it.each([
    [80, 24],
    [40, 16],
    [20, 10],
    [120, 40],
    [10, 5],
  ])("fits a %ix%i terminal", (cols, rows) => {
    const output = stripVTControlCharacters(
      renderTerminalReport(mods, {
        cols,
        rows,
        top: 10,
        directory: "build/assets/界面",
      }),
    );
    const lines = output.split("\n");
    expect(lines.length).toBeLessThan(rows);
    for (const line of lines) expect(textWidth(line)).toBeLessThanOrEqual(cols);
  });

  it("keeps the full list when all files are explicitly requested", () => {
    const output = renderTerminalReport(
      mods,
      { cols: 80, rows: 24, top: 10 },
      true,
    );
    expect(output).toContain("Top 50 of 50 files");
    expect(output).not.toContain("--all");
    expect(output).toContain("component-49.js");
    expect(output).toContain("component-0.js");
    expect(output.split("\n").length).toBeGreaterThan(24);
  });
});
