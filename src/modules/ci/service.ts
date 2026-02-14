import type {
  ModuleSizeViolationType,
  TotalModuleSizeViolationType,
} from "../size/types.js";
import { formatSize } from "../utils/service.js";

export function formatAnnotations(
  moduleViolations: ModuleSizeViolationType[],
  totalViolation: TotalModuleSizeViolationType | null,
): string[] {
  const lines: string[] = [];

  for (const v of moduleViolations) {
    lines.push(
      `::error title=bunx-ray size violation::${v.module.path} (${formatSize(v.module.size)}) exceeds ${formatSize(v.moduleSize)} limit (+${formatSize(v.overBy)} over)`,
    );
  }

  if (totalViolation) {
    lines.push(
      `::error title=bunx-ray total size violation::Total bundle (${formatSize(totalViolation.totalModuleSize)}) exceeds ${formatSize(totalViolation.moduleSize)} limit (+${formatSize(totalViolation.overBy)} over)`,
    );
  }

  return lines;
}
