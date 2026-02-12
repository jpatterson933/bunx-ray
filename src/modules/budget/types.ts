import { ModuleSchema, type ModuleType} from "../shared/types.js";
import { z } from "zod";

export const PackageSizeViolationSchema = z.object({
  module: ModuleSchema,
  packageSize: z.number(),
  overBy: z.number(),
})

export const TotalPackageSizeViolationSchema = z.object({
  totalPackageSize: z.number(),
  packageSize: z.number(),
  overBy: z.number(),
})

export type PackageSizeViolationType = z.infer<typeof PackageSizeViolationSchema>;
export type TotalPackageSizeViolationType = z.infer<typeof TotalPackageSizeViolationSchema>;

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
