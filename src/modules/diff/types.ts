export interface ModDiff {
  path: string;
  oldSize: number | null;
  newSize: number | null;
  delta: number;
  pctChange: number | null;
}

export interface DiffResult {
  oldTotal: number;
  newTotal: number;
  totalDelta: number;
  totalPctChange: number;
  changed: ModDiff[];
  unchanged: ModDiff[];
  added: ModDiff[];
  removed: ModDiff[];
}
