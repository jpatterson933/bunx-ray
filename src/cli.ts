#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs";
import path from "path";

import type { ModuleType } from "./modules/shared/types.js";
import {
  normalizeEsbuild,
  normalizeRollup,
  normalizeVite,
  normalizeWebpack,
} from "./modules/normalizers/service.js";
import { KNOWN_STATS_PATHS } from "./modules/normalizers/constants.js";
import { renderReport } from "./modules/report/service.js";
import {
  checkModuleSize,
  checkTotalModuleSize,
  formatModuleSizeViolations,
  formatTotalModuleSizeViolation,
  parseSize,
} from "./modules/size/service.js";
import { diffMods, renderDiff } from "./modules/diff/service.js";
import { loadConfig } from "./modules/config/service.js";
import {
  renderMarkdownReport,
  renderMarkdownDiff,
} from "./modules/markdown/service.js";
import { renderJsonReport } from "./modules/json-output/service.js";
import {
  findDuplicates,
  renderDuplicateLines,
} from "./modules/duplicates/service.js";
import { extractChunks, renderChunkLines } from "./modules/chunks/service.js";
import { formatAnnotations } from "./modules/ci/service.js";
import {
  saveSnapshot,
  loadSnapshot,
  compareSnapshot,
  renderTrendLines,
} from "./modules/snapshot/service.js";
import {
  groupByPackage,
  renderPackageLines,
} from "./modules/grouping/service.js";

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
    chalk.yellow("  vite:     vite build (with vite-bundle-analyzer)"),
    chalk.yellow("  rollup:   rollup --bundleConfigAsCjs (with plugin)"),
    chalk.yellow("  tsup:     tsup --metafile"),
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
  if (opts.rollup) return normalizeRollup(stats);
  if (opts.esbuild || opts.tsup) return normalizeEsbuild(stats);

  if (stats.inputs && stats.outputs) return normalizeEsbuild(stats);
  if (stats.modules || stats.children) return normalizeWebpack(stats);
  if (
    Array.isArray(stats.output) &&
    stats.output.some((o: any) => o.type === "chunk")
  )
    return normalizeRollup(stats);
  if (stats.output) return normalizeVite(stats);

  throw new Error(
    "Unable to detect stats format; please pass --webpack | --vite | --rollup | --esbuild | --tsup",
  );
}

function runSizeChecks(
  modules: ModuleType[],
  sizeStr: string | undefined,
  totalSizeStr: string | undefined,
) {
  const moduleSizeLimit = sizeStr ? parseSize(sizeStr) : null;
  const moduleViolations =
    moduleSizeLimit !== null ? checkModuleSize(modules, moduleSizeLimit) : [];
  const totalViolation = totalSizeStr
    ? checkTotalModuleSize(modules, parseSize(totalSizeStr))
    : null;

  return {
    moduleViolations,
    totalViolation,
    moduleSizeLimit,
    failed: moduleViolations.length > 0 || totalViolation !== null,
  };
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
    .option("--rollup", "Input is Rollup stats")
    .option("--esbuild", "Input is esbuild metafile")
    .option("--tsup", "Input is tsup metafile")
    .option("--md", "Output as GitHub-Flavored Markdown")
    .option("--json", "Output as JSON")
    .action((oldFile: string, newFile: string, opts: any) => {
      try {
        const oldStats = parseStatsJson(oldFile);
        const newStats = parseStatsJson(newFile);
        const oldMods = detectFormat(oldStats, opts);
        const newMods = detectFormat(newStats, opts);
        const result = diffMods(oldMods, newMods);

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        if (opts.md) {
          console.log(renderMarkdownDiff(result));
          return;
        }

        renderDiff(result).forEach((l) => console.log(l));
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  program
    .argument("[stats]", "Build stats JSON file (auto-detected if omitted)")
    .option("--webpack", "Input is Webpack stats")
    .option("--vite", "Input is Vite/Rollup stats")
    .option("--rollup", "Input is Rollup stats")
    .option("--esbuild", "Input is esbuild metafile")
    .option("--tsup", "Input is tsup metafile")
    .option("--cols <number>", "Terminal columns (default: terminal width)")
    .option("--rows <number>", "Terminal rows (default: terminal height)")
    .option("--top <number>", "Show N largest modules (default 10)")
    .option("--md", "Output as GitHub-Flavored Markdown")
    .option("--json", "Output as JSON")
    .option("--no-duplicates", "Hide duplicate module detection")
    .option("--group-by-package", "Show heaviest npm packages")
    .option("--save-snapshot", "Save bundle data to snapshot file")
    .option(
      "--snapshot-file <path>",
      "Snapshot file path (default: .bunxray-history.json)",
    )
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
      const config = loadConfig();
      const statsFile = statsArg ?? config?.stats;
      const top = Number(opts.top ?? config?.top ?? 10);
      const sizeStr = opts.size ?? config?.size;
      const totalSizeStr = opts.totalSize ?? config?.totalSize;
      const labels = opts.labels ?? config?.labels ?? false;
      const cols = opts.cols ? Number(opts.cols) : process.stdout.columns || 80;
      const rows = opts.rows
        ? Number(opts.rows)
        : Math.min(process.stdout.rows || 24, 40);

      if (!Number.isFinite(cols) || !Number.isFinite(rows)) {
        console.error(chalk.red("Error: --cols and --rows must be numbers"));
        process.exit(1);
      }

      if (
        !opts.webpack &&
        !opts.vite &&
        !opts.rollup &&
        !opts.esbuild &&
        !opts.tsup &&
        config?.format
      ) {
        opts[config.format] = true;
      }

      try {
        const file = resolveStatsFile(statsFile);
        const stats = parseStatsJson(file);
        const modules = detectFormat(stats, opts);

        if (modules.length === 0) {
          console.error(chalk.yellow("No modules found in stats file."));
          process.exit(1);
        }

        const chunks = extractChunks(stats, opts);
        const packages = opts.groupByPackage ? groupByPackage(modules) : [];

        if (opts.json) {
          const report = renderJsonReport(modules, { top });
          const duplicates =
            opts.duplicates !== false ? findDuplicates(modules) : [];
          const sizeCheck = runSizeChecks(modules, sizeStr, totalSizeStr);

          console.log(
            JSON.stringify(
              {
                ...report,
                chunks,
                ...(packages.length > 0 ? { packages } : {}),
                duplicates,
                violations: {
                  modules: sizeCheck.moduleViolations.map((v) => ({
                    path: v.module.path,
                    size: v.module.size,
                    limit: v.moduleSize,
                    overBy: v.overBy,
                  })),
                  total: sizeCheck.totalViolation,
                },
              },
              null,
              2,
            ),
          );

          if (process.env.GITHUB_ACTIONS && sizeCheck.failed) {
            formatAnnotations(
              sizeCheck.moduleViolations,
              sizeCheck.totalViolation,
            ).forEach((l) => console.error(l));
          }

          if (opts.saveSnapshot) saveSnapshot(modules, opts.snapshotFile);
          if (sizeCheck.failed) process.exit(1);
          return;
        }

        if (opts.md) {
          console.log(renderMarkdownReport(modules, { top }));
          const sizeCheck = runSizeChecks(modules, sizeStr, totalSizeStr);

          if (process.env.GITHUB_ACTIONS && sizeCheck.failed) {
            formatAnnotations(
              sizeCheck.moduleViolations,
              sizeCheck.totalViolation,
            ).forEach((l) => console.error(l));
          }

          if (opts.saveSnapshot) saveSnapshot(modules, opts.snapshotFile);
          if (sizeCheck.failed) process.exit(1);
          return;
        }

        const report = renderReport(modules, {
          cols,
          rows,
          top,
          legend: opts.legend !== false && !opts.gridOnly,
          summary: opts.summary !== false && !opts.gridOnly,
          color: opts.color !== false,
          labels,
          borders: opts.borders !== false,
          duplicates: opts.duplicates !== false,
        });

        if (report.legendLine) console.log(report.legendLine);
        if (report.summaryLine) console.log(report.summaryLine);

        const chunkLines = renderChunkLines(chunks);
        if (chunkLines.length > 0) {
          console.log("");
          chunkLines.forEach((l) => console.log(l));
        }

        console.log("\n" + report.grid + "\n");
        report.tableLines.forEach((l) => console.log(l));

        if (packages.length > 0) {
          console.log("");
          renderPackageLines(packages).forEach((l) => console.log(l));
        }

        if (report.duplicateLines.length > 0) {
          console.log("");
          report.duplicateLines.forEach((l) => console.log(l));
        }

        const snapshot = loadSnapshot(opts.snapshotFile);
        if (snapshot) {
          const comparison = compareSnapshot(modules, snapshot);
          const trendLines = renderTrendLines(comparison);
          if (trendLines.length > 0) {
            console.log("");
            trendLines.forEach((l) => console.log(l));
          }
        }

        const sizeCheck = runSizeChecks(modules, sizeStr, totalSizeStr);

        if (sizeCheck.moduleViolations.length > 0) {
          formatModuleSizeViolations(
            sizeCheck.moduleViolations,
            sizeCheck.moduleSizeLimit!,
          ).forEach((l) => console.log(chalk.red(l)));
        }

        if (sizeCheck.totalViolation) {
          formatTotalModuleSizeViolation(sizeCheck.totalViolation).forEach(
            (l) => console.log(chalk.red(l)),
          );
        }

        if (process.env.GITHUB_ACTIONS && sizeCheck.failed) {
          formatAnnotations(
            sizeCheck.moduleViolations,
            sizeCheck.totalViolation,
          ).forEach((l) => console.log(l));
        }

        if (opts.saveSnapshot) saveSnapshot(modules, opts.snapshotFile);
        if (sizeCheck.failed) process.exit(1);
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

main();
