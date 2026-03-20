import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { xray } from "../src/modules/xray/service";

const tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bunx-ray-xray-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tmpDirs.length) {
    const dir = tmpDirs.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("xray", () => {
  it("returns empty array for empty directory", () => {
    const dir = makeTmpDir();
    expect(xray(dir)).toEqual([]);
  });

  it("returns files with relative paths and sizes", () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, "index.js"), Buffer.alloc(100));
    fs.writeFileSync(path.join(dir, "utils.js"), Buffer.alloc(250));

    const result = xray(dir);
    expect(result).toHaveLength(2);

    const index = result.find((m) => m.path === "index.js");
    const utils = result.find((m) => m.path === "utils.js");
    expect(index).toBeDefined();
    expect(index!.size).toBe(100);
    expect(utils).toBeDefined();
    expect(utils!.size).toBe(250);
  });

  it("walks nested directories", () => {
    const dir = makeTmpDir();
    fs.mkdirSync(path.join(dir, "src", "components"), { recursive: true });
    fs.writeFileSync(path.join(dir, "src", "index.js"), Buffer.alloc(50));
    fs.writeFileSync(
      path.join(dir, "src", "components", "App.js"),
      Buffer.alloc(300),
    );

    const result = xray(dir);
    expect(result).toHaveLength(2);

    const paths = result.map((m) => m.path).sort();
    expect(paths).toEqual(["src/components/App.js", "src/index.js"]);
  });
});
