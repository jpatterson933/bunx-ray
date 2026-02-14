/// <reference types="vitest" />

import { describe, expect, it } from "vitest";
import { formatAnnotations } from "../src/modules/ci/service";

describe("formatAnnotations", () => {
  it("formats module size violations as GitHub Actions errors", () => {
    const violations = [
      {
        module: { path: "lodash.js", size: 72000 },
        moduleSize: 51200,
        overBy: 20800,
      },
    ];
    const lines = formatAnnotations(violations, null);
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatch(/^::error title=/);
    expect(lines[0]).toContain("lodash.js");
    expect(lines[0]).toContain("exceeds");
  });

  it("formats total size violation as GitHub Actions error", () => {
    const totalViolation = {
      totalModuleSize: 512000,
      moduleSize: 307200,
      overBy: 204800,
    };
    const lines = formatAnnotations([], totalViolation);
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatch(/^::error title=/);
    expect(lines[0]).toContain("Total bundle");
  });

  it("returns empty array when no violations", () => {
    const lines = formatAnnotations([], null);
    expect(lines.length).toBe(0);
  });

  it("handles multiple module violations", () => {
    const violations = [
      {
        module: { path: "a.js", size: 60000 },
        moduleSize: 50000,
        overBy: 10000,
      },
      {
        module: { path: "b.js", size: 55000 },
        moduleSize: 50000,
        overBy: 5000,
      },
    ];
    const lines = formatAnnotations(violations, null);
    expect(lines.length).toBe(2);
  });

  it("combines module and total violations", () => {
    const violations = [
      {
        module: { path: "a.js", size: 60000 },
        moduleSize: 50000,
        overBy: 10000,
      },
    ];
    const totalViolation = {
      totalModuleSize: 200000,
      moduleSize: 150000,
      overBy: 50000,
    };
    const lines = formatAnnotations(violations, totalViolation);
    expect(lines.length).toBe(2);
  });

  it("includes size details in annotation message", () => {
    const violations = [
      {
        module: { path: "big.js", size: 102400 },
        moduleSize: 51200,
        overBy: 51200,
      },
    ];
    const lines = formatAnnotations(violations, null);
    expect(lines[0]).toContain("100.0 KB");
    expect(lines[0]).toContain("50.0 KB");
  });
});
