import { z } from "zod";

export const ModuleSchema = z.object({
  path: z.string(),
  size: z.number(),
});

export type ModuleType = z.infer<typeof ModuleSchema>;

export const ChunkSchema = z.object({
  name: z.string(),
  size: z.number(),
  moduleCount: z.number(),
});

export type ChunkType = z.infer<typeof ChunkSchema>;
