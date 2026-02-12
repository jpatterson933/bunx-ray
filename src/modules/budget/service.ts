import type { ModuleType } from "../shared/types.js";
import { formatSize } from "../utils/service.js";
import { SIZE_MULTIPLIERS } from "./constants.js";
import type { BudgetViolation, TotalBudgetViolation } from "./types.js";

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

export function checkBudget(mods: ModuleType[], budget: number): BudgetViolation[] {
  return mods
    .filter((m) => m.size > budget)
    .sort((a, b) => b.size - a.size)
    .map((m) => ({ mod: m, budget, over: m.size - budget }));
}

export function checkTotalBudget(
  mods: ModuleType[],
  budget: number,
): TotalBudgetViolation | null {
  const total = mods.reduce((a, m) => a + m.size, 0);
  if (total <= budget) return null;
  return { total, budget, over: total - budget };
}

export function formatBudgetViolations(
  violations: BudgetViolation[],
  budget: number,
): string[] {
  const lines: string[] = [
    `\nBudget violations (--budget ${formatSize(budget)}):`,
  ];
  for (const v of violations) {
    const name =
      v.mod.path.length > 40
        ? "…" + v.mod.path.slice(-39)
        : v.mod.path.padEnd(40);
    lines.push(
      `  FAIL  ${name}  ${formatSize(v.mod.size).padStart(8)}  (+${formatSize(v.over)} over budget)`,
    );
  }
  lines.push(
    `\n${violations.length} module${violations.length === 1 ? "" : "s"} exceed${violations.length === 1 ? "s" : ""} ${formatSize(budget)} budget`,
  );
  return lines;
}

export function formatTotalBudgetViolation(
  violation: TotalBudgetViolation,
): string[] {
  return [
    `\nTotal budget violation (--total-budget ${formatSize(violation.budget)}):`,
    `  FAIL  Total bundle: ${formatSize(violation.total)}  (+${formatSize(violation.over)} over budget)`,
  ];
}
