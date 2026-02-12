# bunx-ray

**ASCII heat-map bundle viewer** – inspect JavaScript bundle composition right in your terminal (CI-friendly, SSH-friendly, browser-free).

---

## Install & run

```bash
# global (recommended)
npm install -g bunx-ray

# or one-off
npx bunx-ray <stats.json>
```

## CLI

```
bunx-ray <stats.json> [flags]

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

## Real-world recipes

### Webpack ≥ 4

```bash
npx webpack --stats-json            # writes stats.json
bunx-ray stats.json                 # view heat-map
```

### Vite v5 / Rollup

```bash
vite build --stats.writeTo stats.json
bunx-ray --vite stats.json
```

### esbuild

```bash
esbuild src/index.ts --bundle --metafile=meta.json --outfile=/dev/null
bunx-ray --esbuild meta.json
```

---

## TypeScript API

Install as a normal dependency and import what you need:

```ts
import { normalizeWebpack, treemap, draw, Mod } from "bunx-ray";

const mods: Mod[] = normalizeWebpack(
  JSON.parse(readFileSync("stats.json", "utf8")),
);
console.log(draw(treemap(mods, 80, 24)));
```

All `.d.ts` files ship with the package—no extra `@types` install required.

---

## Why text over HTML?

- Works in CI logs, SSH sessions, Codespaces, headless Docker containers.
- Diff-friendly → fail PR when a module grows past your budget.
- Zero browser animations = instant feedback.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
