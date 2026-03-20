import { z } from "zod";

export const ReportOptionsSchema = z.object({
  cols: z.number().int().positive(),
  rows: z.number().int().positive(),
  top: z.number().int().positive(),
});

export const RenderedReportSchema = z.object({
  legendLine: z.string(),
  summaryLine: z.string(),
  grid: z.string(),
  tableLines: z.array(z.string()).min(1),
});

export type ReportOptionsType = z.infer<typeof ReportOptionsSchema>;
export type RenderedReportType = z.infer<typeof RenderedReportSchema>;
