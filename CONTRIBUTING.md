# Contributing to bunx-ray

## Development Setup

```bash
git clone https://github.com/jpatterson933/bunx-ray.git
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
├── src/                         # TypeScript source
│   ├── index.ts                 # Public API exports
│   ├── cli.ts                   # CLI entry point
│   └── modules/
│       ├── shared/              # Shared types (ModuleType, ChunkType)
│       ├── normalizers/         # Format normalizers (webpack, vite, rollup, esbuild)
│       ├── treemap/             # Squarified treemap layout
│       ├── drawing/             # ASCII grid rendering
│       ├── color/               # Color gradient mapping
│       ├── report/              # Report orchestration
│       ├── utils/               # formatSize, totalSize, topModules
│       ├── size/                # Size budget enforcement
│       ├── diff/                # Build comparison
│       ├── markdown/            # Markdown output (--md)
│       ├── json-output/         # JSON output (--json)
│       ├── config/              # Config file loading
│       ├── duplicates/          # Duplicate module detection
│       ├── chunks/              # Multi-chunk extraction
│       ├── ci/                  # GitHub Actions annotations
│       ├── snapshot/            # Historical snapshot tracking
│       └── grouping/            # Package grouping
├── dist/                        # Compiled output (gitignored)
├── test/                        # Test suite
└── fixtures/                    # Test fixtures (JSON stats files)
```

Each module follows the pattern: `service.ts` (logic), `types.ts` (Zod schemas), and optional `constants.ts`.

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
