/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import {
  groupByPackage,
  renderPackageLines,
} from "../src/modules/grouping/service";
import type { ModuleType } from "../src/modules/shared/types";

describe("groupByPackage", () => {
  it("groups modules by npm package", () => {
    const mods: ModuleType[] = [
      { path: "node_modules/lodash/cloneDeep.js", size: 18000 },
      { path: "node_modules/lodash/merge.js", size: 12000 },
      { path: "node_modules/react/index.js", size: 6400 },
    ];
    const groups = groupByPackage(mods);
    expect(groups.length).toBe(2);
    expect(groups[0].name).toBe("lodash");
    expect(groups[0].size).toBe(30000);
    expect(groups[0].moduleCount).toBe(2);
  });

  it("handles scoped packages", () => {
    const mods: ModuleType[] = [
      { path: "node_modules/@babel/core/lib/index.js", size: 5000 },
      { path: "node_modules/@babel/core/lib/parse.js", size: 3000 },
      { path: "node_modules/@babel/parser/lib/index.js", size: 8000 },
    ];
    const groups = groupByPackage(mods);
    expect(groups.length).toBe(2);
    const core = groups.find((g) => g.name === "@babel/core");
    expect(core).toBeDefined();
    expect(core!.size).toBe(8000);
    expect(core!.moduleCount).toBe(2);
  });

  it("skips non-node_modules paths", () => {
    const mods: ModuleType[] = [
      { path: "src/index.ts", size: 1000 },
      { path: "src/utils.ts", size: 500 },
      { path: "node_modules/react/index.js", size: 6400 },
    ];
    const groups = groupByPackage(mods);
    expect(groups.length).toBe(1);
    expect(groups[0].name).toBe("react");
  });

  it("sorts by size descending", () => {
    const mods: ModuleType[] = [
      { path: "node_modules/small/index.js", size: 1000 },
      { path: "node_modules/large/index.js", size: 50000 },
      { path: "node_modules/medium/index.js", size: 10000 },
    ];
    const groups = groupByPackage(mods);
    expect(groups[0].name).toBe("large");
    expect(groups[1].name).toBe("medium");
    expect(groups[2].name).toBe("small");
  });

  it("returns empty array when no node_modules", () => {
    const mods: ModuleType[] = [{ path: "src/index.ts", size: 1000 }];
    const groups = groupByPackage(mods);
    expect(groups.length).toBe(0);
  });

  it("handles nested node_modules", () => {
    const mods: ModuleType[] = [
      {
        path: "node_modules/pkg-a/node_modules/lodash/index.js",
        size: 5000,
      },
    ];
    const groups = groupByPackage(mods);
    expect(groups.length).toBe(1);
    expect(groups[0].name).toBe("lodash");
  });
});

describe("renderPackageLines", () => {
  it("returns empty array for no packages", () => {
    const lines = renderPackageLines([]);
    expect(lines.length).toBe(0);
  });

  it("renders header and package entries", () => {
    const groups = [
      { name: "lodash", size: 72000, moduleCount: 12 },
      { name: "react", size: 6400, moduleCount: 2 },
    ];
    const lines = renderPackageLines(groups);
    expect(lines[0]).toContain("Heaviest packages");
    expect(lines.length).toBe(3);
    expect(lines[1]).toContain("lodash");
    expect(lines[2]).toContain("react");
  });

  it("uses singular module for count of 1", () => {
    const groups = [{ name: "lodash", size: 72000, moduleCount: 1 }];
    const lines = renderPackageLines(groups);
    expect(lines[1]).toContain("1 module)");
    expect(lines[1]).not.toContain("modules)");
  });
});
