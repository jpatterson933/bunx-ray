/// <reference types="vitest" />

import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { buildWhyGraph, findWhyChains } from "../src/modules/why/service";

const fixturesDir = new URL("../fixtures/", import.meta.url).pathname;

function load(name: string) {
  return JSON.parse(readFileSync(`${fixturesDir}${name}`, "utf8"));
}

describe("why graph (esbuild)", () => {
  it("builds edges from imports and exposes entrypoints", () => {
    const graph = buildWhyGraph(load("esbuild-sample.json"), {
      esbuild: true,
    });

    expect(graph.entrypoints).toContain("src-esbuild/index.ts");

    const edges = graph.edges.get("src-esbuild/index.ts");
    expect(edges).toBeTruthy();
    expect([...edges!]).toContain("src-esbuild/math.ts");
  });

  it("finds shortest chain from entry to target", () => {
    const graph = buildWhyGraph(load("esbuild-sample.json"), {
      esbuild: true,
    });

    const [chain] = findWhyChains(graph, ["src-esbuild/math.ts"]);

    expect(chain).toEqual({
      target: "src-esbuild/math.ts",
      entry: "src-esbuild/index.ts",
      chain: ["src-esbuild/index.ts", "src-esbuild/math.ts"],
      missing: false,
    });
  });
});

describe("why graph (webpack)", () => {
  it("links issuer to module using stats metadata", () => {
    const graph = buildWhyGraph(load("webpack-sample.json"), {
      webpack: true,
    });

    const entry =
      "/Users/jeffpatterson/Desktop/repos/bunx-ray/src-webpack/index.js";
    const target =
      "/Users/jeffpatterson/Desktop/repos/bunx-ray/src-webpack/math.js";

    expect(graph.entrypoints).toContain(entry);

    const edges = graph.edges.get(entry);
    expect(edges).toBeTruthy();
    expect([...edges!]).toContain(target);

    const [chain] = findWhyChains(graph, [target]);
    expect(chain.chain).toEqual([entry, target]);
    expect(chain.missing).toBe(false);
  });
});

describe("why graph (vite)", () => {
  it("marks chains as missing when stats lack import edges", () => {
    const graph = buildWhyGraph(load("vite-sample.json"), { vite: true });

    const [chain] = findWhyChains(graph, ["/src-vite/math.ts"]);

    expect(chain.missing).toBe(true);
  });
});
