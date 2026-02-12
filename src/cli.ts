import chalk from "chalk";
import { Command } from "commander";
import fs from "fs";
import path from "path";

import {
  Mod,
  normalizeEsbuild,
  normalizeVite,
  normalizeWebpack,
} from "./bundle.js";

import { renderReport } from "./report.js";

const { version: VERSION } = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const KNOWN_STATS_PATHS = [
  "stats.json",
  "build/bundle-stats.json",
  "dist/stats.json",
  "dist/bundle-stats.json",
  "meta.json",
  "dist/meta.json",
  "build/meta.json",
];

function findStatsFile(): string | undefined {
  const cwd = process.cwd();
  return KNOWN_STATS_PATHS.find((candidate) =>
    fs.existsSync(path.resolve(cwd, candidate)),
  );
}

function resolveStatsFile(explicitPath: string | undefined): string {
  if (explicitPath) return explicitPath;

  const found = findStatsFile();
  if (found) {
    console.log(chalk.cyan(`Found ${found}`));
    return found;
  }

  const lines = [
    chalk.red("No stats file found."),
    chalk.yellow("\nSearched:"),
    ...KNOWN_STATS_PATHS.map((p) => chalk.yellow(`  ${p}`)),
    chalk.yellow("\nGenerate one with your bundler:"),
    chalk.yellow("  webpack:  npx webpack --json > stats.json"),
    chalk.yellow("  esbuild:  esbuild --bundle --metafile=meta.json"),
    chalk.yellow("  vite:     vite build (with rollup-plugin-analyzer)"),
  ];
  throw new Error(lines.join("\n"));
}

function parseStatsJson(filePath: string): any {
  const resolved = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(resolved, "utf8");

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse JSON from ${filePath}`);
  }
}

function detectFormat(stats: any, opts: any): Mod[] {
  if (opts.webpack) return normalizeWebpack(stats);
  if (opts.vite) return normalizeVite(stats);
  if (opts.esbuild) return normalizeEsbuild(stats);

  if (stats.inputs && stats.outputs) return normalizeEsbuild(stats);
  if (stats.modules || stats.children) return normalizeWebpack(stats);
  if (stats.output) return normalizeVite(stats);

  throw new Error(
    "Unable to detect stats format; please pass --webpack | --vite | --esbuild",
  );
}

function main() {
  const program = new Command();

  program
    .name("bunx-ray")
    .description("ASCII heat-map bundle viewer")
    .version(VERSION, "-v, --version")
    .argument("[stats]", "Build stats JSON file (auto-detected if omitted)")
    .option("--webpack", "Input is Webpack stats")
    .option("--vite", "Input is Vite/Rollup stats")
    .option("--esbuild", "Input is esbuild metafile")
    .option("--cols <number>", "Terminal columns (default 80)", "80")
    .option("--rows <number>", "Terminal rows (default 24)", "24")
    .option("--top <number>", "Show N largest modules (default 10)", "10")
    .option("--no-legend", "Hide legend line")
    .option("--no-summary", "Hide summary line")
    .option("--grid-only", "Only print grid (implies --no-legend --no-summary)")
    .parse(process.argv);

  const opts = program.opts();

  const cols = Number(opts.cols);
  const rows = Number(opts.rows);
  if (!Number.isFinite(cols) || !Number.isFinite(rows)) {
    console.error(chalk.red("Error: --cols and --rows must be numbers"));
    process.exit(1);
  }

  try {
    const file = resolveStatsFile(program.args[0]);
    const stats = parseStatsJson(file);
    const mods = detectFormat(stats, opts);

    if (mods.length === 0) {
      console.error(chalk.yellow("No modules found in stats file."));
      process.exit(1);
    }

    const report = renderReport(mods, {
      cols,
      rows,
      top: Number(opts.top ?? 10),
      legend: opts.legend !== false && !opts.gridOnly,
      summary: opts.summary !== false && !opts.gridOnly,
    });

    if (report.legendLine) console.log(report.legendLine);
    if (report.summaryLine) console.log(report.summaryLine);
    console.log("\n" + report.grid + "\n");
    report.tableLines.forEach((l) => console.log(l));
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
}

main();
