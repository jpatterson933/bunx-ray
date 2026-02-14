import type { ChunkType } from "../shared/types.js";
import { formatSize } from "../utils/service.js";

function extractWebpackChunks(stats: any): ChunkType[] {
  if (!Array.isArray(stats.chunks)) return [];
  return stats.chunks.map((chunk: any) => ({
    name: chunk.names?.[0] ?? chunk.files?.[0] ?? `chunk-${chunk.id}`,
    size: chunk.size ?? 0,
    moduleCount: Array.isArray(chunk.modules) ? chunk.modules.length : 0,
  }));
}

function extractEsbuildChunks(meta: any): ChunkType[] {
  if (!meta.outputs || typeof meta.outputs !== "object") return [];
  return Object.entries<any>(meta.outputs).map(([fileName, output]) => ({
    name: fileName,
    size: output.bytes ?? 0,
    moduleCount: output.inputs ? Object.keys(output.inputs).length : 0,
  }));
}

function extractRollupChunks(stats: any): ChunkType[] {
  const outputs = Array.isArray(stats.output) ? stats.output : [];
  return outputs
    .filter((o: any) => o.type === "chunk" || o.modules)
    .map((chunk: any) => {
      const moduleEntries = chunk.modules
        ? Object.values<any>(chunk.modules)
        : [];
      const totalSize = moduleEntries.reduce(
        (a: number, m: any) =>
          a +
          (m.renderedLength ??
            m.renderedSize ??
            m.originalLength ??
            m.size ??
            0),
        0,
      );
      return {
        name: chunk.fileName ?? "unknown",
        size: totalSize,
        moduleCount: moduleEntries.length,
      };
    });
}

export function extractChunks(stats: any, opts: any): ChunkType[] {
  if (opts.webpack) return extractWebpackChunks(stats);
  if (opts.esbuild || opts.tsup) return extractEsbuildChunks(stats);
  if (opts.rollup) return extractRollupChunks(stats);
  if (opts.vite) return extractRollupChunks(stats);

  if (stats.chunks && Array.isArray(stats.chunks))
    return extractWebpackChunks(stats);
  if (stats.outputs && typeof stats.outputs === "object")
    return extractEsbuildChunks(stats);
  if (Array.isArray(stats.output)) return extractRollupChunks(stats);
  if (stats.output) return extractRollupChunks(stats);

  return [];
}

export function renderChunkLines(chunks: ChunkType[]): string[] {
  if (chunks.length <= 1) return [];

  const lines: string[] = [`Chunks (${chunks.length})`];
  const sorted = [...chunks].sort((a, b) => b.size - a.size);

  for (const chunk of sorted) {
    const name =
      chunk.name.length > 30
        ? "…" + chunk.name.slice(-29)
        : chunk.name.padEnd(30);
    lines.push(
      `  ${name}  ${formatSize(chunk.size).padStart(10)}  (${chunk.moduleCount} module${chunk.moduleCount === 1 ? "" : "s"})`,
    );
  }

  return lines;
}
