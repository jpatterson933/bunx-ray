import type {
  WhyBuildOptionsType,
  WhyChainType,
  WhyGraphType,
} from "./types.js";

function emptyGraph(hasEdges = false): WhyGraphType {
  return {
    nodes: new Map(),
    edges: new Map(),
    entrypoints: [],
    hasEdges,
  };
}

function addEdge(graph: WhyGraphType, from: string, to: string) {
  const existing = graph.edges.get(from);
  if (existing) {
    existing.add(to);
    return;
  }
  graph.edges.set(from, new Set([to]));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function normalizeWebpackIdentifier(value: string): string | null {
  if (!value) return null;
  if (value.includes("|")) {
    const last = value.split("|").pop();
    if (last && (last.includes("/") || last.includes("\\"))) return last;
  }
  return null;
}

function collectWebpackModules(stats: any): any[] {
  const list: any[] = [];

  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node.modules)) {
      for (const mod of node.modules) {
        list.push(mod);
        if (Array.isArray(mod.modules)) {
          for (const child of mod.modules) list.push(child);
        }
      }
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child);
    }
  }

  walk(stats);
  return list;
}

function modulePathFromWebpack(mod: any): string | null {
  if (typeof mod?.nameForCondition === "string") return mod.nameForCondition;
  if (typeof mod?.name === "string" && !mod.name.includes(" + "))
    return mod.name;
  if (typeof mod?.identifier === "string") {
    return normalizeWebpackIdentifier(mod.identifier) ?? mod.identifier;
  }
  return null;
}

function buildWebpackGraph(stats: any): WhyGraphType {
  const graph = emptyGraph(true);
  const mods = collectWebpackModules(stats);

  const identifierMap = new Map<string, string>();
  const nameMap = new Map<string, string>();
  const nameForConditionMap = new Map<string, string>();
  const aliasMap = new Map<string, string>();

  for (const mod of mods) {
    const path = modulePathFromWebpack(mod);
    if (!path) continue;

    graph.nodes.set(path, { path, size: mod.size ?? mod.parsedSize ?? 0 });

    if (typeof mod.identifier === "string") {
      identifierMap.set(mod.identifier, path);
    }
    if (typeof mod.nameForCondition === "string") {
      nameForConditionMap.set(mod.nameForCondition, path);
    }
    if (typeof mod.name === "string" && !mod.name.includes(" + ")) {
      nameMap.set(mod.name, path);
    }
    if (
      typeof mod.name === "string" &&
      typeof mod.nameForCondition === "string"
    ) {
      aliasMap.set(mod.name, mod.nameForCondition);
    }

    if (
      (mod.issuer == null && mod.issuerPath == null) ||
      mod.depth === 0 ||
      (Array.isArray(mod.reasons) &&
        mod.reasons.some((r: any) => r?.type === "entry"))
    ) {
      graph.entrypoints.push(path);
    }
  }

  function mapRef(ref?: string | null): string | null {
    if (!ref) return null;
    if (identifierMap.has(ref)) return identifierMap.get(ref)!;
    if (nameForConditionMap.has(ref)) return nameForConditionMap.get(ref)!;
    if (aliasMap.has(ref)) return aliasMap.get(ref)!;
    if (nameMap.has(ref)) return nameMap.get(ref)!;

    const normalized = normalizeWebpackIdentifier(ref);
    if (normalized) {
      if (identifierMap.has(normalized)) return identifierMap.get(normalized)!;
      if (nameForConditionMap.has(normalized))
        return nameForConditionMap.get(normalized)!;
      return normalized;
    }

    return null;
  }

  for (const mod of mods) {
    const path = modulePathFromWebpack(mod);
    if (!path) continue;

    let issuer: string | null = null;

    if (Array.isArray(mod.issuerPath) && mod.issuerPath.length > 0) {
      const last = mod.issuerPath[mod.issuerPath.length - 1];
      issuer = mapRef(last?.identifier ?? last?.name);
    }

    if (!issuer && typeof mod.issuer === "string") {
      issuer = mapRef(mod.issuer);
    }

    if (!issuer && typeof mod.issuerName === "string") {
      issuer = mapRef(mod.issuerName);
    }

    if (!issuer && Array.isArray(mod.reasons)) {
      for (const reason of mod.reasons) {
        const ref =
          reason?.moduleIdentifier ??
          reason?.resolvedModuleIdentifier ??
          reason?.moduleName ??
          reason?.resolvedModule;
        issuer = mapRef(ref);
        if (issuer) break;
      }
    }

    if (issuer && issuer !== path) {
      addEdge(graph, issuer, path);
    }
  }

  graph.entrypoints = unique(graph.entrypoints);
  return graph;
}

function buildEsbuildGraph(stats: any): WhyGraphType {
  const graph = emptyGraph(true);
  const inputs = stats?.inputs;
  if (!inputs || typeof inputs !== "object") return graph;

  for (const [path, info] of Object.entries<any>(inputs)) {
    graph.nodes.set(path, { path, size: info?.bytes ?? 0 });
  }

  for (const [path, info] of Object.entries<any>(inputs)) {
    const imports = Array.isArray(info?.imports) ? info.imports : [];
    for (const imp of imports) {
      const target = imp?.path;
      if (target && inputs[target]) {
        addEdge(graph, path, target);
      }
    }
  }

  if (stats?.outputs && typeof stats.outputs === "object") {
    for (const output of Object.values<any>(stats.outputs)) {
      if (typeof output?.entryPoint === "string") {
        graph.entrypoints.push(output.entryPoint);
      }
    }
  }

  graph.entrypoints = unique(graph.entrypoints);
  return graph;
}

function buildRollupGraph(stats: any): WhyGraphType {
  const graph = emptyGraph(false);
  const outputs = Array.isArray(stats?.output) ? stats.output : [];

  for (const out of outputs) {
    if (!out?.modules) continue;
    for (const [path, info] of Object.entries<any>(out.modules)) {
      const size =
        info?.renderedLength ??
        info?.renderedSize ??
        info?.originalLength ??
        info?.size ??
        0;
      graph.nodes.set(path, { path, size });
    }
  }

  return graph;
}

function buildViteGraph(stats: any): WhyGraphType {
  return buildRollupGraph(stats);
}

export function buildWhyGraph(
  stats: any,
  opts: WhyBuildOptionsType = {},
): WhyGraphType {
  if (opts.webpack) return buildWebpackGraph(stats);
  if (opts.esbuild || opts.tsup) return buildEsbuildGraph(stats);
  if (opts.rollup) return buildRollupGraph(stats);
  if (opts.vite) return buildViteGraph(stats);

  if (stats?.inputs && stats?.outputs) return buildEsbuildGraph(stats);
  if (stats?.modules || stats?.children) return buildWebpackGraph(stats);
  if (Array.isArray(stats?.output)) return buildRollupGraph(stats);

  return emptyGraph(false);
}

function bfsChain(
  graph: WhyGraphType,
  target: string,
): WhyChainType | null {
  const queue: string[] = [];
  const parent = new Map<string, string | null>();

  for (const entry of graph.entrypoints) {
    queue.push(entry);
    parent.set(entry, null);
  }

  let found = false;
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node === target) {
      found = true;
      break;
    }
    const neighbors = graph.edges.get(node);
    if (!neighbors) continue;
    for (const next of neighbors) {
      if (parent.has(next)) continue;
      parent.set(next, node);
      queue.push(next);
    }
  }

  if (!found) return null;

  const chain: string[] = [];
  let current: string | null = target;
  while (current) {
    chain.push(current);
    current = parent.get(current) ?? null;
  }
  chain.reverse();

  return {
    target,
    entry: chain.length > 0 ? chain[0] : null,
    chain,
    missing: false,
  };
}

export function findWhyChains(
  graph: WhyGraphType,
  targets: string[],
): WhyChainType[] {
  const wantMissing =
    !graph.hasEdges || graph.entrypoints.length === 0;

  return targets.map((target) => {
    if (wantMissing) {
      return { target, entry: null, chain: [], missing: true };
    }

    const found = bfsChain(graph, target);
    if (!found) {
      return { target, entry: null, chain: [], missing: true };
    }

    return found;
  });
}

export function renderWhyLines(chains: WhyChainType[]): string[] {
  if (chains.length === 0) return [];

  const lines: string[] = ["Why"];
  chains.forEach((c, idx) => {
    lines.push(` ${idx + 1}  ${c.target}`);
    if (c.missing) {
      lines.push("    (no import graph available)");
      return;
    }
    lines.push(`    ${c.chain.join(" -> ")}`);
  });
  return lines;
}

export function renderWhyMarkdown(chains: WhyChainType[]): string {
  if (chains.length === 0) return "";

  const lines: string[] = [
    "### Why",
    "",
    "| # | Module | Chain |",
    "| --- | --- | --- |",
  ];

  chains.forEach((c, idx) => {
    const chainText = c.missing
      ? "No import graph available"
      : c.chain.map((p) => `\`${p}\``).join(" -> ");
    lines.push(`| ${idx + 1} | \`${c.target}\` | ${chainText} |`);
  });

  return lines.join("\n");
}
