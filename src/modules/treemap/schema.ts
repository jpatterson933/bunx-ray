import { z } from "zod";
import { ModuleSchema } from "../shared/schema.js";

export const CellSchema = z.object({
  x: z.int().nonnegative(),
  y: z.int().nonnegative(),
  w: z.int().positive(),
  h: z.int().positive(),
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

export const LayoutResultSchema = z.object({
  cells: z.array(CellSchema),
  consumed: z.object({
    axis: z.enum(["x", "y"]),
    amount: z.number(),
  }),
});

export type CellType = z.infer<typeof CellSchema>;
export type RectangleType = z.infer<typeof RectangleSchema>;
export type TreemapItemType = z.infer<typeof TreemapItemSchema>;
export type LayoutResultType = z.infer<typeof LayoutResultSchema>;
