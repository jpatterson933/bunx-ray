/// <reference types="vitest" />

import { describe, expect, it } from "vitest";
import { diffMods, renderDiff } from "../src/modules/diff/service";
import type { Mod } from "../src/modules/shared/types";

const oldMods: Mod[] = [
  { path: "lodash.js", size: 65000 },
  { path: "react.js", size: 6400 },
  { path: "old-utils.js", size: 3200 },
  { path: "api.ts", size: 2000 },
];

const newMods: Mod[] = [
  { path: "lodash.js", size: 72000 },
  { path: "react.js", size: 6400 },
  { path: "api.ts", size: 1500 },
  { path: "global.css", size: 2100 },
];

describe("diffMods", () => {
  it("detects changed modules", () => {
    const result = diffMods(oldMods, newMods);
    expect(result.changed.length).toBe(2);
    const lodash = result.changed.find((d) => d.path === "lodash.js");
    expect(lodash).toBeDefined();
    expect(lodash!.delta).toBe(7000);
  });

  it("detects unchanged modules", () => {
    const result = diffMods(oldMods, newMods);
    expect(result.unchanged.length).toBe(1);
    expect(result.unchanged[0].path).toBe("react.js");
  });

  it("detects added modules", () => {
    const result = diffMods(oldMods, newMods);
    expect(result.added.length).toBe(1);
    expect(result.added[0].path).toBe("global.css");
    expect(result.added[0].oldSize).toBeNull();
  });

  it("detects removed modules", () => {
    const result = diffMods(oldMods, newMods);
    expect(result.removed.length).toBe(1);
    expect(result.removed[0].path).toBe("old-utils.js");
    expect(result.removed[0].newSize).toBeNull();
  });

  it("calculates correct totals", () => {
    const result = diffMods(oldMods, newMods);
    expect(result.oldTotal).toBe(76600);
    expect(result.newTotal).toBe(82000);
    expect(result.totalDelta).toBe(5400);
  });

  it("calculates percentage change", () => {
    const result = diffMods(oldMods, newMods);
    const api = result.changed.find((d) => d.path === "api.ts");
    expect(api!.pctChange).toBeCloseTo(-25.0, 0);
  });

  it("sorts changed by absolute delta descending", () => {
    const result = diffMods(oldMods, newMods);
    for (let i = 1; i < result.changed.length; i++) {
      expect(Math.abs(result.changed[i - 1].delta)).toBeGreaterThanOrEqual(
        Math.abs(result.changed[i].delta),
      );
    }
  });

  it("handles empty old mods (all added)", () => {
    const result = diffMods([], newMods);
    expect(result.added.length).toBe(newMods.length);
    expect(result.changed.length).toBe(0);
    expect(result.removed.length).toBe(0);
  });

  it("handles empty new mods (all removed)", () => {
    const result = diffMods(oldMods, []);
    expect(result.removed.length).toBe(oldMods.length);
    expect(result.changed.length).toBe(0);
    expect(result.added.length).toBe(0);
  });

  it("handles identical inputs", () => {
    const result = diffMods(oldMods, oldMods);
    expect(result.changed.length).toBe(0);
    expect(result.unchanged.length).toBe(oldMods.length);
    expect(result.added.length).toBe(0);
    expect(result.removed.length).toBe(0);
    expect(result.totalDelta).toBe(0);
  });
});

describe("renderDiff", () => {
  it("produces formatted output lines", () => {
    const result = diffMods(oldMods, newMods);
    const lines = renderDiff(result);
    expect(lines.length).toBeGreaterThan(0);
  });

  it("includes total summary", () => {
    const result = diffMods(oldMods, newMods);
    const lines = renderDiff(result);
    const totalLine = lines.find((l) => l.includes("Total:"));
    expect(totalLine).toBeDefined();
  });

  it("includes added section", () => {
    const result = diffMods(oldMods, newMods);
    const lines = renderDiff(result);
    const addedLine = lines.find((l) => l.includes("Added"));
    expect(addedLine).toBeDefined();
  });

  it("includes removed section", () => {
    const result = diffMods(oldMods, newMods);
    const lines = renderDiff(result);
    const removedLine = lines.find((l) => l.includes("Removed"));
    expect(removedLine).toBeDefined();
  });

  it("includes unchanged count", () => {
    const result = diffMods(oldMods, newMods);
    const lines = renderDiff(result);
    const unchangedLine = lines.find((l) => l.includes("unchanged"));
    expect(unchangedLine).toBeDefined();
  });
});
