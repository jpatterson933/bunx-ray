/// <reference types="vitest" />

import { describe, expect, it } from "vitest";
import {
  renderMarkdownReport,
  renderMarkdownDiff,
} from "../src/modules/markdown/service";
import { diffMods } from "../src/modules/diff/service";
import type { ModuleType } from "../src/modules/shared/types";

const sampleMods: ModuleType[] = [
  { path: "node_modules/lodash/index.js", size: 72000 },
  { path: "node_modules/react/index.js", size: 6400 },
  { path: "src/components/App.tsx", size: 2400 },
  { path: "src/utils/api.ts", size: 1500 },
  { path: "src/index.ts", size: 820 },
];

describe("renderMarkdownReport", () => {
  it("returns a markdown string with header", () => {
    const output = renderMarkdownReport(sampleMods, { top: 10 });
    expect(output).toContain("### bunx-ray");
  });

  it("contains a markdown table", () => {
    const output = renderMarkdownReport(sampleMods, { top: 10 });
    expect(output).toContain("| # |");
    expect(output).toContain("|---|");
  });

  it("includes total size and module count", () => {
    const output = renderMarkdownReport(sampleMods, { top: 10 });
    expect(output).toContain("**Total:**");
    expect(output).toContain("**Modules:** 5");
  });

  it("respects top parameter", () => {
    const output = renderMarkdownReport(sampleMods, { top: 2 });
    const tableRows = output
      .split("\n")
      .filter(
        (l) =>
          l.startsWith("| ") && !l.startsWith("| #") && !l.startsWith("|--"),
      );
    expect(tableRows.length).toBe(2);
  });

  it("includes bar chart characters", () => {
    const output = renderMarkdownReport(sampleMods, { top: 10 });
    expect(output).toContain("█");
  });

  it("truncates long module paths", () => {
    const longMods: ModuleType[] = [
      {
        path: "node_modules/very-long-package-name/dist/lib/deeply/nested/module/index.js",
        size: 5000,
      },
    ];
    const output = renderMarkdownReport(longMods, { top: 1 });
    expect(output).toContain("…");
  });

  it("handles single module", () => {
    const single: ModuleType[] = [{ path: "app.js", size: 1000 }];
    const output = renderMarkdownReport(single, { top: 1 });
    expect(output).toContain("100.0%");
  });
});

describe("renderMarkdownDiff", () => {
  const oldMods: ModuleType[] = [
    { path: "lodash.js", size: 65000 },
    { path: "react.js", size: 6400 },
    { path: "old-utils.js", size: 3200 },
  ];

  const newMods: ModuleType[] = [
    { path: "lodash.js", size: 72000 },
    { path: "react.js", size: 6400 },
    { path: "global.css", size: 2100 },
  ];

  it("includes diff header", () => {
    const result = diffMods(oldMods, newMods);
    const output = renderMarkdownDiff(result);
    expect(output).toContain("### bunx-ray — Diff Report");
  });

  it("shows total comparison", () => {
    const result = diffMods(oldMods, newMods);
    const output = renderMarkdownDiff(result);
    expect(output).toContain("**Total:**");
    expect(output).toContain("→");
  });

  it("shows changed modules", () => {
    const result = diffMods(oldMods, newMods);
    const output = renderMarkdownDiff(result);
    expect(output).toContain("#### Changed");
    expect(output).toContain("lodash.js");
  });

  it("shows added modules", () => {
    const result = diffMods(oldMods, newMods);
    const output = renderMarkdownDiff(result);
    expect(output).toContain("#### Added");
    expect(output).toContain("global.css");
  });

  it("shows removed modules", () => {
    const result = diffMods(oldMods, newMods);
    const output = renderMarkdownDiff(result);
    expect(output).toContain("#### Removed");
    expect(output).toContain("old-utils.js");
  });

  it("shows unchanged count", () => {
    const result = diffMods(oldMods, newMods);
    const output = renderMarkdownDiff(result);
    expect(output).toContain("unchanged module");
  });
});
