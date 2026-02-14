# 🎨 bunx-ray

**ASCII heat-map bundle viewer** — inspect JavaScript bundle composition right in your terminal. Green means small, red means large. Supports webpack, vite, esbuild, tsup, and rollup. CI-friendly, SSH-friendly, browser-free.

---

## Install & Run

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

When no file is provided, bunx-ray searches these paths in order:

- `stats.json`
- `build/bundle-stats.json`
- `dist/stats.json`
- `dist/bundle-stats.json`
- `meta.json`
- `dist/meta.json`
- `build/meta.json`
- `metafile-cjs.json`
- `metafile-esm.json`
- `dist/metafile-cjs.json`
- `dist/metafile-esm.json`
- `rollup-stats.json`
- `dist/rollup-stats.json`

The bundler format (webpack, vite, esbuild, tsup, rollup) is auto-detected from the file structure. You can override detection with an explicit flag like `--webpack` or `--rollup`.

---

## 💻 CLI

```
bunx-ray [stats] [flags]
```

### Flags

| Flag                     | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `--webpack`              | Treat input as Webpack stats                        |
| `--vite`                 | Treat input as Vite stats                           |
| `--rollup`               | Treat input as Rollup stats                         |
| `--esbuild`              | Treat input as esbuild metafile                     |
| `--tsup`                 | Treat input as tsup metafile                        |
| `--cols <n>`             | Terminal columns (default: terminal width)          |
| `--rows <n>`             | Terminal rows (default: terminal height, max 40)    |
| `--top <n>`              | Show N largest modules (default 10)                 |
| `--md`                   | Output as GitHub-Flavored Markdown instead of ANSI  |
| `--json`                 | Output as structured JSON instead of ANSI           |
| `--group-by-package`     | Show heaviest npm packages table                    |
| `--no-duplicates`        | Hide duplicate module detection                     |
| `--save-snapshot`        | Save current bundle data to `.bunxray-history.json` |
| `--snapshot-file <path>` | Override snapshot file path                         |
| `--labels`               | Show module names on large treemap cells            |
| `--no-borders`           | Hide cell borders                                   |
| `--no-color`             | Disable colors                                      |
| `--no-legend`            | Hide legend line                                    |
| `--no-summary`           | Hide bundle summary                                 |
| `--grid-only`            | Only print grid (no legend / summary)               |
| `--size <size>`          | Fail if any module exceeds size (e.g. `50KB`)       |
| `--total-size <size>`    | Fail if total bundle exceeds size (e.g. `500KB`)    |
| `-v, --version`          | Show version                                        |
| `-h, --help`             | Show help                                           |

---

## Output Formats

### Default (ANSI)

The default output renders a color treemap, top modules table, chunk summary, duplicate warnings, and trend arrows directly in the terminal using ANSI escape codes.

### Markdown (`--md`)

Produces a GitHub-Flavored Markdown table suitable for pasting into PR comments or writing to a file. Includes a bar chart column, module sizes, and percentages:

```bash
bunx-ray stats.json --md
```

Output:

```markdown
### bunx-ray — Bundle Report

**Total:** 350.2 KB | **Modules:** 42

| #   | Module                            | Size    | %     |                    |
| --- | --------------------------------- | ------- | ----- | ------------------ |
| 1   | `node_modules/lodash/lodash.js`   | 72.0 KB | 20.6% | `████████████████` |
| 2   | `node_modules/react-dom/index.js` | 42.1 KB | 12.0% | `█████████░░░░░░░` |
```

### JSON (`--json`)

Produces structured JSON with `total`, `totalFormatted`, `moduleCount`, `modules` (all modules with path and size), `top` (top N with percentage), `chunks`, `duplicates`, and `violations`. Suitable for programmatic consumption:

```bash
bunx-ray stats.json --json
```

The JSON output includes:

```json
{
  "total": 350222,
  "totalFormatted": "342.0 KB",
  "moduleCount": 42,
  "modules": [{ "path": "...", "size": 72000 }],
  "top": [{ "path": "...", "size": 72000, "pct": 20.6 }],
  "chunks": [{ "name": "main.js", "size": 280000, "moduleCount": 30 }],
  "duplicates": [],
  "violations": { "modules": [], "total": null }
}
```

When `--group-by-package` is also passed, a `packages` array is included in the JSON.

Both `--md` and `--json` work with the `diff` subcommand as well.

---

## Diff Mode

Compare two builds to see what changed:

```bash
bunx-ray diff old-stats.json new-stats.json
```

Shows added, removed, and changed modules with size deltas and percentages.

Works with all output formats:

```bash
bunx-ray diff old.json new.json --md    # Markdown table with ▲/▼ arrows
bunx-ray diff old.json new.json --json  # Raw diff data as JSON
```

---

## Config File

Create a `.bunxrayrc.json` or `bunxray.config.json` in your project root to set default options. bunx-ray searches from the current directory upward until it finds one.

```json
{
  "stats": "dist/stats.json",
  "format": "webpack",
  "top": 15,
  "labels": true,
  "size": "50KB",
  "totalSize": "500KB"
}
```

All fields are optional. CLI flags take precedence over config values.

| Field       | Type                                                     | Description                                       |
| ----------- | -------------------------------------------------------- | ------------------------------------------------- |
| `stats`     | `string`                                                 | Path to stats file (replaces positional argument) |
| `format`    | `"webpack" \| "vite" \| "rollup" \| "esbuild" \| "tsup"` | Force bundler format                              |
| `top`       | `number`                                                 | Number of top modules to show                     |
| `labels`    | `boolean`                                                | Show module names on treemap cells                |
| `size`      | `string`                                                 | Per-module size limit (e.g. `"50KB"`)             |
| `totalSize` | `string`                                                 | Total bundle size limit (e.g. `"500KB"`)          |

---

## Duplicate Detection

bunx-ray automatically scans for duplicate modules — the same file bundled from different `node_modules` paths (e.g. nested dependencies). This runs by default in ANSI output and shows:

```
Potential duplicates (2 groups, 18.4 KB wasted)
  lodash/cloneDeep.js  (2 copies, 12.1 KB wasted)
    node_modules/lodash/cloneDeep.js
    node_modules/pkg-a/node_modules/lodash/cloneDeep.js
  react/index.js  (2 copies, 6.3 KB wasted)
    node_modules/react/index.js
    node_modules/pkg-b/node_modules/react/index.js
```

Duplicates are also included in `--json` output. Disable with `--no-duplicates`.

---

## Package Grouping

Use `--group-by-package` to aggregate all modules by their npm package name and see which dependencies contribute the most weight:

```bash
bunx-ray stats.json --group-by-package
```

Output:

```
Heaviest packages
  1  react-dom                  128.3 KB  (4 modules)
  2  lodash                      36.8 KB  (12 modules)
  3  @babel/runtime               8.2 KB  (6 modules)
```

Handles scoped packages (`@scope/name`) and nested `node_modules`. Source files outside `node_modules` are excluded from the grouping. Also included in `--json` output when the flag is set.

---

## Historical Snapshots

Track bundle size over time by saving snapshots and comparing against them on subsequent runs.

```bash
# Save current bundle data
bunx-ray stats.json --save-snapshot

# On the next build, bunx-ray auto-compares if the snapshot file exists
bunx-ray stats.json
```

Output:

```
Trends (vs last snapshot)
  ↑ node_modules/lodash/lodash.js        +2.3 KB
  ↓ src/components/Header.tsx             -800 B
  38 unchanged, 2 new, 1 removed
```

The snapshot is saved to `.bunxray-history.json` by default. Override the path with `--snapshot-file <path>`:

```bash
bunx-ray stats.json --save-snapshot --snapshot-file snapshots/main.json
```

Snapshots are saved in all output modes (ANSI, Markdown, JSON). Trend arrows display in ANSI output only. Add `.bunxray-history.json` to your `.gitignore` unless you want to track it in source control.

---

## Multi-chunk Support

When the bundle contains multiple output chunks (e.g. code splitting, dynamic imports), bunx-ray displays a chunk summary above the treemap:

```
Chunks (3)
  dist/main.js                    142.8 KB  (28 modules)
  dist/vendor.js                   98.4 KB  (14 modules)
  dist/lazy-route.js               12.1 KB  (3 modules)
```

Chunk extraction works automatically for webpack, esbuild/tsup, rollup, and vite stats. The chunk summary only appears when 2 or more chunks are detected.

---

## Size Enforcement

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

### GitHub Actions Annotations

When running inside GitHub Actions (`GITHUB_ACTIONS` environment variable is set) and a size violation occurs, bunx-ray emits `::error` annotations that appear directly on the Actions summary:

```
::error title=bunx-ray size violation::node_modules/lodash/lodash.js (72.0 KB) exceeds 50.0 KB limit (+22.0 KB over)
::error title=bunx-ray total size violation::Total bundle (520.0 KB) exceeds 500.0 KB limit (+20.0 KB over)
```

For `--json` and `--md` output modes, annotations are emitted to `stderr` so they don't interfere with the structured output on `stdout`.

### CI Pipeline Examples

```yaml
# GitHub Actions
- name: Bundle analysis
  run: bunx-ray stats.json --size 50KB --total-size 500KB

# Save Markdown report as PR comment artifact
- name: Generate report
  run: bunx-ray stats.json --md > bundle-report.md

# JSON for custom processing
- name: Extract bundle data
  run: bunx-ray stats.json --json > bundle-data.json
```

---

## Generating Stats Files

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

### Rollup

Use a plugin to generate stats output:

```bash
npm install -D rollup-plugin-visualizer
```

Add to `rollup.config.js`:

```javascript
import { visualizer } from "rollup-plugin-visualizer";

export default {
  plugins: [
    visualizer({ filename: "rollup-stats.json", template: "raw-data" }),
  ],
};
```

Then run:

```bash
rollup -c
bunx-ray rollup-stats.json --rollup
```

### esbuild

Use the built-in `--metafile` flag:

```bash
esbuild src/index.ts --bundle --metafile=meta.json --outfile=dist/bundle.js
bunx-ray
```

**Reference**: [esbuild Metafile Documentation](https://esbuild.github.io/api/#metafile)

### tsup

Use the built-in `--metafile` flag:

```bash
tsup src/index.ts --metafile
bunx-ray
```

Outputs `metafile-{format}.json` (e.g. `metafile-cjs.json`, `metafile-esm.json`) in the project root.

**Reference**: [tsup Metafile Documentation](https://tsup.egoist.dev/#metafile)

---

## TypeScript API

Install as a dependency and import what you need:

```ts
import {
  normalizeWebpack,
  normalizeVite,
  normalizeRollup,
  normalizeEsbuild,
  treemap,
  draw,
  renderReport,
} from "bunx-ray";
import { readFileSync } from "fs";

const stats = JSON.parse(readFileSync("stats.json", "utf8"));
const mods = normalizeWebpack(stats);

// Low-level: generate grid string directly
console.log(draw(treemap(mods, 80, 24), 80, 24, { color: true, labels: true }));

// High-level: full report with legend, summary, table, and duplicate warnings
const report = renderReport(mods, {
  cols: 80,
  rows: 24,
  top: 10,
  legend: true,
  summary: true,
  color: true,
  labels: false,
  borders: true,
  duplicates: true,
});
```

### Markdown & JSON Output

```ts
import { renderMarkdownReport, renderMarkdownDiff } from "bunx-ray";
import { renderJsonReport } from "bunx-ray";

const markdown = renderMarkdownReport(mods, { top: 10 });
const json = renderJsonReport(mods, { top: 10 });
```

### Diff

```ts
import { diffMods, renderDiff, renderMarkdownDiff } from "bunx-ray";

const result = diffMods(oldMods, newMods);
const ansiLines = renderDiff(result);
const markdownStr = renderMarkdownDiff(result);
```

### Size Checking

```ts
import { parseSize, checkModuleSize, checkTotalModuleSize } from "bunx-ray";

const limit = parseSize("50KB");
const violations = checkModuleSize(mods, limit);
const totalViolation = checkTotalModuleSize(mods, parseSize("500KB"));
```

### Duplicate Detection

```ts
import { findDuplicates, renderDuplicateLines } from "bunx-ray";

const groups = findDuplicates(mods);
// groups: [{ name, instances, wastedSize }]
const lines = renderDuplicateLines(groups);
```

### Package Grouping

```ts
import { groupByPackage, renderPackageLines } from "bunx-ray";

const packages = groupByPackage(mods);
// packages: [{ name: "lodash", size: 72000, moduleCount: 12 }, ...]
const lines = renderPackageLines(packages);
```

### Snapshots

```ts
import {
  saveSnapshot,
  loadSnapshot,
  compareSnapshot,
  renderTrendLines,
} from "bunx-ray";

saveSnapshot(mods, ".bunxray-history.json");

const snapshot = loadSnapshot(".bunxray-history.json");
if (snapshot) {
  const comparison = compareSnapshot(mods, snapshot);
  // comparison: { changed, unchangedCount, newCount, removedCount }
  const lines = renderTrendLines(comparison);
}
```

### Chunk Extraction

```ts
import { extractChunks, renderChunkLines } from "bunx-ray";

const chunks = extractChunks(stats, { webpack: true });
// chunks: [{ name: "main.js", size: 142800, moduleCount: 28 }, ...]
const lines = renderChunkLines(chunks);
```

### CI Annotations

```ts
import { formatAnnotations } from "bunx-ray";

const annotations = formatAnnotations(moduleViolations, totalViolation);
// annotations: ["::error title=bunx-ray size violation::...", ...]
```

### Config Loading

```ts
import { loadConfig } from "bunx-ray";

const config = loadConfig();
// config: { stats?, format?, top?, labels?, size?, totalSize? } | null
```

All `.d.ts` files ship with the package — no extra `@types` install required.

---

## Why Text Over HTML?

- **Works everywhere** — CI logs, SSH sessions, Codespaces, headless Docker containers
- **Multiple output formats** — ANSI for terminals, `--md` for PR comments, `--json` for custom tooling
- **Size enforcement** — Fail a PR when a module grows past your limit with `--size` or `--total-size`
- **CI-native** — GitHub Actions annotations surface violations directly in the Actions UI
- **Build comparison** — Compare builds with `bunx-ray diff` to catch regressions
- **Historical tracking** — Save snapshots with `--save-snapshot` and see trend arrows on subsequent runs
- **Instant feedback** — Zero browser animations means real-time results

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
