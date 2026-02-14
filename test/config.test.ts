/// <reference types="vitest" />

import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/modules/config/service";
import fs from "fs";
import path from "path";
import os from "os";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "bunxray-test-"));
}

describe("loadConfig", () => {
  it("returns null when no config file exists", () => {
    const tmpDir = makeTmpDir();
    const config = loadConfig(tmpDir);
    expect(config).toBeNull();
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("loads .bunxrayrc.json", () => {
    const tmpDir = makeTmpDir();
    fs.writeFileSync(
      path.join(tmpDir, ".bunxrayrc.json"),
      JSON.stringify({ top: 15, size: "50KB" }),
    );
    const config = loadConfig(tmpDir);
    expect(config).not.toBeNull();
    expect(config!.top).toBe(15);
    expect(config!.size).toBe("50KB");
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("loads bunxray.config.json", () => {
    const tmpDir = makeTmpDir();
    fs.writeFileSync(
      path.join(tmpDir, "bunxray.config.json"),
      JSON.stringify({ totalSize: "500KB" }),
    );
    const config = loadConfig(tmpDir);
    expect(config).not.toBeNull();
    expect(config!.totalSize).toBe("500KB");
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("prefers .bunxrayrc.json over bunxray.config.json", () => {
    const tmpDir = makeTmpDir();
    fs.writeFileSync(
      path.join(tmpDir, ".bunxrayrc.json"),
      JSON.stringify({ top: 5 }),
    );
    fs.writeFileSync(
      path.join(tmpDir, "bunxray.config.json"),
      JSON.stringify({ top: 20 }),
    );
    const config = loadConfig(tmpDir);
    expect(config!.top).toBe(5);
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("accepts empty config object", () => {
    const tmpDir = makeTmpDir();
    fs.writeFileSync(path.join(tmpDir, ".bunxrayrc.json"), JSON.stringify({}));
    const config = loadConfig(tmpDir);
    expect(config).not.toBeNull();
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("throws on invalid JSON", () => {
    const tmpDir = makeTmpDir();
    fs.writeFileSync(path.join(tmpDir, ".bunxrayrc.json"), "not valid json");
    expect(() => loadConfig(tmpDir)).toThrow();
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("throws on invalid config values", () => {
    const tmpDir = makeTmpDir();
    fs.writeFileSync(
      path.join(tmpDir, ".bunxrayrc.json"),
      JSON.stringify({ top: "not a number" }),
    );
    expect(() => loadConfig(tmpDir)).toThrow();
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("supports format field", () => {
    const tmpDir = makeTmpDir();
    fs.writeFileSync(
      path.join(tmpDir, ".bunxrayrc.json"),
      JSON.stringify({ format: "webpack" }),
    );
    const config = loadConfig(tmpDir);
    expect(config!.format).toBe("webpack");
    fs.rmSync(tmpDir, { recursive: true });
  });
});
