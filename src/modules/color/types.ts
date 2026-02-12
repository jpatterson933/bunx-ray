import { z } from "zod";

export const ColorForSizeResponseSchema = z.function({
  input: [z.string()],
  output: z.string(),
});

export type ColorForSizeResponseType = z.infer<
  typeof ColorForSizeResponseSchema
>;
