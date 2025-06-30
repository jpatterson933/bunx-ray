// ---- CLI -----------------------------------------------------------------
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import {
  Mod,
  normalizeWebpack,
  normalizeVite,
  normalizeEsbuild,
  treemap,
  draw
} from './bundle.js';

import { renderReport } from './report.js';

function main() {
  const program = new Command();

  program
    .name('bunx-ray')
    .description('ASCII heat-map bundle viewer')
    .argument('<stats>', 'Build stats JSON file')
    .option('--webpack', 'Input is Webpack stats (default)')
    .option('--vite', 'Input is Vite/Rollup stats')
    .option('--esbuild', 'Input is esbuild metafile')
    .option('--cols <number>', 'Terminal columns (default 80)', '80')
    .option('--rows <number>', 'Terminal rows (default 24)', '24')
    .option('--top <number>', 'Show N largest modules (default 10)', '10')
    .option('--no-legend', 'Hide legend line')
    .option('--no-summary', 'Hide summary line')
    .option('--grid-only', 'Only print grid (implies --no-legend --no-summary)')
    .option('--demo', 'Render built-in demo heat-map')
    .parse(process.argv);

  const opts = program.opts();
  const file = program.args[0];

  const cols = Number(opts.cols);
  const rows = Number(opts.rows);
  if (!Number.isFinite(cols) || !Number.isFinite(rows)) {
    console.error(chalk.red('Error: --cols and --rows must be numbers'));
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
  let stats: any;
  try {
    stats = JSON.parse(raw);
  } catch (e) {
    console.error(chalk.red(`Failed to parse JSON from ${file}`));
    process.exit(1);
  }

  // Choose adapter based on flags or auto-detect.
  let mods: Mod[] = [];
  if (opts.webpack) {
    mods = normalizeWebpack(stats);
  } else if (opts.vite) {
    mods = normalizeVite(stats);
  } else if (opts.esbuild) {
    mods = normalizeEsbuild(stats);
  } else {
    // auto-detect simple heuristics
    if (stats.inputs && stats.outputs) mods = normalizeEsbuild(stats);
    else if (stats.modules || stats.children) mods = normalizeWebpack(stats);
    else if (stats.output) mods = normalizeVite(stats);
    else {
      console.error(chalk.red('Unable to detect stats format; please pass --webpack | --vite | --esbuild'));
      process.exit(1);
    }
  }

  if (mods.length === 0) {
    console.error(chalk.yellow('No modules found in stats file.'));
    process.exit(1);
  }

  const report = renderReport(mods, {
    cols,
    rows,
    top: Number(opts.top ?? 10),
    legend: opts.legend !== false && !opts.gridOnly,
    summary: opts.summary !== false && !opts.gridOnly,
    color: true,
  });

  if (report.legendLine) console.log(report.legendLine);
  if (report.summaryLine) console.log(report.summaryLine);

  console.log('\n' + report.grid + '\n');

  report.tableLines.forEach((l) => console.log(l));
}

main(); 