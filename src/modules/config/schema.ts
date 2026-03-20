import { z } from "zod";

export const ConfigSchema = z.strictObject({
  top: z.number().int().positive().default(10),
  labels: z.boolean().default(false),
});

export type ConfigType = z.infer<typeof ConfigSchema>;
