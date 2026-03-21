import { z } from "zod";

export const ConfigSchema = z.strictObject({
  top: z.number().int().positive().default(10),
});

export type ConfigType = z.infer<typeof ConfigSchema>;
