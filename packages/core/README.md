# qr-pure

[![npm](https://img.shields.io/npm/v/qr-pure)](https://www.npmjs.com/package/qr-pure)
[![CI](https://github.com/jrodrigopuca/qr-code-generator/actions/workflows/main.yml/badge.svg)](https://github.com/jrodrigopuca/qr-code-generator/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![API Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://jrodrigopuca.github.io/qr-code-generator/)

Zero-dependency QR code generator written in TypeScript. Implements ISO/IEC 18004 standard.

## Features

- Zero dependencies for core functionality
- Supports all 40 QR versions (21x21 to 177x177 modules)
- 4 error correction levels: L (7%), M (15%), Q (25%), H (30%)
- 3 encoding modes: Numeric, Alphanumeric, Byte with auto-detection
- Automatic version and mask selection
- **3 renderers**: Canvas, SVG (with module shapes), Terminal (ASCII/Unicode)
- Dual CJS + ESM build with TypeScript declarations
- 350+ unit/integration tests + E2E verification with jsQR

## Installation

```bash
npm install qr-pure
```

## Usage

### Quick Start

```typescript
import { generateQR, renderToSVG, renderToTerminal } from "qr-pure";

// Generate QR matrix
const { matrix } = generateQR("Hello World");

// Render as SVG string
const svg = renderToSVG("Hello World", { scale: 10 });

// Print to terminal
console.log(renderToTerminal("Hello World"));
```

### With Options

```typescript
import { QRCode } from "qr-pure";

const qr = new QRCode("Hello World", {
	errorCorrectionLevel: "H", // L, M, Q, H
	version: "auto", // 1-40 or 'auto'
	mode: "auto", // numeric, alphanumeric, byte, or 'auto'
	mask: "auto", // 0-7 or 'auto'
});

const { matrix, version, size, mode, maskPattern } = qr.generate();
```

### Render to Canvas

```typescript
import { QRCode, CanvasRenderer } from "qr-pure";

const qr = new QRCode("Hello World");
const { matrix } = qr.generate();

const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
CanvasRenderer.render(canvas, matrix, {
	scale: 10,
	margin: 4,
	darkColor: "#000000",
	lightColor: "#ffffff",
});
```

### Render to SVG

```typescript
import { SVGRenderer } from "qr-pure";

// Standard squares
const svg = SVGRenderer.render(matrix, { scale: 10 });

// Rounded modules
SVGRenderer.render(matrix, { moduleShape: "rounded", cornerRadius: 0.3 });

// Circle or dot modules
SVGRenderer.render(matrix, { moduleShape: "circle" });
SVGRenderer.render(matrix, { moduleShape: "dot" });
```

### Render to Terminal

```typescript
import { TerminalRenderer } from "qr-pure";

// Unicode blocks (best contrast)
console.log(TerminalRenderer.render(matrix));

// Compact mode (half height)
console.log(TerminalRenderer.render(matrix, { style: "compact" }));

// ASCII (max compatibility)
console.log(TerminalRenderer.render(matrix, { style: "ascii" }));

// Inverted for dark backgrounds
console.log(TerminalRenderer.render(matrix, { invert: true }));
```

## API

### QRCode

```typescript
new QRCode(data: string, options?: QRCodeOptions)
```

**Options:**

- `errorCorrectionLevel`: `'L'` | `'M'` | `'Q'` | `'H'` (default: `'M'`)
- `version`: `1-40` | `'auto'` (default: `'auto'`)
- `mode`: `'numeric'` | `'alphanumeric'` | `'byte'` | `'auto'` (default: `'auto'`)
- `mask`: `0-7` | `'auto'` (default: `'auto'`)

**Methods:**

- `generate()`: Returns `{ matrix, version, size, mode, maskPattern }`

### Helper Functions

```typescript
generateQR(content, options?)           // → QRCodeResult
renderToCanvas(canvas, content, options?) // → void
renderToSVG(content, options?)          // → string
renderToTerminal(content, options?)     // → string
```

### CanvasRenderer

```typescript
CanvasRenderer.render(canvas, matrix, options?)
CanvasRenderer.toDataURL(matrix, options?)
CanvasRenderer.toBlob(matrix, options?)
```

### SVGRenderer

```typescript
SVGRenderer.render(matrix, options?)
// options: scale, margin, darkColor, lightColor, moduleShape, cornerRadius
```

### TerminalRenderer

```typescript
TerminalRenderer.render(matrix, options?)
// options: style ('unicode' | 'compact' | 'ascii'), margin, invert
```

## Development

This package is part of the [qr-pure monorepo](https://github.com/jrodrigopuca/qr-code-generator). See the [root README](../../README.md) for setup instructions.

```bash
# From the monorepo root
pnpm install         # Install all dependencies
pnpm run build       # Build all packages
pnpm run test        # Run all tests (unit + integration + E2E)
pnpm run typecheck   # Type check
pnpm run lint        # Lint

# Or run commands scoped to the core package
pnpm --filter qr-pure test
pnpm --filter qr-pure build
```

## Documentation

- [API Reference](https://jrodrigopuca.github.io/qr-code-generator/) — generated with TypeDoc, deployed on GitHub Pages
- [Technical Documentation](https://github.com/jrodrigopuca/qr-code-generator/blob/master/docs/technical.md)
- [Changelog](CHANGELOG.md)
- [Roadmap](https://github.com/jrodrigopuca/qr-code-generator/blob/master/docs/roadmap.md)

## License

MIT
