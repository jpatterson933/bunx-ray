/// <reference types="vitest" />

import { describe, expect, it } from "vitest";
import {
  findDuplicates,
  renderDuplicateLines,
} from "../src/modules/duplicates/service";
import type { ModuleType } from "../src/modules/shared/types";

describe("findDuplicates", () => {
  it("detects duplicate node_modules packages", () => {
    const mods: ModuleType[] = [
      { path: "node_modules/lodash/index.js", size: 70000 },
      {
        path: "node_modules/pkg-a/node_modules/lodash/index.js",
        size: 70000,
      },
    ];
    const groups = findDuplicates(mods);
    expect(groups.length).toBe(1);
    expect(groups[0].name).toBe("lodash/index.js");
    expect(groups[0].instances.length).toBe(2);
  });

  it("calculates wasted size correctly", () => {
    const mods: ModuleType[] = [
      { path: "node_modules/lodash/index.js", size: 70000 },
      {
        path: "node_modules/pkg-a/node_modules/lodash/index.js",
        size: 72000,
      },
      {
        path: "node_modules/pkg-b/node_modules/lodash/index.js",
        size: 68000,
      },
    ];
    const groups = findDuplicates(mods);
    expect(groups[0].wastedSize).toBe(70000 + 68000);
  });

  it("returns empty array when no duplicates", () => {
    const mods: ModuleType[] = [
      { path: "node_modules/lodash/index.js", size: 70000 },
      { path: "node_modules/react/index.js", size: 6400 },
    ];
    const groups = findDuplicates(mods);
    expect(groups.length).toBe(0);
  });

  it("sorts by wasted size descending", () => {
    const mods: ModuleType[] = [
      { path: "node_modules/small/index.js", size: 1000 },
      { path: "node_modules/a/node_modules/small/index.js", size: 1000 },
      { path: "node_modules/lodash/index.js", size: 70000 },
      { path: "node_modules/b/node_modules/lodash/index.js", size: 70000 },
    ];
    const groups = findDuplicates(mods);
    expect(groups.length).toBe(2);
    expect(groups[0].wastedSize).toBeGreaterThanOrEqual(groups[1].wastedSize);
  });

  it("does not flag non-node_modules paths as duplicates", () => {
    const mods: ModuleType[] = [
      { path: "src/utils/helpers.ts", size: 1000 },
      { path: "src/lib/helpers.ts", size: 1200 },
    ];
    const groups = findDuplicates(mods);
    expect(groups.length).toBe(0);
  });

  it("handles scoped packages", () => {
    const mods: ModuleType[] = [
      { path: "node_modules/@scope/pkg/index.js", size: 5000 },
      {
        path: "node_modules/other/node_modules/@scope/pkg/index.js",
        size: 5000,
      },
    ];
    const groups = findDuplicates(mods);
    expect(groups.length).toBe(1);
    expect(groups[0].name).toBe("@scope/pkg/index.js");
  });

  it("returns empty array for empty input", () => {
    const groups = findDuplicates([]);
    expect(groups.length).toBe(0);
  });
});

describe("renderDuplicateLines", () => {
  it("returns empty array when no duplicates", () => {
    const lines = renderDuplicateLines([]);
    expect(lines.length).toBe(0);
  });

  it("produces formatted output", () => {
    const mods: ModuleType[] = [
      { path: "node_modules/lodash/index.js", size: 70000 },
      {
        path: "node_modules/pkg-a/node_modules/lodash/index.js",
        size: 70000,
      },
    ];
    const groups = findDuplicates(mods);
    const lines = renderDuplicateLines(groups);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0]).toContain("Potential duplicates");
    expect(lines[0]).toContain("wasted");
  });

  it("lists all instance paths", () => {
    const mods: ModuleType[] = [
      { path: "node_modules/lodash/index.js", size: 70000 },
      {
        path: "node_modules/pkg-a/node_modules/lodash/index.js",
        size: 70000,
      },
    ];
    const groups = findDuplicates(mods);
    const lines = renderDuplicateLines(groups);
    const allText = lines.join("\n");
    expect(allText).toContain("node_modules/lodash/index.js");
    expect(allText).toContain(
      "node_modules/pkg-a/node_modules/lodash/index.js",
    );
  });
});
