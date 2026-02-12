/// <reference types="vitest" />

import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import {
  draw,
  normalizeEsbuild,
  normalizeVite,
  normalizeWebpack,
  treemap,
} from "../src/bundle";

const fixturesDir = new URL("../fixtures/", import.meta.url).pathname;

function load(name: string) {
  return JSON.parse(readFileSync(`${fixturesDir}${name}`, "utf8"));
}

describe("normalize + draw", () => {
  it("webpack fixture renders", () => {
    const mods = normalizeWebpack(load("webpack-sample.json"));
    const ascii = draw(treemap(mods, 40, 8), 40, 8);
    expect(ascii).toMatchSnapshot();
  });

  it("vite fixture renders", () => {
    const mods = normalizeVite(load("vite-sample.json"));
    const ascii = draw(treemap(mods, 40, 8), 40, 8);
    expect(ascii).toMatchSnapshot();
  });

  it("esbuild fixture renders", () => {
    const mods = normalizeEsbuild(load("esbuild-sample.json"));
    const ascii = draw(treemap(mods, 40, 8), 40, 8);
    expect(ascii).toMatchSnapshot();
  });
});
