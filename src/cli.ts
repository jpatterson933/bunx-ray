#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import fs from "fs";
import path from "path";

import { renderReport } from "./modules/report/service.js";
import { ReportOptionsSchema } from "./modules/report/schema.js";
import { xray } from "./modules/xray/service.js";
import { loadConfig } from "./modules/config/service.js";
import { ConfigSchema } from "./modules/config/schema.js";

const { version: VERSION } = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

function resolveModules(inputPath: string) {
  const resolved = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Path not found: ${inputPath}`);
  }
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`Expected a directory: ${inputPath}`);
  }
  return xray(resolved);
}

function main() {
  const program = new Command();

  program
    .name("bunx-ray")
    .description("ASCII heat-map bundle viewer")
    .version(VERSION, "-v, --version");

  program
    .argument("<dir>", "Bundled output directory")
    .action((dirArg: string) => {
      const config = ConfigSchema.parse(loadConfig() ?? {});
      const cols = process.stdout.columns || 80;
      const rows = Math.min(process.stdout.rows || 24, 40);
      const opts = ReportOptionsSchema.parse({ cols, rows, top: config.top });

      try {
        const modules = resolveModules(dirArg);

        if (modules.length === 0) {
          console.error(chalk.yellow("No files found in directory."));
          process.exit(1);
        }

        const report = renderReport(modules, opts);

        console.log(report.legendLine);
        console.log(report.summaryLine);

        console.log("\n" + report.grid + "\n");
        report.tableLines.forEach((l) => console.log(l));
      } catch (err: any) {
        console.error(err.message);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

main();
