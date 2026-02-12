import { execa } from "execa";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";

const cli = path.resolve("dist/cli.js");
const webpackFixture = path.resolve("fixtures/webpack-sample.json");
const esbuildFixture = path.resolve("fixtures/esbuild-sample.json");
const esbuildRealisticFixture = path.resolve("fixtures/esbuild-realistic.json");
const viteFixture = path.resolve("fixtures/vite-sample.json");

const tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bunx-ray-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tmpDirs.length) {
    const dir = tmpDirs.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("CLI with explicit stats argument", () => {
  it("prints legend and summary by default", async () => {
    const { stdout } = await execa("node", [
      cli, webpackFixture, "--cols", "20", "--rows", "6",
    ]);
    expect(stdout).toMatch(/Legend/);
    expect(stdout).toMatch(/Total bundle/);
  });

  it("grid-only hides legend and summary", async () => {
    const { stdout } = await execa("node", [
      cli, webpackFixture, "--grid-only", "--cols", "20", "--rows", "6",
    ]);
    expect(stdout).not.toMatch(/Legend/);
    expect(stdout).not.toMatch(/Total bundle/);
  });

  it("respects --top flag", async () => {
    const { stdout } = await execa("node", [
      cli, webpackFixture, "--top", "2", "--cols", "20", "--rows", "6",
    ]);
    const tableLines = stdout.split("\n").filter((l) => /^\s*\d+ [░▒▓█]/.test(l));
    expect(tableLines.length).toBe(2);
  });

  it("prints --version", async () => {
    const { stdout } = await execa("node", [cli, "--version"]);
    expect(stdout).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("CLI format auto-detection", () => {
  it("auto-detects esbuild metafile", async () => {
    const { stdout } = await execa("node", [
      cli, esbuildFixture, "--cols", "20", "--rows", "6",
    ]);
    expect(stdout).toMatch(/Legend/);
  });

  it("auto-detects vite stats", async () => {
    const { stdout } = await execa("node", [
      cli, viteFixture, "--cols", "20", "--rows", "6",
    ]);
    expect(stdout).toMatch(/Legend/);
  });
});

describe("CLI with auto-detected stats file", () => {
  it("finds stats.json in working directory", async () => {
    const tmpDir = makeTmpDir();
    fs.copyFileSync(webpackFixture, path.join(tmpDir, "stats.json"));

    const { stdout } = await execa(
      "node", [cli, "--cols", "20", "--rows", "6"],
      { cwd: tmpDir },
    );

    expect(stdout).toMatch(/Found stats\.json/);
    expect(stdout).toMatch(/Legend/);
  });

  it("shows helpful message when no stats file exists", async () => {
    const tmpDir = makeTmpDir();

    const result = await execa("node", [cli], { cwd: tmpDir, reject: false });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/No stats file found/);
  });
});

describe("CLI error handling", () => {
  it("exits with error for invalid JSON", async () => {
    const tmpDir = makeTmpDir();
    fs.writeFileSync(path.join(tmpDir, "bad.json"), "not json");

    const result = await execa("node", [cli, path.join(tmpDir, "bad.json")], {
      reject: false,
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/Failed to parse JSON/);
  });
});

describe("CLI size", () => {
  it("exits 0 when under size", async () => {
    const result = await execa("node", [
      cli, esbuildFixture, "--size", "1MB", "--cols", "20", "--rows", "6",
    ], { reject: false });
    expect(result.exitCode).toBe(0);
  });

  it("exits 1 when over size", async () => {
    const result = await execa("node", [
      cli, esbuildFixture, "--size", "1B", "--cols", "20", "--rows", "6",
    ], { reject: false });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toMatch(/Size violations/);
  });

  it("exits 1 when total size exceeded", async () => {
    const result = await execa("node", [
      cli, esbuildFixture, "--total-size", "1B", "--cols", "20", "--rows", "6",
    ], { reject: false });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toMatch(/Total size violation/);
  });
});

describe("CLI diff", () => {
  it("compares two stats files", async () => {
    const { stdout } = await execa("node", [
      cli, "diff", esbuildFixture, webpackFixture,
    ]);
    expect(stdout).toMatch(/bunx-ray diff/);
    expect(stdout).toMatch(/Total:/);
  });
});

describe("CLI labels and borders", () => {
  it("--labels flag shows module names", async () => {
    const { stdout } = await execa("node", [
      cli, esbuildRealisticFixture, "--labels", "--no-color",
      "--cols", "60", "--rows", "16",
    ]);
    expect(stdout).toMatch(/lodash\.js/);
  });

  it("--no-borders flag removes border characters", async () => {
    const { stdout } = await execa("node", [
      cli, esbuildFixture, "--no-borders", "--no-color",
      "--cols", "20", "--rows", "6",
    ]);
    expect(stdout).not.toContain("│");
    expect(stdout).not.toContain("─");
  });
});
