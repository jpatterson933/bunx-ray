/// <reference types="vitest" />

import { describe, expect, it } from "vitest";
import {
  checkBudget,
  checkTotalBudget,
  formatBudgetViolations,
  formatTotalBudgetViolation,
  parseSize,
} from "../src/modules/budget/service";
import type { Mod } from "../src/modules/shared/types";

describe("parseSize", () => {
  it("parses bytes", () => {
    expect(parseSize("500B")).toBe(500);
  });

  it("parses kilobytes", () => {
    expect(parseSize("50KB")).toBe(50 * 1024);
  });

  it("parses megabytes", () => {
    expect(parseSize("2MB")).toBe(2 * 1024 * 1024);
  });

  it("parses decimal values", () => {
    expect(parseSize("1.5KB")).toBe(Math.round(1.5 * 1024));
  });

  it("defaults to bytes when no unit", () => {
    expect(parseSize("100")).toBe(100);
  });

  it("is case insensitive", () => {
    expect(parseSize("50kb")).toBe(50 * 1024);
    expect(parseSize("2mb")).toBe(2 * 1024 * 1024);
  });

  it("throws on invalid format", () => {
    expect(() => parseSize("abc")).toThrow("Invalid size format");
  });

  it("throws on empty string", () => {
    expect(() => parseSize("")).toThrow("Invalid size format");
  });
});

const sampleMods: Mod[] = [
  { path: "lodash.js", size: 72000 },
  { path: "moment.js", size: 55000 },
  { path: "react.js", size: 6400 },
  { path: "app.js", size: 1000 },
];

describe("checkBudget", () => {
  it("returns violations for modules exceeding budget", () => {
    const violations = checkBudget(sampleMods, 60000);
    expect(violations.length).toBe(1);
    expect(violations[0].mod.path).toBe("lodash.js");
    expect(violations[0].over).toBe(12000);
  });

  it("returns empty array when all modules under budget", () => {
    const violations = checkBudget(sampleMods, 100000);
    expect(violations.length).toBe(0);
  });

  it("returns multiple violations sorted by size", () => {
    const violations = checkBudget(sampleMods, 5000);
    expect(violations.length).toBe(3);
    expect(violations[0].mod.size).toBeGreaterThanOrEqual(violations[1].mod.size);
  });
});

describe("checkTotalBudget", () => {
  it("returns violation when total exceeds budget", () => {
    const total = sampleMods.reduce((a, m) => a + m.size, 0);
    const violation = checkTotalBudget(sampleMods, 100000);
    expect(violation).not.toBeNull();
    expect(violation!.total).toBe(total);
    expect(violation!.over).toBe(total - 100000);
  });

  it("returns null when total is under budget", () => {
    const violation = checkTotalBudget(sampleMods, 200000);
    expect(violation).toBeNull();
  });
});

describe("formatBudgetViolations", () => {
  it("produces formatted output lines", () => {
    const violations = checkBudget(sampleMods, 60000);
    const lines = formatBudgetViolations(violations, 60000);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toMatch(/Budget violations/);
    expect(lines.some((l) => l.includes("FAIL"))).toBe(true);
  });
});

describe("formatTotalBudgetViolation", () => {
  it("produces formatted output lines", () => {
    const violation = checkTotalBudget(sampleMods, 100000)!;
    const lines = formatTotalBudgetViolation(violation);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toMatch(/Total budget violation/);
  });
});
