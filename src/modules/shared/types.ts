import { z } from "zod";

export const ModuleSchema = z.object({
  path: z.string(),
  size: z.number(),
});

export type ModuleType = z.infer<typeof ModuleSchema>;
