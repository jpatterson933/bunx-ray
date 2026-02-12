import type { ModuleType } from "../shared/types.js";
import { formatSize } from "../utils/service.js";
import { SIZE_MULTIPLIERS } from "./constants.js";
import type {
  ModuleSizeViolationType,
  TotalModuleSizeViolationType,
} from "./types.js";

export function parseSize(input: string): number {
  const match = input.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i);
  if (!match) {
    throw new Error(
      `Invalid size format: "${input}". Use e.g. 50KB, 1MB, 500B`,
    );
  }
  const value = parseFloat(match[1]);
  const unit = (match[2] || "B").toUpperCase();
  return Math.round(value * SIZE_MULTIPLIERS[unit]);
}

export function checkBudget(
  mods: ModuleType[],
  size: number,
): ModuleSizeViolationType[] {
  return mods
    .filter((m) => m.size > size)
    .sort((a, b) => b.size - a.size)
    .map((m) => ({ module: m, moduleSize: size, overBy: m.size - size }));
}

export function checkTotalBudget(
  modules: ModuleType[],
  moduleSize: number,
): TotalModuleSizeViolationType | null {
  const totalModuleSize = modules.reduce((a, m) => a + m.size, 0);
  if (totalModuleSize <= moduleSize) return null;
  return { totalModuleSize, moduleSize, overBy: totalModuleSize - moduleSize };
}

export function formatBudgetViolations(
  violations: ModuleSizeViolationType[],
  size: number,
): string[] {
  const lines: string[] = [`\nSize violations (--size ${formatSize(size)}):`];
  for (const v of violations) {
    const name =
      v.module.path.length > 40
        ? "…" + v.module.path.slice(-39)
        : v.module.path.padEnd(40);
    lines.push(
      `  FAIL  ${name}  ${formatSize(v.module.size).padStart(8)}  (+${formatSize(v.overBy)} over size)`,
    );
  }
  lines.push(
    `\n${violations.length} module${violations.length === 1 ? "" : "s"} exceed${violations.length === 1 ? "s" : ""} ${formatSize(size)} size`,
  );
  return lines;
}

export function formatTotalBudgetViolation(
  violation: TotalModuleSizeViolationType,
): string[] {
  return [
    `\nTotal size violation (--total-size ${formatSize(violation.moduleSize)}):`,
    `  FAIL  Total bundle: ${formatSize(violation.totalModuleSize)}  (+${formatSize(violation.overBy)} over size)`,
  ];
}
