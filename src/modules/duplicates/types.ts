import { z } from "zod";
import { ModuleSchema } from "../shared/types.js";

const DuplicateGroupSchema = z.object({
  name: z.string(),
  instances: z.array(ModuleSchema),
  wastedSize: z.number(),
});

export type DuplicateGroupType = z.infer<typeof DuplicateGroupSchema>;
