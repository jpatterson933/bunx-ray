# Publishing bunx-ray to npm

Publish manually from your terminal. GitHub Actions runs build and test checks only; publishing a GitHub Release does not publish to npm.

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
npx bunx-ray@latest --help
```
