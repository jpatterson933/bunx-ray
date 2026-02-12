import type { Mod } from "../shared/types.js";

export interface BudgetViolation {
  mod: Mod;
  budget: number;
  over: number;
}

export interface TotalBudgetViolation {
  total: number;
  budget: number;
  over: number;
}
