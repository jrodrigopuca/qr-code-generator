# @qr-plus

[![npm](https://img.shields.io/npm/v/@qr-plus/core)](https://www.npmjs.com/package/@qr-plus/core)
[![CI](https://github.com/jrodrigopuca/qr-code-generator/actions/workflows/main.yml/badge.svg)](https://github.com/jrodrigopuca/qr-code-generator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](packages/core/LICENSE)
[![API Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://jrodrigopuca.github.io/qr-code-generator/)

Monorepo for the **@qr-plus** ecosystem — a zero-dependency QR code generator written in TypeScript.

## Packages

| Package                            | Description                                               | Version                                                                                           |
| ---------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`@qr-plus/core`](./packages/core) | Core QR code generator — zero dependencies, ISO/IEC 18004 | [![npm](https://img.shields.io/npm/v/@qr-plus/core)](https://www.npmjs.com/package/@qr-plus/core) |
| [`@qr-plus/cli`](./packages/cli)   | CLI tool for generating QR codes from the terminal        | [![npm](https://img.shields.io/npm/v/@qr-plus/cli)](https://www.npmjs.com/package/@qr-plus/cli)   |

## Quick Start

### CLI

```bash
npx @qr-plus/cli "https://example.com"
```

```bash
# Save as SVG or PNG
qr-plus "Hello" -o hello.svg
qr-plus "Hello" -o hello.png -s large
```

For full CLI options, see the [CLI package README](./packages/cli/README.md).

### Library

```bash
npm install @qr-plus/core
```

```typescript
import { generateQR, renderToSVG, renderToTerminal } from "@qr-plus/core";

// Generate QR matrix
const { matrix } = generateQR("Hello World");

// Render as SVG string
const svg = renderToSVG("Hello World", { scale: 10 });

// Print to terminal
console.log(renderToTerminal("Hello World"));
```

For full API documentation, see the [core package README](./packages/core/README.md).

## Development

This project uses [pnpm](https://pnpm.io/) workspaces and [Turborepo](https://turbo.build/) for monorepo orchestration.

### Prerequisites

- Node.js >= 18
- pnpm >= 10

### Setup

```bash
pnpm install
```

### Commands

```bash
pnpm run build          # Build all packages
pnpm run test           # Run all tests (unit + integration + E2E)
pnpm run typecheck      # Type check all packages
pnpm run lint           # Lint all packages
pnpm run format:check   # Check formatting
pnpm run docs           # Generate API docs
```

## Repository Structure

```
qr-plus/
├── packages/
│   ├── core/          ← @qr-plus/core (published to npm)
│   ├── cli/           ← @qr-plus/cli (published to npm)
│   └── e2e-tests/     ← E2E test suite
├── docs/              ← Ecosystem documentation
├── turbo.json         ← Turborepo pipeline
├── pnpm-workspace.yaml
└── tsconfig.base.json ← Shared TypeScript config
```

## Documentation

- [Contributing Guide](CONTRIBUTING.md) — Setup, development, publishing
- [API Reference](https://jrodrigopuca.github.io/qr-code-generator/) — TypeDoc, deployed on GitHub Pages
- [Technical Documentation](docs/technical.md)
- [Roadmap](docs/roadmap.md)
- [Future Ecosystem](docs/FUTURE.md)

## License

MIT
