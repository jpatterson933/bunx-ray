import { z } from "zod";

export const ModuleSchema = z.object({
  path: z.string().min(1),
  size: z.number().int().nonnegative(),
});

export type ModuleType = z.infer<typeof ModuleSchema>;
