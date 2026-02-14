/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  saveSnapshot,
  loadSnapshot,
  compareSnapshot,
  renderTrendLines,
} from "../src/modules/snapshot/service";
import type { ModuleType } from "../src/modules/shared/types";
import type { SnapshotComparisonType } from "../src/modules/snapshot/types";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "bunxray-snapshot-"));
}

describe("saveSnapshot / loadSnapshot", () => {
  it("saves and loads a snapshot", () => {
    const tmpDir = makeTmpDir();
    const file = path.join(tmpDir, "snapshot.json");
    const modules: ModuleType[] = [
      { path: "lodash.js", size: 72000 },
      { path: "react.js", size: 6400 },
    ];

    saveSnapshot(modules, file);
    const loaded = loadSnapshot(file);

    expect(loaded).not.toBeNull();
    expect(loaded!.modules.length).toBe(2);
    expect(loaded!.total).toBe(78400);
    expect(loaded!.timestamp).toBeTruthy();

    fs.rmSync(tmpDir, { recursive: true });
  });

  it("returns null when file does not exist", () => {
    const result = loadSnapshot("/nonexistent/path/snapshot.json");
    expect(result).toBeNull();
  });
});

describe("compareSnapshot", () => {
  it("detects size increases", () => {
    const snapshot = {
      timestamp: "2026-01-01T00:00:00Z",
      total: 70000,
      modules: [{ path: "lodash.js", size: 70000 }],
    };
    const current: ModuleType[] = [{ path: "lodash.js", size: 75000 }];

    const result = compareSnapshot(current, snapshot);
    expect(result.changed.length).toBe(1);
    expect(result.changed[0].delta).toBe(5000);
  });

  it("detects size decreases", () => {
    const snapshot = {
      timestamp: "2026-01-01T00:00:00Z",
      total: 72000,
      modules: [{ path: "lodash.js", size: 72000 }],
    };
    const current: ModuleType[] = [{ path: "lodash.js", size: 68000 }];

    const result = compareSnapshot(current, snapshot);
    expect(result.changed.length).toBe(1);
    expect(result.changed[0].delta).toBe(-4000);
  });

  it("counts unchanged modules", () => {
    const snapshot = {
      timestamp: "2026-01-01T00:00:00Z",
      total: 78400,
      modules: [
        { path: "lodash.js", size: 72000 },
        { path: "react.js", size: 6400 },
      ],
    };
    const current: ModuleType[] = [
      { path: "lodash.js", size: 72000 },
      { path: "react.js", size: 6400 },
    ];

    const result = compareSnapshot(current, snapshot);
    expect(result.changed.length).toBe(0);
    expect(result.unchangedCount).toBe(2);
  });

  it("counts new modules", () => {
    const snapshot = {
      timestamp: "2026-01-01T00:00:00Z",
      total: 72000,
      modules: [{ path: "lodash.js", size: 72000 }],
    };
    const current: ModuleType[] = [
      { path: "lodash.js", size: 72000 },
      { path: "new-module.js", size: 5000 },
    ];

    const result = compareSnapshot(current, snapshot);
    expect(result.newCount).toBe(1);
  });

  it("counts removed modules", () => {
    const snapshot = {
      timestamp: "2026-01-01T00:00:00Z",
      total: 78400,
      modules: [
        { path: "lodash.js", size: 72000 },
        { path: "old-module.js", size: 6400 },
      ],
    };
    const current: ModuleType[] = [{ path: "lodash.js", size: 72000 }];

    const result = compareSnapshot(current, snapshot);
    expect(result.removedCount).toBe(1);
  });

  it("sorts changed by absolute delta descending", () => {
    const snapshot = {
      timestamp: "2026-01-01T00:00:00Z",
      total: 60000,
      modules: [
        { path: "a.js", size: 10000 },
        { path: "b.js", size: 50000 },
      ],
    };
    const current: ModuleType[] = [
      { path: "a.js", size: 15000 },
      { path: "b.js", size: 30000 },
    ];

    const result = compareSnapshot(current, snapshot);
    expect(Math.abs(result.changed[0].delta)).toBeGreaterThanOrEqual(
      Math.abs(result.changed[1].delta),
    );
  });
});

describe("renderTrendLines", () => {
  it("shows no-changes message when everything is unchanged", () => {
    const comparison: SnapshotComparisonType = {
      changed: [],
      unchangedCount: 5,
      newCount: 0,
      removedCount: 0,
    };
    const lines = renderTrendLines(comparison);
    expect(lines[0]).toContain("Trends");
    expect(lines.some((l) => l.includes("No changes"))).toBe(true);
  });

  it("shows up arrows for increases", () => {
    const comparison: SnapshotComparisonType = {
      changed: [
        {
          path: "a.js",
          currentSize: 10000,
          previousSize: 5000,
          delta: 5000,
        },
      ],
      unchangedCount: 0,
      newCount: 0,
      removedCount: 0,
    };
    const lines = renderTrendLines(comparison);
    expect(lines.some((l) => l.includes("↑"))).toBe(true);
  });

  it("shows down arrows for decreases", () => {
    const comparison: SnapshotComparisonType = {
      changed: [
        {
          path: "a.js",
          currentSize: 3000,
          previousSize: 5000,
          delta: -2000,
        },
      ],
      unchangedCount: 0,
      newCount: 0,
      removedCount: 0,
    };
    const lines = renderTrendLines(comparison);
    expect(lines.some((l) => l.includes("↓"))).toBe(true);
  });

  it("includes summary counts", () => {
    const comparison: SnapshotComparisonType = {
      changed: [
        {
          path: "a.js",
          currentSize: 10000,
          previousSize: 5000,
          delta: 5000,
        },
      ],
      unchangedCount: 3,
      newCount: 1,
      removedCount: 2,
    };
    const allText = renderTrendLines(comparison).join("\n");
    expect(allText).toContain("3 unchanged");
    expect(allText).toContain("1 new");
    expect(allText).toContain("2 removed");
  });
});
