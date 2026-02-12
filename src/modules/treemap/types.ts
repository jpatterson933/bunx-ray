import { type ModuleType, ModuleSchema } from "../shared/types.js";
import { z } from "zod";

export const CellSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  mod: ModuleSchema,
});

export const RectangleSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const TreemapItemSchema = z.object({
  mod: ModuleSchema,
  area: z.number(),
});

const ConsumedSchema = z.object({
  axis: z.enum(["x", "y"]),
  amount: z.number(),
});

export const LayoutResultSchema = z.object({
  cells: z.array(CellSchema),
  consumed: ConsumedSchema,
});

export type CellType = z.infer<typeof CellSchema>;
export type RectangleType = z.infer<typeof RectangleSchema>;
export type TreemapItemType = z.infer<typeof TreemapItemSchema>;
export type LayoutResultType = z.infer<typeof LayoutResultSchema>;
