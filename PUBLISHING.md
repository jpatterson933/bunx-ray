# Publishing `bunx-ray` to npm

> Quick reference for future releases. Assumes you already ran `npm login` (or `npm adduser`).

---

## 1. Build before publishing

```bash
npm run build      # compiles TypeScript to dist/
```

`package.json` already has:

```json
"prepublishOnly": "npm run build",
"files": ["dist"]
```

So running `npm publish` will automatically rebuild and only ship the compiled JS.

---

## 2. Choose a package name & scope

| Package name value        | Default visibility | Can be private? |
| ------------------------- | ------------------ | --------------- |
| `"name": "bunx-ray"`      | Public             | **No**          |
| `"name": "@you/bunx-ray"` | Private            | Yes             |

_Change the `name` field if needed._

---

## 3. Publish commands

### A) Un-scoped, public (most common)

```bash
npm version patch   # bump 0.1.x → 0.1.(x+1)
npm publish         # publishes publicly
```

### B) Scoped & public

```bash
npm version minor   # or patch / major
npm publish --access public
```

### C) Scoped & private (default for scoped)

```bash
npm version patch
npm publish --access restricted   # or simply: npm publish
```

---

## 4. Extras

- **Dry-run** – see what would be published:
  ```bash
  npm publish --dry-run
  ```
- **Dist-tags** – publish a prerelease:
  ```bash
  npm publish --tag next          # install with npm i bunx-ray@next
  ```
- **Private registry**:
  ```bash
  npm publish --registry https://registry.my-company.com/
  ```

---

## 5. Verify

```bash
npm view bunx-ray version      # expect the new version
npm i -g bunx-ray              # test global install
bunx-ray --help                # ensure binary runs
```

---

Happy shipping! 🚀
