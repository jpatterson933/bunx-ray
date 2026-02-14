/// <reference types="vitest" />

import { describe, expect, it } from "vitest";
import { extractChunks, renderChunkLines } from "../src/modules/chunks/service";

describe("extractChunks", () => {
  it("extracts webpack chunks", () => {
    const stats = {
      chunks: [
        {
          names: ["main"],
          size: 50000,
          id: 1,
          modules: [
            { name: "a.js", size: 30000 },
            { name: "b.js", size: 20000 },
          ],
        },
        {
          names: ["vendor"],
          size: 120000,
          id: 2,
          modules: [{ name: "c.js", size: 120000 }],
        },
      ],
      modules: [],
    };
    const chunks = extractChunks(stats, { webpack: true });
    expect(chunks.length).toBe(2);
    expect(chunks[0].name).toBe("main");
    expect(chunks[0].size).toBe(50000);
    expect(chunks[0].moduleCount).toBe(2);
  });

  it("extracts esbuild chunks", () => {
    const meta = {
      inputs: {},
      outputs: {
        "dist/main.js": {
          bytes: 50000,
          inputs: {
            "a.js": { bytesInOutput: 30000 },
            "b.js": { bytesInOutput: 20000 },
          },
        },
        "dist/vendor.js": {
          bytes: 120000,
          inputs: { "c.js": { bytesInOutput: 120000 } },
        },
      },
    };
    const chunks = extractChunks(meta, { esbuild: true });
    expect(chunks.length).toBe(2);
    expect(chunks[0].name).toBe("dist/main.js");
    expect(chunks[0].size).toBe(50000);
    expect(chunks[0].moduleCount).toBe(2);
  });

  it("extracts rollup chunks and skips assets", () => {
    const stats = {
      output: [
        {
          type: "chunk",
          fileName: "index.js",
          modules: {
            "src/index.ts": { renderedLength: 2400 },
            "src/utils.ts": { renderedLength: 1800 },
          },
        },
        {
          type: "chunk",
          fileName: "vendor.js",
          modules: {
            "node_modules/lodash/index.js": { renderedLength: 18200 },
          },
        },
        {
          type: "asset",
          fileName: "style.css",
        },
      ],
    };
    const chunks = extractChunks(stats, { rollup: true });
    expect(chunks.length).toBe(2);
    expect(chunks[0].name).toBe("index.js");
    expect(chunks[0].moduleCount).toBe(2);
    expect(chunks[0].size).toBe(4200);
    expect(chunks[1].name).toBe("vendor.js");
    expect(chunks[1].size).toBe(18200);
  });

  it("auto-detects webpack format", () => {
    const stats = {
      chunks: [{ names: ["main"], size: 100, modules: [] }],
      modules: [],
    };
    const chunks = extractChunks(stats, {});
    expect(chunks.length).toBe(1);
  });

  it("auto-detects esbuild format", () => {
    const meta = {
      inputs: {},
      outputs: { "out.js": { bytes: 100, inputs: {} } },
    };
    const chunks = extractChunks(meta, {});
    expect(chunks.length).toBe(1);
  });

  it("auto-detects rollup format", () => {
    const stats = {
      output: [
        {
          type: "chunk",
          fileName: "out.js",
          modules: { "a.ts": { renderedLength: 50 } },
        },
      ],
    };
    const chunks = extractChunks(stats, {});
    expect(chunks.length).toBe(1);
  });

  it("returns empty array for unknown format", () => {
    const chunks = extractChunks({}, {});
    expect(chunks.length).toBe(0);
  });
});

describe("renderChunkLines", () => {
  it("returns empty array for single chunk", () => {
    const lines = renderChunkLines([
      { name: "main.js", size: 50000, moduleCount: 10 },
    ]);
    expect(lines.length).toBe(0);
  });

  it("renders summary for multiple chunks", () => {
    const chunks = [
      { name: "main.js", size: 50000, moduleCount: 10 },
      { name: "vendor.js", size: 120000, moduleCount: 25 },
    ];
    const lines = renderChunkLines(chunks);
    expect(lines[0]).toContain("Chunks (2)");
    expect(lines.length).toBe(3);
  });

  it("sorts chunks by size descending", () => {
    const chunks = [
      { name: "small.js", size: 1000, moduleCount: 1 },
      { name: "large.js", size: 50000, moduleCount: 10 },
    ];
    const lines = renderChunkLines(chunks);
    expect(lines[1]).toContain("large.js");
    expect(lines[2]).toContain("small.js");
  });

  it("shows module count per chunk", () => {
    const chunks = [
      { name: "a.js", size: 5000, moduleCount: 3 },
      { name: "b.js", size: 3000, moduleCount: 1 },
    ];
    const lines = renderChunkLines(chunks);
    expect(lines[1]).toContain("3 modules");
    expect(lines[2]).toContain("1 module)");
  });

  it("returns empty array for empty input", () => {
    const lines = renderChunkLines([]);
    expect(lines.length).toBe(0);
  });
});
