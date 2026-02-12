/// <reference types="vitest" />

import { describe, expect, it } from "vitest";
import { renderReport } from "../src/modules/report/service";
import { SHADES } from "../src/modules/drawing/constants";
import type { Mod } from "../src/modules/shared/types";

const sampleMods: Mod[] = [
  { path: "node_modules/lodash/index.js", size: 72000 },
  { path: "node_modules/react/index.js", size: 6400 },
  { path: "src/components/App.tsx", size: 2400 },
  { path: "src/utils/api.ts", size: 1500 },
  { path: "src/index.ts", size: 820 },
];

const defaultOpts = {
  cols: 40, rows: 10, top: 10,
  legend: true, summary: true,
  color: false, labels: false, borders: false,
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
    const report = renderReport(sampleMods, { ...defaultOpts, cols: 30, rows: 8 });
    const lines = report.grid.split("\n");
    expect(lines.length).toBe(8);
    for (const line of lines) {
      expect(line.length).toBe(30);
    }
  });

  it("legend: false produces no legendLine", () => {
    const report = renderReport(sampleMods, { ...defaultOpts, legend: false });
    expect(report.legendLine).toBeUndefined();
  });

  it("summary: false produces no summaryLine", () => {
    const report = renderReport(sampleMods, { ...defaultOpts, summary: false });
    expect(report.summaryLine).toBeUndefined();
  });

  it("top limits tableLines to N entries plus header", () => {
    const report = renderReport(sampleMods, { ...defaultOpts, top: 3 });
    expect(report.tableLines.length).toBe(4);
    expect(report.tableLines[0]).toMatch(/Top 3 modules/);
  });

  it("table lines contain shade characters", () => {
    const report = renderReport(sampleMods, defaultOpts);
    const shadeChars = SHADES.join("");
    for (let i = 1; i < report.tableLines.length; i++) {
      const hasShade = [...report.tableLines[i]].some((ch) => shadeChars.includes(ch));
      expect(hasShade).toBe(true);
    }
  });

  it("table lines contain percentage values", () => {
    const report = renderReport(sampleMods, defaultOpts);
    for (let i = 1; i < report.tableLines.length; i++) {
      expect(report.tableLines[i]).toMatch(/\(\s*\d+\.\d+%\)/);
    }
  });

  it("summary line shows total size and module count", () => {
    const report = renderReport(sampleMods, defaultOpts);
    expect(report.summaryLine).toMatch(/Total bundle/);
    expect(report.summaryLine).toMatch(/modules: 5/);
  });

  it("legend line contains all shade characters", () => {
    const report = renderReport(sampleMods, defaultOpts);
    for (const shade of SHADES) {
      expect(report.legendLine).toContain(shade);
    }
  });

  it("truncates long module paths with ellipsis", () => {
    const longPathMods: Mod[] = [
      { path: "node_modules/some-very-long-package-name/dist/index.js", size: 5000 },
    ];
    const report = renderReport(longPathMods, { ...defaultOpts, top: 1 });
    expect(report.tableLines[1]).toContain("…");
  });

  it("handles single module correctly", () => {
    const single: Mod[] = [{ path: "app.js", size: 1000 }];
    const report = renderReport(single, { ...defaultOpts, top: 1 });
    expect(report.tableLines.length).toBe(2);
    expect(report.tableLines[1]).toMatch(/100\.0%/);
  });
});
