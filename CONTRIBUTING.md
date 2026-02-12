# Contributing to bunx-ray

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/bunx-ray.git
cd bunx-ray
npm install
npm run build
```

## Running Tests

```bash
npm test
```

Tests use Vitest and require the `fixtures/` directory (included in the repo).

## Project Structure

```
bunx-ray/
├── src/                  # TypeScript source
│   ├── index.ts          # Public API exports
│   ├── cli.ts            # CLI entry point
│   ├── bundle.ts         # Core: normalizers, treemap, draw
│   └── report.ts         # Report rendering
├── dist/                 # Compiled output (gitignored)
├── test/                 # Test suite
├── fixtures/             # Test fixtures (JSON stats files)
├── src-webpack/          # Sample Webpack source
├── src-vite/             # Sample Vite source
└── src-esbuild/          # Sample esbuild source
```

## Generating Sample Stats

These commands regenerate sample build outputs for local testing:

```bash
npm run sample:webpack   # → dist-webpack/stats.json
npm run sample:vite      # → dist-vite/
npm run sample:esbuild   # → dist-esbuild/meta.json
```

## Code Style

- TypeScript with strict mode
- No comments explaining what code does (code should be self-documenting)
- Functions and variables should have descriptive names

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit with a clear message
6. Push and open a Pull Request

## Reporting Issues

When reporting bugs, please include:

- Node.js version (`node --version`)
- npm version (`npm --version`)
- Steps to reproduce
- Expected vs actual behavior
