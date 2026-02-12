import { z } from "zod";

export const ModuleDiffSchema = z.object({
  path: z.string(),
  oldSize: z.number().nullable(),
  newSize: z.number().nullable(),
  delta: z.number(),
  pctChange: z.number().nullable(),
})

export const DiffResultSchema = z.object({
  oldTotal: z.number(),
  newTotal: z.number(),
  totalDelta: z.number(),
  totalPctChange: z.number(),
  changed: z.array(ModuleDiffSchema),
  unchanged: z.array(ModuleDiffSchema),
  added: z.array(ModuleDiffSchema),
  removed: z.array(ModuleDiffSchema),
})

export type ModuleDiffType = z.infer<typeof ModuleDiffSchema>;
export type DiffResultType = z.infer<typeof DiffResultSchema>;
