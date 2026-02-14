/// <reference types="vitest" />

import { describe, expect, it } from "vitest";
import { renderJsonReport } from "../src/modules/json-output/service";
import type { ModuleType } from "../src/modules/shared/types";

const sampleMods: ModuleType[] = [
  { path: "node_modules/lodash/index.js", size: 72000 },
  { path: "node_modules/react/index.js", size: 6400 },
  { path: "src/components/App.tsx", size: 2400 },
];

describe("renderJsonReport", () => {
  it("returns total and formatted total", () => {
    const report = renderJsonReport(sampleMods, { top: 10 });
    expect(report.total).toBe(80800);
    expect(report.totalFormatted).toBe("78.9 KB");
  });

  it("returns module count", () => {
    const report = renderJsonReport(sampleMods, { top: 10 });
    expect(report.moduleCount).toBe(3);
  });

  it("returns all modules", () => {
    const report = renderJsonReport(sampleMods, { top: 10 });
    expect(report.modules.length).toBe(3);
    expect(report.modules[0]).toHaveProperty("path");
    expect(report.modules[0]).toHaveProperty("size");
  });

  it("returns top modules with percentage", () => {
    const report = renderJsonReport(sampleMods, { top: 2 });
    expect(report.top.length).toBe(2);
    expect(report.top[0]).toHaveProperty("pct");
    expect(report.top[0].pct).toBeGreaterThan(0);
  });

  it("top modules are sorted by size descending", () => {
    const report = renderJsonReport(sampleMods, { top: 10 });
    for (let i = 1; i < report.top.length; i++) {
      expect(report.top[i - 1].size).toBeGreaterThanOrEqual(report.top[i].size);
    }
  });

  it("is valid JSON when stringified", () => {
    const report = renderJsonReport(sampleMods, { top: 10 });
    const json = JSON.stringify(report);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
