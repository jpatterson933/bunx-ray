# bunx-ray

**Color heat-map bundle viewer** -- inspect JavaScript bundle composition right in your terminal. Green means small, red means large. CI-friendly, SSH-friendly, browser-free.

---

## Install & run

```bash
# global (recommended)
npm install -g bunx-ray

# or one-off
npx bunx-ray
```

Run `bunx-ray` in your project directory and it will automatically find your stats file. You can also pass a path explicitly:

```bash
bunx-ray path/to/stats.json
```

### Auto-detection

When no file is provided, bunx-ray searches for stats files in common locations:

`stats.json` · `dist/stats.json` · `build/bundle-stats.json` · `dist/bundle-stats.json` · `meta.json` · `dist/meta.json` · `build/meta.json`

The stats format (webpack, vite, esbuild) is detected automatically from the file contents.

## CLI

```
bunx-ray [stats] [flags]

Flags
  --webpack              Treat input as Webpack stats (default auto-detect)
  --vite                 Treat input as Vite / Rollup stats
  --esbuild              Treat input as esbuild metafile
  --cols <n>             Terminal columns  (default: terminal width)
  --rows <n>             Terminal rows     (default: terminal height, max 40)
  --top  <n>             Show N largest modules (default 10)
  --labels               Show module names on large treemap cells
  --no-borders           Hide cell borders
  --no-color             Disable colors
  --no-legend            Hide legend line
  --no-summary           Hide bundle summary
  --grid-only            Only print grid (no legend / summary)
  --budget <size>        Fail if any module exceeds size (e.g. 50KB, 1MB)
  --total-budget <size>  Fail if total bundle exceeds size
  -v, --version          Show version
  -h, --help             Show help
```

### Diff mode

Compare two builds to see what changed:

```bash
bunx-ray diff old-stats.json new-stats.json
```

Shows added, removed, and changed modules with size deltas and percentages.

### Budget enforcement

Fail your CI pipeline when modules get too big:

```bash
# Fail if any single module exceeds 50KB
bunx-ray stats.json --budget 50KB

# Fail if total bundle exceeds 500KB
bunx-ray stats.json --total-budget 500KB

# Both
bunx-ray stats.json --budget 50KB --total-budget 500KB
```

Exits with code 1 when budget is exceeded. Sizes can be specified as `B`, `KB`, `MB`, or `GB`.

---

## Generating stats files

Each bundler has its own way of producing a stats file. Generate one, then run `bunx-ray`.

### Webpack

```bash
npx webpack --json > stats.json
bunx-ray
```

### Vite / Rollup

Use a plugin like `rollup-plugin-visualizer` with `json` output, or generate stats manually:

```bash
vite build
bunx-ray dist/stats.json
```

### esbuild

```bash
esbuild src/index.ts --bundle --metafile=meta.json --outfile=dist/bundle.js
bunx-ray
```

---

## TypeScript API

Install as a normal dependency and import what you need:

```ts
import { normalizeWebpack, treemap, draw, renderReport } from "bunx-ray";
import { readFileSync } from "fs";

const stats = JSON.parse(readFileSync("stats.json", "utf8"));
const mods = normalizeWebpack(stats);

// Low-level: generate grid string directly
console.log(draw(treemap(mods, 80, 24), 80, 24, { color: true, labels: true }));

// High-level: get a full report with legend, summary, and table
const report = renderReport(mods, {
  cols: 80,
  rows: 24,
  top: 10,
  legend: true,
  summary: true,
  color: true,
  labels: false,
  borders: true,
});

// Budget checking
import { parseSize, checkBudget } from "bunx-ray";
const budget = parseSize("50KB");
const violations = checkBudget(mods, budget);

// Diff two builds
import { diffMods, renderDiff } from "bunx-ray";
const result = diffMods(oldMods, newMods);
const lines = renderDiff(result);
```

All `.d.ts` files ship with the package -- no extra `@types` install required.

---

## Why text over HTML?

- Works in CI logs, SSH sessions, Codespaces, headless Docker containers.
- Fail a PR when a module grows past your budget with `--budget`.
- Compare builds with `bunx-ray diff` to catch regressions.
- Zero browser animations = instant feedback.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
