import { z } from "zod";

export const ReportOptionsSchema = z.object({
  cols: z.number(),
  rows: z.number(),
  top: z.number(),
});

export const RenderedReportSchema = z.object({
  legendLine: z.string(),
  summaryLine: z.string(),
  grid: z.string(),
  tableLines: z.array(z.string()),
});

export type ReportOptionsType = z.infer<typeof ReportOptionsSchema>;
export type RenderedReportType = z.infer<typeof RenderedReportSchema>;
