import { z } from "zod";

const PackageGroupSchema = z.object({
  name: z.string(),
  size: z.number(),
  moduleCount: z.number(),
});

export type PackageGroupType = z.infer<typeof PackageGroupSchema>;
