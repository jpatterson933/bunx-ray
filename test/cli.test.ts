import { execa } from "execa";
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";

const cli = path.resolve("dist/cli.js");

const tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bunx-ray-"));
  tmpDirs.push(dir);
  return dir;
}

function makeBundleDir(files: Record<string, number>): string {
  const dir = makeTmpDir();
  for (const [filePath, size] of Object.entries(files)) {
    const full = path.join(dir, filePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, Buffer.alloc(size));
  }
  return dir;
}

afterEach(() => {
  while (tmpDirs.length) {
    const dir = tmpDirs.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

const sampleFiles: Record<string, number> = {
  "vendor/lodash.js": 72000,
  "vendor/react-dom.js": 42000,
  "vendor/react.js": 6400,
  "components/App.js": 2400,
  "utils/api.js": 1500,
  "index.js": 820,
};

describe("CLI", () => {
  it("prints legend and summary", async () => {
    const dir = makeBundleDir(sampleFiles);
    const { stdout } = await execa("node", [cli, dir]);
    expect(stdout).toMatch(/Legend/);
    expect(stdout).toMatch(/Total bundle/);
  });

  it("prints --version", async () => {
    const { stdout } = await execa("node", [cli, "--version"]);
    expect(stdout).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("shows all modules when using --all", async () => {
    const files = Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`f${i}.js`, 100 + i]),
    );
    const dir = makeBundleDir(files);
    const { stdout } = await execa("node", [cli, "--all", dir]);
    expect(stdout).toMatch(/Top 12 modules/);
  });
});

describe("CLI error handling", () => {
  it("exits with error for non-existent path", async () => {
    const result = await execa("node", [cli, "/tmp/does-not-exist-xyz"], {
      reject: false,
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/Path not found/);
  });

  it("exits with error when given a file instead of directory", async () => {
    const dir = makeTmpDir();
    const file = path.join(dir, "file.txt");
    fs.writeFileSync(file, "hello");

    const result = await execa("node", [cli, file], { reject: false });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/Expected a directory/);
  });

  it("exits with error for empty directory", async () => {
    const dir = makeTmpDir();
    const result = await execa("node", [cli, dir], { reject: false });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/No files found/);
  });

  it("exits with a clean error for invalid config JSON", async () => {
    const dir = makeBundleDir({ "index.js": 10 });
    fs.writeFileSync(path.join(dir, ".bunxrayrc.json"), "not valid json");
    const result = await execa("node", [cli, "."], { cwd: dir, reject: false });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/Invalid JSON in \.bunxrayrc\.json/);
  });
});
