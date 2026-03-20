import { execa } from "execa";
import path from "path";
import { describe, expect, it } from "vitest";

const cli = path.resolve("dist/cli.js");
const esbuildFixture = path.resolve("fixtures/esbuild-sample.json");
const webpackFixture = path.resolve("fixtures/webpack-sample.json");

async function run(args: string[]) {
  return execa("node", [cli, ...args], { reject: false });
}

describe("deprecated format flags", () => {
  it("warns when --webpack is used", async () => {
    const { stderr } = await run([webpackFixture, "--webpack", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--webpack is deprecated/);
  });

  it("warns when --vite is used", async () => {
    const { stderr } = await run([path.resolve("fixtures/vite-sample.json"), "--vite", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--vite is deprecated/);
  });

  it("warns when --rollup is used", async () => {
    const { stderr } = await run([path.resolve("fixtures/rollup-sample.json"), "--rollup", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--rollup is deprecated/);
  });

  it("warns when --esbuild is used", async () => {
    const { stderr } = await run([esbuildFixture, "--esbuild", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--esbuild is deprecated/);
  });

  it("warns when --tsup is used", async () => {
    const { stderr } = await run([esbuildFixture, "--tsup", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--tsup is deprecated/);
  });
});

describe("deprecated display flags", () => {
  it("warns when --labels is used", async () => {
    const { stderr } = await run([esbuildFixture, "--labels", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--labels is deprecated/);
  });

  it("warns when --no-borders is used", async () => {
    const { stderr } = await run([esbuildFixture, "--no-borders", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--no-borders is deprecated/);
  });

  it("warns when --no-color is used", async () => {
    const { stderr } = await run([esbuildFixture, "--no-color", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--no-color is deprecated/);
  });

  it("warns when --no-legend is used", async () => {
    const { stderr } = await run([esbuildFixture, "--no-legend", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--no-legend is deprecated/);
  });

  it("warns when --no-summary is used", async () => {
    const { stderr } = await run([esbuildFixture, "--no-summary", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--no-summary is deprecated/);
  });

  it("warns when --grid-only is used", async () => {
    const { stderr } = await run([esbuildFixture, "--grid-only", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--grid-only is deprecated/);
  });

  it("warns when --cols is used", async () => {
    const { stderr } = await run([esbuildFixture, "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--cols is deprecated/);
  });

  it("warns when --rows is used", async () => {
    const { stderr } = await run([esbuildFixture, "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--rows is deprecated/);
  });
});

describe("deprecated output flags", () => {
  it("warns when --md is used", async () => {
    const { stderr } = await run([esbuildFixture, "--md"]);
    expect(stderr).toMatch(/--md is deprecated/);
  });

  it("warns when --json is used", async () => {
    const { stderr } = await run([esbuildFixture, "--json"]);
    expect(stderr).toMatch(/--json is deprecated/);
  });

  it("warns when --top is used", async () => {
    const { stderr } = await run([esbuildFixture, "--top", "5", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--top is deprecated/);
  });

  it("warns when --no-duplicates is used", async () => {
    const { stderr } = await run([esbuildFixture, "--no-duplicates", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--no-duplicates is deprecated/);
  });

  it("warns when --why is used", async () => {
    const { stderr } = await run([esbuildFixture, "--why", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--why is deprecated/);
  });

  it("warns when --group-by-package is used", async () => {
    const { stderr } = await run([esbuildFixture, "--group-by-package", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--group-by-package is deprecated/);
  });

  it("warns when --save-snapshot is used", async () => {
    const { stderr } = await run([esbuildFixture, "--save-snapshot", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--save-snapshot is deprecated/);
  });

  it("warns when --snapshot-file is used", async () => {
    const { stderr } = await run([esbuildFixture, "--snapshot-file", "/tmp/snap.json", "--cols", "20", "--rows", "6"]);
    expect(stderr).toMatch(/--snapshot-file is deprecated/);
  });
});

describe("deprecated flags in diff subcommand", () => {
  it("warns when --webpack is used with diff", async () => {
    const { stderr } = await run(["diff", webpackFixture, webpackFixture, "--webpack"]);
    expect(stderr).toMatch(/--webpack is deprecated/);
  });

  it("warns when --md is used with diff", async () => {
    const { stderr } = await run(["diff", esbuildFixture, esbuildFixture, "--md"]);
    expect(stderr).toMatch(/--md is deprecated/);
  });

  it("warns when --json is used with diff", async () => {
    const { stderr } = await run(["diff", esbuildFixture, esbuildFixture, "--json"]);
    expect(stderr).toMatch(/--json is deprecated/);
  });
});

describe("non-deprecated flags do not warn", () => {
  it("--size does not produce a deprecation warning", async () => {
    const { stderr } = await run([esbuildFixture, "--size", "1MB"]);
    expect(stderr).not.toMatch(/deprecated/);
  });

  it("--total-size does not produce a deprecation warning", async () => {
    const { stderr } = await run([esbuildFixture, "--total-size", "10MB"]);
    expect(stderr).not.toMatch(/deprecated/);
  });

  it("no flags does not produce a deprecation warning", async () => {
    const { stderr } = await run([esbuildFixture]);
    expect(stderr).not.toMatch(/deprecated/);
  });
});
