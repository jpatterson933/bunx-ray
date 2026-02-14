import { z } from "zod";

const JsonReportOptionsSchema = z.object({
  top: z.number(),
});

const JsonReportSchema = z.object({
  total: z.number(),
  totalFormatted: z.string(),
  moduleCount: z.number(),
  modules: z.array(
    z.object({
      path: z.string(),
      size: z.number(),
    }),
  ),
  top: z.array(
    z.object({
      path: z.string(),
      size: z.number(),
      pct: z.number(),
    }),
  ),
});

export type JsonReportOptionsType = z.infer<typeof JsonReportOptionsSchema>;
export type JsonReportType = z.infer<typeof JsonReportSchema>;
