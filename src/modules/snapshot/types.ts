import { z } from "zod";

export const SnapshotSchema = z.object({
  timestamp: z.string(),
  total: z.number(),
  modules: z.array(
    z.object({
      path: z.string(),
      size: z.number(),
    }),
  ),
});

export type SnapshotType = z.infer<typeof SnapshotSchema>;

const TrendSchema = z.object({
  path: z.string(),
  currentSize: z.number(),
  previousSize: z.number(),
  delta: z.number(),
});

export type TrendType = z.infer<typeof TrendSchema>;

const SnapshotComparisonSchema = z.object({
  changed: z.array(TrendSchema),
  unchangedCount: z.number(),
  newCount: z.number(),
  removedCount: z.number(),
});

export type SnapshotComparisonType = z.infer<typeof SnapshotComparisonSchema>;
