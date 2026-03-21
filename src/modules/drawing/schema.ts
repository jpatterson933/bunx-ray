import { z } from "zod";

export const DrawOptionsSchema = z.object({
  color: z.boolean().default(false),
});

export type DrawOptionsType = z.infer<typeof DrawOptionsSchema>;
export type DrawOptionsInputType = z.input<typeof DrawOptionsSchema>;
