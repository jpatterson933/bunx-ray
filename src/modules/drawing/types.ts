import { z } from "zod";

export const DrawOptionsSchema = z.object({
  color: z.boolean().optional(),
  labels: z.boolean().optional(),
  borders: z.boolean().optional(),
});

export type DrawOptionsType = z.infer<typeof DrawOptionsSchema>;

export interface DrawOptions {
  color?: boolean;
  labels?: boolean;
  borders?: boolean;
}
