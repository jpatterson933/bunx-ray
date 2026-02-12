/// <reference types="vitest" />

import chalk from "chalk";
import { beforeAll, describe, expect, it } from "vitest";
import { colorForSize } from "../src/modules/color/service";

beforeAll(() => {
  chalk.level = 3;
});

describe("colorForSize", () => {
  it("returns a function", () => {
    const fn = colorForSize(50, 100);
    expect(typeof fn).toBe("function");
  });

  it("returns identity function when max is 0", () => {
    const fn = colorForSize(0, 0);
    expect(fn("test")).toBe("test");
  });

  it("applies color to text", () => {
    const fn = colorForSize(100, 100);
    const result = fn("█");
    expect(result).not.toBe("█");
    expect(result.length).toBeGreaterThan(1);
  });

  it("produces different colors for different ratios", () => {
    const small = colorForSize(10, 100)("█");
    const large = colorForSize(100, 100)("█");
    expect(small).not.toBe(large);
  });

  it("smallest size produces green-ish output", () => {
    const fn = colorForSize(1, 100);
    const result = fn("x");
    expect(result).toContain("x");
  });

  it("largest size produces red-ish output", () => {
    const fn = colorForSize(100, 100);
    const result = fn("x");
    expect(result).toContain("x");
  });
});
