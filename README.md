# bunx-ray

**ASCII heat-map bundle viewer** -- inspect JavaScript bundle composition right in your terminal (CI-friendly, SSH-friendly, browser-free).

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
  --webpack          Treat input as Webpack stats (default auto-detect)
  --vite             Treat input as Vite / Rollup stats
  --esbuild          Treat input as esbuild metafile
  --cols <n>         Terminal columns  (default 80)
  --rows <n>         Terminal rows     (default 24)
  --top  <n>         Show N largest modules (default 10)
  --grid-only        Only print grid (no legend / summary)
  --no-legend        Hide legend line
  --no-summary       Hide bundle summary
  -v, --version      Show version
  -h, --help         Show help
```

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
console.log(draw(treemap(mods, 80, 24)));

// High-level: get a full report with legend, summary, and table
const report = renderReport(mods, {
  cols: 80,
  rows: 24,
  top: 10,
  legend: true,
  summary: true,
});
```

All `.d.ts` files ship with the package -- no extra `@types` install required.

---

## Why text over HTML?

- Works in CI logs, SSH sessions, Codespaces, headless Docker containers.
- Diff-friendly -- fail a PR when a module grows past your budget.
- Zero browser animations = instant feedback.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
