export type WhyGraphType = {
  nodes: Map<string, { path: string; size: number }>;
  edges: Map<string, Set<string>>;
  entrypoints: string[];
  hasEdges: boolean;
};

export type WhyChainType = {
  target: string;
  entry: string | null;
  chain: string[];
  missing: boolean;
};

export type WhyBuildOptionsType = {
  webpack?: boolean;
  vite?: boolean;
  rollup?: boolean;
  esbuild?: boolean;
  tsup?: boolean;
};
