# @qr-plus/compress

QR-optimized text compression using DEFLATE + Base45 (RFC 9285). Maximizes data capacity in a single QR code by combining raw DEFLATE compression with a QR-alphanumeric-compatible encoding.

## Features

- **DEFLATE + Base45** — Raw DEFLATE compression (RFC 1951) encoded with Base45 (RFC 9285)
- **QR-optimized** — Output uses only QR alphanumeric characters, fitting **4,296 chars** (vs 2,953 bytes in byte mode)
- **Self-describing** — Header format `QP1:DF:B45:<data>` includes version, algorithm, and encoding
- **Capacity validation** — Rejects payloads that exceed QR Version 40 limits before encoding
- **Environment-adaptive** — Node.js zlib (preferred) or Web Streams API (browser fallback)
- **Typed** — Full TypeScript types with const-based enums
- **Zero dependencies** — No runtime dependencies

## Installation

```bash
npm install @qr-plus/compress
```

## Quick Start

```typescript
import { compress, decompress } from "@qr-plus/compress";

// Compress data for QR encoding
const result = await compress({ data: "Hello, World! ".repeat(100) });
console.log(result.data);           // "QP1:DF:B45:..."
console.log(result.ratio);          // e.g. 0.05 (95% smaller)
console.log(result.originalSize);   // 1400
console.log(result.compressedSize); // ~70

// Decompress back to original
const original = await decompress(result.data);
console.log(original); // "Hello, World! Hello, World! ..."
```

## Usage with @qr-plus/core

```typescript
import { compress } from "@qr-plus/compress";
import { renderToSVG } from "@qr-plus/core";

const result = await compress({ data: longJsonPayload });
const svg = renderToSVG(result.data);
```

## Usage with @qr-plus/react

```tsx
import { compress } from "@qr-plus/compress";
import { QRCode } from "@qr-plus/react";

function CompressedQR({ data }: { data: string }) {
  const [qrData, setQrData] = useState("");

  useEffect(() => {
    compress({ data }).then((result) => setQrData(result.data));
  }, [data]);

  if (!qrData) return null;
  return <QRCode value={qrData} />;
}
```

## API

### `compress(config: CompressConfig): Promise<CompressResult>`

Compresses a string and returns a QR-ready encoded payload with header.

#### CompressConfig

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `data` | `string` | ✅ | — | The string to compress (must be non-empty) |
| `algorithm` | `CompressAlgorithm` | — | `"DF"` | Compression algorithm |
| `encoding` | `CompressEncoding` | — | `"B45"` | Binary-to-text encoding |

#### CompressResult

| Field | Type | Description |
|-------|------|-------------|
| `data` | `string` | Compressed string with header (ready for QR) |
| `originalSize` | `number` | Original input size in bytes (UTF-8) |
| `compressedSize` | `number` | Final output size in characters |
| `ratio` | `number` | Compression ratio (compressedSize / originalSize). < 1 means savings |

### `decompress(encoded: string): Promise<string>`

Decompresses a string previously compressed with `compress()`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `encoded` | `string` | The compressed string with `QP1:` header |

Returns the original string.

## Header Format

All compressed output follows the protocol:

```
QP1:DF:B45:<base45-encoded-deflate-data>
```

| Field | Description |
|-------|-------------|
| `QP1` | Protocol version 1 |
| `DF` | DEFLATE raw algorithm (RFC 1951) |
| `B45` | Base45 encoding (RFC 9285) |

The header uses 11 characters of overhead. All characters (including the data payload) are from the QR alphanumeric charset, so scanners read them in the efficient alphanumeric mode (5.5 bits/char vs 8 bits/char for byte mode).

## How It Works

1. **Input** → UTF-8 string
2. **Compress** → Raw DEFLATE (no zlib/gzip headers)
3. **Encode** → Base45 (each byte pair → 3 alphanumeric chars)
4. **Header** → Prepend `QP1:DF:B45:`
5. **Validate** → Reject if output > 4,296 chars (QR Version 40 limit)

### Why Base45?

Base45 uses only characters from the QR alphanumeric charset (`0-9`, `A-Z`, space, `$%*+-./:`) which QR encodes at 5.5 bits per character. This gives ~46% more capacity than byte mode (8 bits per character), allowing significantly more data in a single QR code.

## Error Handling

All errors throw `CompressError` with specific error codes:

| Code | Condition |
|------|-----------|
| `EMPTY_DATA` | Input data is empty |
| `PAYLOAD_TOO_LARGE` | Compressed output exceeds QR capacity (4,296 chars) |
| `COMPRESSION_FAILED` | DEFLATE compression failed |
| `DECOMPRESSION_FAILED` | DEFLATE decompression failed |
| `INVALID_HEADER` | Missing or malformed `QP1:` header |
| `UNSUPPORTED_ALGORITHM` | Unknown compression algorithm in header |
| `UNSUPPORTED_ENCODING` | Unknown encoding in header |

```typescript
import { compress, CompressError, COMPRESS_ERROR_CODE } from "@qr-plus/compress";

try {
  await compress({ data: "" });
} catch (error) {
  if (error instanceof CompressError) {
    console.log(error.code);    // "EMPTY_DATA"
    console.log(error.message); // "Input data must be a non-empty string."
  }
}
```

## Environment Support

| Environment | Compression Engine | Notes |
|-------------|-------------------|-------|
| Node.js ≥ 18 | `zlib.deflateRaw` / `zlib.inflateRaw` | Preferred — reliable error handling |
| Browsers | `CompressionStream` / `DecompressionStream` | Fallback — Web Streams API |

The package automatically detects the best available engine at runtime.

## Part of the @qr-plus ecosystem

| Package | Description |
|---------|-------------|
| [`@qr-plus/core`](https://www.npmjs.com/package/@qr-plus/core) | Zero-dependency QR code engine |
| [`@qr-plus/react`](https://www.npmjs.com/package/@qr-plus/react) | React components and hooks |
| [`@qr-plus/cli`](https://www.npmjs.com/package/@qr-plus/cli) | Terminal QR code generator |
| [`@qr-plus/wifi`](https://www.npmjs.com/package/@qr-plus/wifi) | WiFi QR string builder |
| [`@qr-plus/vcard`](https://www.npmjs.com/package/@qr-plus/vcard) | vCard QR string builder |
| **`@qr-plus/compress`** | **QR-optimized compression** |

## License

MIT
