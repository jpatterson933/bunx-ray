import { z } from "zod";

export const ConfigSchema = z.object({
  top: z.number().optional(),
  labels: z.boolean().optional(),
});

export type ConfigType = z.infer<typeof ConfigSchema>;
