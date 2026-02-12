import type { ModuleType } from "../shared/types.js";
import { z } from "zod";


export interface BudgetViolation {
  mod: ModuleType;
  budget: number;
  over: number;
}

export interface TotalBudgetViolation {
  total: number;
  budget: number;
  over: number;
}
