# 🎨 bunx-ray

**ASCII heat-map for any directory.** See what's taking up space, right in your terminal.

---

## Install & Run

```bash
# global (recommended)
npm install -g bunx-ray

# or one-off
npx bunx-ray ./dist
```

Point it at any directory:

```bash
bunx-ray ./dist
bunx-ray ./node_modules
bunx-ray ./
```

---

## CLI

```
bunx-ray <dir>
```

| Flag            | Description  |
| --------------- | ------------ |
| `-v, --version` | Show version |
| `-h, --help`    | Show help    |

---

## Config File

Create a `.bunxrayrc.json` or `bunxray.config.json` in your project root to set default options.

```json
{
  "top": 15
}
```

| Field | Type     | Description                 |
| ----- | -------- | --------------------------- |
| `top` | `number` | Number of top files to show |

---

## TypeScript API

```ts
import { xray, treemap, draw, renderReport } from "bunx-ray";

const mods = xray("./dist");

// Low-level
console.log(draw(treemap(mods, 80, 24), 80, 24, { color: true }));

// High-level
const report = renderReport(mods, { cols: 80, rows: 24, top: 10 });
```

All `.d.ts` files ship with the package.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
