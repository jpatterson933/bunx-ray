import { execa } from "execa";
import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";

const cli = path.resolve("dist/cli.js");
const fixture = path.resolve("fixtures/webpack-sample.json");

describe("CLI with explicit stats argument", () => {
  it("prints legend and summary by default", async () => {
    const { stdout } = await execa("node", [
      cli,
      fixture,
      "--cols",
      "20",
      "--rows",
      "6",
    ]);
    expect(stdout).toMatch(/Legend/);
    expect(stdout).toMatch(/Total bundle/);
  });

  it("grid-only hides legend and summary", async () => {
    const { stdout } = await execa("node", [
      cli,
      fixture,
      "--grid-only",
      "--cols",
      "20",
      "--rows",
      "6",
    ]);
    expect(stdout).not.toMatch(/Legend/);
    expect(stdout).not.toMatch(/Total bundle/);
  });

  it("respects top flag", async () => {
    const { stdout } = await execa("node", [
      cli,
      fixture,
      "--top",
      "2",
      "--cols",
      "20",
      "--rows",
      "6",
    ]);
    const lines = stdout.split("\n").filter((l) => l.startsWith(" "));
    const tableLines = lines.filter((l) => /\d+ [░▒▓█]/.test(l));
    expect(tableLines.length).toBe(2);
  });
});

describe("CLI with auto-detected stats file", () => {
  it("finds stats.json in working directory", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bunx-ray-"));
    fs.copyFileSync(fixture, path.join(tmpDir, "stats.json"));

    const { stdout } = await execa(
      "node",
      [cli, "--cols", "20", "--rows", "6"],
      { cwd: tmpDir },
    );

    expect(stdout).toMatch(/Found stats\.json/);
    expect(stdout).toMatch(/Legend/);

    fs.rmSync(tmpDir, { recursive: true });
  });

  it("shows helpful message when no stats file exists", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bunx-ray-"));

    const result = await execa("node", [cli], { cwd: tmpDir, reject: false });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/No stats file found/);
    expect(result.stderr).toMatch(/stats\.json/);
    expect(result.stderr).toMatch(/webpack/);
    expect(result.stderr).toMatch(/esbuild/);

    fs.rmSync(tmpDir, { recursive: true });
  });
});
