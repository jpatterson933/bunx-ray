import { z } from "zod";

const MarkdownReportOptionsSchema = z.object({
  top: z.number(),
});

export type MarkdownReportOptionsType = z.infer<
  typeof MarkdownReportOptionsSchema
>;
