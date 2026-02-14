import { z } from "zod";

export const ConfigSchema = z.object({
  stats: z.string().optional(),
  format: z.enum(["webpack", "vite", "rollup", "esbuild", "tsup"]).optional(),
  top: z.number().optional(),
  labels: z.boolean().optional(),
  size: z.string().optional(),
  totalSize: z.string().optional(),
});

export type ConfigType = z.infer<typeof ConfigSchema>;
