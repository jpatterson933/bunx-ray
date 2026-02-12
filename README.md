# 🎨 bunx-ray

**Color heat-map bundle viewer** - inspect JavaScript bundle composition right in your terminal. Green means small, red means large. CI-friendly, SSH-friendly, browser-free.

---

## 📦 Install & run

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

- `stats.json`
- `build/bundle-stats.json`
- `dist/stats.json`
- `dist/bundle-stats.json`
- `meta.json`
- `dist/meta.json`
- `build/meta.json`

The stats format (webpack, vite, esbuild) is detected automatically from the file contents.

---

## 💻 CLI

```
bunx-ray [stats] [flags]
```

### Flags

| Flag                  | Description                                        |
| --------------------- | -------------------------------------------------- |
| `--webpack`           | Treat input as Webpack stats (default auto-detect) |
| `--vite`              | Treat input as Vite / Rollup stats                 |
| `--esbuild`           | Treat input as esbuild metafile                    |
| `--cols <n>`          | Terminal columns (default: terminal width)         |
| `--rows <n>`          | Terminal rows (default: terminal height, max 40)   |
| `--top <n>`           | Show N largest modules (default 10)                |
| `--labels`            | Show module names on large treemap cells           |
| `--no-borders`        | Hide cell borders                                  |
| `--no-color`          | Disable colors                                     |
| `--no-legend`         | Hide legend line                                   |
| `--no-summary`        | Hide bundle summary                                |
| `--grid-only`         | Only print grid (no legend / summary)              |
| `--size <size>`       | Fail if any module exceeds size (e.g. 50KB, 1MB)   |
| `--total-size <size>` | Fail if total bundle exceeds size                  |
| `-v, --version`       | Show version                                       |
| `-h, --help`          | Show help                                          |

### Diff mode

Compare two builds to see what changed:

```bash
bunx-ray diff old-stats.json new-stats.json
```

Shows added, removed, and changed modules with size deltas and percentages.

### Optional size enforcement

Size checks run only when you pass `--size` or `--total-size`; there is no default. Fail your CI pipeline when modules get too big:

```bash
# Fail if any single module exceeds 50KB
bunx-ray stats.json --size 50KB

# Fail if total bundle exceeds 500KB
bunx-ray stats.json --total-size 500KB

# Both
bunx-ray stats.json --size 50KB --total-size 500KB
```

Exits with code 1 when a size is exceeded. Size format: a number plus optional unit. Units are `B`, `KB`, `MB`, or `GB` (case-insensitive). Omit the unit for bytes (e.g. `50` = 50 bytes). Decimals allowed (e.g. `1.5MB`).

---

## 🛠 Generating stats files

Each bundler has its own way of producing a stats file. Generate one, then run `bunx-ray`.

### Webpack

Use the built-in `--json` flag with optional `--profile` for timing data:

```bash
npx webpack --profile --json > stats.json
bunx-ray
```

**Reference**: [Webpack Stats Documentation](https://webpack.js.org/api/stats/)

### Vite

Vite does not have built-in stats output. Install a plugin:

```bash
npm install -D vite-bundle-analyzer
```

Add to `vite.config.js`:

```javascript
import { visualizer } from "vite-bundle-analyzer";

export default {
  plugins: [visualizer({ analyzerMode: "json" })],
};
```

**Reference**: [vite-bundle-analyzer](https://www.npmjs.com/package/vite-bundle-analyzer)

### esbuild

Use the built-in `--metafile` flag:

```bash
esbuild src/index.ts --bundle --metafile=meta.json --outfile=dist/bundle.js
bunx-ray
```

**Reference**: [esbuild Metafile Documentation](https://esbuild.github.io/api/#metafile)

---

## 🔧 TypeScript API

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

// Size checking
import { parseSize, checkModuleSize } from "bunx-ray";
const size = parseSize("50KB");
const violations = checkModuleSize(mods, size);

// Diff two builds
import { diffMods, renderDiff } from "bunx-ray";
const result = diffMods(oldMods, newMods);
const lines = renderDiff(result);
```

All `.d.ts` files ship with the package - no extra `@types` install required.

---

## ✨ Why text over HTML?

- **Works everywhere** — CI logs, SSH sessions, Codespaces, headless Docker containers
- **Size enforcement** — Fail a PR when a module grows past your size with `--size`
- **Build comparison** — Compare builds with `bunx-ray diff` to catch regressions
- **Instant feedback** — Zero browser animations means real-time results

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## 📄 License

[MIT](LICENSE)
