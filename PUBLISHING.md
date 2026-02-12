# Publishing bunx-ray to npm

## Publish

```bash
npm version patch   # or minor / major
npm publish         # prepublishOnly runs build automatically
```

## Dry-run

```bash
npm publish --dry-run
```

## Verify

```bash
npm view bunx-ray version
npx bunx-ray --help
```
