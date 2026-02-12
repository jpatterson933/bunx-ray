import { ModuleSchema } from "../shared/types.js";
import { z } from "zod";

export const ModuleSizeViolationSchema = z.object({
  module: ModuleSchema,
  moduleSize: z.number(),
  overBy: z.number(),
});

export const TotalModuleSizeViolationSchema = z.object({
  totalModuleSize: z.number(),
  moduleSize: z.number(),
  overBy: z.number(),
});

export type ModuleSizeViolationType = z.infer<typeof ModuleSizeViolationSchema>;
export type TotalModuleSizeViolationType = z.infer<
  typeof TotalModuleSizeViolationSchema
>;
