import { z } from "zod";

const ReportOptionsSchema = z.object({
  cols: z.number(),
  rows: z.number(),
  top: z.number(),
  legend: z.boolean(),
  summary: z.boolean(),
  color: z.boolean(),
  labels: z.boolean(),
  borders: z.boolean(),
  duplicates: z.boolean(),
});

export const RenderedReportSchema = z.object({
  legendLine: z.string().optional(),
  summaryLine: z.string().optional(),
  grid: z.string(),
  tableLines: z.array(z.string()),
  duplicateLines: z.array(z.string()),
});

export type ReportOptionsType = z.infer<typeof ReportOptionsSchema>;
export type RenderedReportType = z.infer<typeof RenderedReportSchema>;
