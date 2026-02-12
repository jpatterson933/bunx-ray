#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs";
import path from "path";

import type { ModuleType } from "./modules/shared/types.js";
import {
  normalizeEsbuild,
  normalizeVite,
  normalizeWebpack,
} from "./modules/normalizers/service.js";
import { KNOWN_STATS_PATHS } from "./modules/normalizers/constants.js";
import { renderReport } from "./modules/report/service.js";
import {
  checkBudget,
  checkTotalBudget,
  formatBudgetViolations,
  formatTotalBudgetViolation,
  parseSize,
} from "./modules/budget/service.js";
import { diffMods, renderDiff } from "./modules/diff/service.js";

const { version: VERSION } = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

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

function detectFormat(stats: any, opts: any): ModuleType[] {
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
    .version(VERSION, "-v, --version");

  program
    .command("diff <old> <new>", { isDefault: false })
    .description("Compare two builds")
    .option("--webpack", "Input is Webpack stats")
    .option("--vite", "Input is Vite/Rollup stats")
    .option("--esbuild", "Input is esbuild metafile")
    .action((oldFile: string, newFile: string, opts: any) => {
      try {
        const oldStats = parseStatsJson(oldFile);
        const newStats = parseStatsJson(newFile);
        const oldMods = detectFormat(oldStats, opts);
        const newMods = detectFormat(newStats, opts);
        const result = diffMods(oldMods, newMods);
        const lines = renderDiff(result);
        lines.forEach((l) => console.log(l));
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  program
    .argument("[stats]", "Build stats JSON file (auto-detected if omitted)")
    .option("--webpack", "Input is Webpack stats")
    .option("--vite", "Input is Vite/Rollup stats")
    .option("--esbuild", "Input is esbuild metafile")
    .option("--cols <number>", "Terminal columns (default: terminal width)")
    .option("--rows <number>", "Terminal rows (default: terminal height)")
    .option("--top <number>", "Show N largest modules (default 10)", "10")
    .option("--no-legend", "Hide legend line")
    .option("--no-summary", "Hide summary line")
    .option("--grid-only", "Only print grid (implies --no-legend --no-summary)")
    .option("--labels", "Show module names on large cells")
    .option("--no-borders", "Hide cell borders")
    .option("--no-color", "Disable colors")
    .option("--size <size>", "Fail if any module exceeds size (e.g. 50KB)")
    .option(
      "--total-size <size>",
      "Fail if total bundle exceeds total size (e.g. 500KB)",
    )
    .action((statsArg: string | undefined, opts: any) => {
      const cols = opts.cols ? Number(opts.cols) : process.stdout.columns || 80;
      const rows = opts.rows
        ? Number(opts.rows)
        : Math.min(process.stdout.rows || 24, 40);

      if (!Number.isFinite(cols) || !Number.isFinite(rows)) {
        console.error(chalk.red("Error: --cols and --rows must be numbers"));
        process.exit(1);
      }

      try {
        const file = resolveStatsFile(statsArg);
        const stats = parseStatsJson(file);
        const modules = detectFormat(stats, opts);

        if (modules.length === 0) {
          console.error(chalk.yellow("No modules found in stats file."));
          process.exit(1);
        }

        const report = renderReport(modules, {
          cols,
          rows,
          top: Number(opts.top ?? 10),
          legend: opts.legend !== false && !opts.gridOnly,
          summary: opts.summary !== false && !opts.gridOnly,
          color: opts.color !== false,
          labels: opts.labels === true,
          borders: opts.borders !== false,
        });

        if (report.legendLine) console.log(report.legendLine);
        if (report.summaryLine) console.log(report.summaryLine);
        console.log("\n" + report.grid + "\n");
        report.tableLines.forEach((l) => console.log(l));

        let sizeValidationFailed = false;

        if (opts.size) {
          const sizeBytes = parseSize(opts.size);
          const violations = checkBudget(modules, sizeBytes);
          if (violations.length > 0) {
            sizeValidationFailed = true;
            const lines = formatBudgetViolations(violations, sizeBytes);
            lines.forEach((l) => console.log(chalk.red(l)));
          }
        }

        if (opts.totalSize) {
          const totalSizeBytes = parseSize(opts.totalSize);
          const violation = checkTotalBudget(modules, totalSizeBytes);
          if (violation) {
            sizeValidationFailed = true;
            const lines = formatTotalBudgetViolation(violation);
            lines.forEach((l) => console.log(chalk.red(l)));
          }
        }

        if (sizeValidationFailed) process.exit(1);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

main();
