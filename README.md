# qr-pure

Zero-dependency QR code generator written in TypeScript. Implements ISO/IEC 18004 standard.

## Features

- Zero dependencies for core functionality
- Supports all 40 QR versions (21x21 to 177x177 modules)
- 4 error correction levels: L (7%), M (15%), Q (25%), H (30%)
- 3 encoding modes: Numeric, Alphanumeric, Byte
- Automatic version and mask selection
- Canvas and SVG renderers included

## Installation

```bash
npm install qr-pure
```

## Usage

### Basic

```typescript
import { QRCode } from "qr-pure";

const qr = new QRCode("Hello World");
const result = qr.generate();
console.log(result.matrix); // 2D array of 0s and 1s
```

### With Options

```typescript
const qr = new QRCode("Hello World", {
	errorCorrectionLevel: "H", // L, M, Q, H
	version: "auto", // 1-40 or 'auto'
	mode: "auto", // numeric, alphanumeric, byte, or 'auto'
});
```

### Render to Canvas

```typescript
import { QRCode, CanvasRenderer } from "qr-pure";

const qr = new QRCode("Hello World");
const { matrix } = qr.generate();

const canvas = document.getElementById("qr-canvas");
CanvasRenderer.render(canvas, matrix, {
	size: 256,
	margin: 4,
	darkColor: "#000000",
	lightColor: "#ffffff",
});
```

### Render to SVG

```typescript
import { QRCode, SVGRenderer } from "qr-pure";

const qr = new QRCode("Hello World");
const { matrix } = qr.generate();

const svg = SVGRenderer.render(matrix, { size: 256 });
document.body.innerHTML = svg;
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

### CanvasRenderer

```typescript
CanvasRenderer.render(canvas, matrix, options?)
CanvasRenderer.toDataURL(matrix, options?)
```

### SVGRenderer

```typescript
SVGRenderer.render(matrix, options?)
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run E2E tests
cd e2e-tests && npm install && npm test
```

## Documentation

- [Technical Documentation](docs/technical.md)
- [Roadmap](docs/roadmap.md)

## License

MIT
