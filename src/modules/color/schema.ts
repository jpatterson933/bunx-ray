import { z } from "zod";

const ColorForSizeResponseSchema = z.function({
  input: z.tuple([z.string()]),
  output: z.string(),
});

export type ColorForSizeResponseType = z.infer<typeof ColorForSizeResponseSchema>;
