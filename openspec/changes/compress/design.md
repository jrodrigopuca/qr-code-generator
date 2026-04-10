# Technical Design: @qr-plus/compress

## Overview

A zero-dependency package that compresses arbitrary text into QR-optimized strings using DEFLATE + Base45, and decompresses them back. The output is a self-describing string with a versioned header protocol, designed to maximize QR alphanumeric mode capacity.

## Architecture Decisions

### AD-1: Async Public API

**Decision**: `compress()` and `decompress()` return `Promise<string>`.

**Rationale**: Unlike `@qr-plus/wifi` and `@qr-plus/vcard` (synchronous string builders), compression APIs on both target platforms are inherently asynchronous:

- **Node.js**: `zlib.deflateRaw` / `zlib.inflateRaw` are callback-based, wrapped in `Promise`
- **Browser**: `CompressionStream` / `DecompressionStream` are stream-based async APIs

Making the API async avoids blocking the main thread and provides a single universal interface across runtimes.

**Tradeoffs**: Cannot be composed inline with sync builders (`buildWifiString()`). Documented as intentional — future integration packages can handle the async boundary.

### AD-2: Native Platform APIs Only — Zero Polyfills

**Decision**: Use native `zlib` (Node.js) and `CompressionStream`/`DecompressionStream` (browser). No bundled DEFLATE implementation, no polyfills.

**Runtime detection strategy**:

```
1. Check `globalThis.CompressionStream` exists → use Web Streams (browser path)
2. Else, dynamically import `node:zlib` → use zlib (Node.js path)
3. If neither available → throw CompressError(COMPRESSION_FAILED)
```

**Why `globalThis.CompressionStream` first**: This ordering works correctly in Node.js 18+ (which also has `CompressionStream` globally available), and in browsers. Both paths use the same DEFLATE algorithm, producing interoperable output.

**Why dynamic import for zlib**: Using `import("node:zlib")` instead of a top-level import ensures the browser bundle doesn't include a Node.js module reference. The tsup bundler will not try to resolve it at build time because it's a dynamic import.

**Tradeoffs**: Older browsers without `CompressionStream` (pre-Chrome 80, pre-Firefox 113, pre-Safari 16.4) are not supported. Documented as a requirement, not shipped as a polyfill.

### AD-3: DEFLATE Raw (No Zlib Header)

**Decision**: Use `deflate-raw` algorithm (raw DEFLATE without zlib/gzip headers).

**Rationale**:

- `CompressionStream('deflate-raw')` and `zlib.deflateRaw()` produce the same byte stream
- Saves 2-6 bytes of header overhead compared to `deflate` (zlib-wrapped) or `gzip`
- Interoperability: both platforms produce identical output for the same input

**Wire format**: The algorithm is encoded in the header as `DF` (short for deflate-raw).

### AD-4: Base45 Encoding (RFC 9285)

**Decision**: Inline implementation (~60-80 lines), no external dependency.

**Rationale**: Base45 uses only QR alphanumeric mode characters (`0-9`, `A-Z`, space, `$%*+-./:`) which encode at 5.5 bits/char instead of 8 bits/char. This yields ~30% more capacity than Base64 for QR codes.

**Charset** (45 characters, indexed 0-44):

```
0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:
```

**Algorithm**:

- **Encode**: Process input bytes in pairs. Each pair `(a, b)` → value `a * 256 + b` → 3 Base45 chars (`c, d, e` where `value = c + d*45 + e*45*45`). Single remaining byte → 2 Base45 chars.
- **Decode**: Process chars in groups of 3 → 2 bytes. Group of 2 → 1 byte. Validate all chars are in charset, validate numeric ranges.

**Verification**: Test against RFC 9285 Section 4 test vectors.

### AD-5: Header Protocol

**Format**: `QP1:DF:B45:<data>`

| Segment | Value | Description |
|---------|-------|-------------|
| `QP1` | Fixed | Protocol version — @qr-plus/compress v1 |
| `DF` | Variable | Compression algorithm (currently only `DF` = deflate-raw) |
| `B45` | Variable | Binary-to-text encoding (currently only `B45` = base45) |
| `<data>` | Variable | The encoded payload |

**Separator**: Colon (`:`) — part of the QR alphanumeric charset, so it doesn't break alphanumeric mode.

**Header overhead**: `QP1:DF:B45:` = 11 characters. Negligible against 4,296-character capacity.

**Forward compatibility**: Unknown algorithm or encoding values produce typed errors (`UNSUPPORTED_ALGORITHM`, `UNSUPPORTED_ENCODING`), enabling future additions (e.g., `ZS` for zstd, `B64` for base64) without breaking existing decoders.

### AD-6: Capacity Validation — QR Alphanumeric Mode

**Decision**: Validate against QR alphanumeric capacity (4,296 chars) not byte capacity (2,953 bytes).

**Rationale**: Since the entire output (header + Base45 data) consists exclusively of QR alphanumeric characters, a QR generator will use alphanumeric mode encoding. QR Version 40 at ECL Low supports:

- **Binary mode**: 2,953 bytes (8 bits/char)
- **Alphanumeric mode**: 4,296 characters (5.5 bits/char)

Using alphanumeric mode means we can fit ~46% more characters than binary mode. The constant `QR_ALPHANUMERIC_CAPACITY = 4296` reflects this.

**Important**: The actual byte storage is the same — alphanumeric mode just packs characters more efficiently. The QR generator must detect this (most do automatically).

### AD-7: Error Model — Typed Error Codes

**Decision**: Follow `WifiError` / `VCardError` pattern with `CompressError` class and `COMPRESS_ERROR_CODE` const object.

**Error codes** (7 total):

| Code | When | Message Pattern |
|------|------|----------------|
| `EMPTY_DATA` | `compress("")` or `compress("  ")` | "Data must be a non-empty string." |
| `PAYLOAD_TOO_LARGE` | Compressed output > 4,296 chars | "Compressed output ({n} chars) exceeds QR alphanumeric capacity (4296)." |
| `COMPRESSION_FAILED` | Native API throws or unavailable | "Compression failed: {reason}" |
| `DECOMPRESSION_FAILED` | Native API throws or corrupt data | "Decompression failed: {reason}" |
| `INVALID_FORMAT` | Missing/malformed header | "Invalid format: expected QP1:alg:enc:data header." |
| `UNSUPPORTED_ALGORITHM` | Unknown algorithm in header | "Unsupported algorithm: \"{alg}\". Supported: DF." |
| `UNSUPPORTED_ENCODING` | Unknown encoding in header | "Unsupported encoding: \"{enc}\". Supported: B45." |

## Data Flow

### compress()

```
Input: string (data) + optional CompressConfig
  │
  ├─ Validate: non-empty string → EMPTY_DATA
  │
  ├─ TextEncoder.encode(data) → Uint8Array (raw bytes)
  │
  ├─ deflateRaw(bytes) → Uint8Array (compressed)
  │  └─ Node: zlib.deflateRaw() wrapped in Promise
  │  └─ Browser: CompressionStream('deflate-raw') piped through ReadableStream
  │  └─ Neither: throw COMPRESSION_FAILED
  │
  ├─ base45Encode(compressed) → string (alphanumeric chars only)
  │
  ├─ Prepend header: "QP1:DF:B45:" + encoded
  │
  ├─ Validate: result.length ≤ 4296 → PAYLOAD_TOO_LARGE
  │
  └─ Return: CompressResult { data: string, originalSize, compressedSize, ratio }
```

### decompress()

```
Input: string (encoded)
  │
  ├─ Split on ":" → expect exactly 4 parts [version, alg, enc, data]
  │  └─ If not 4 parts → INVALID_FORMAT
  │
  ├─ Validate version === "QP1" → INVALID_FORMAT
  │
  ├─ Validate algorithm === "DF" → UNSUPPORTED_ALGORITHM
  │
  ├─ Validate encoding === "B45" → UNSUPPORTED_ENCODING
  │
  ├─ base45Decode(data) → Uint8Array
  │
  ├─ inflateRaw(bytes) → Uint8Array (decompressed)
  │  └─ Node: zlib.inflateRaw() wrapped in Promise
  │  └─ Browser: DecompressionStream('deflate-raw')
  │  └─ Neither / corrupt: throw DECOMPRESSION_FAILED
  │
  └─ TextDecoder.decode(decompressed) → string
```

### Header Parsing Detail

The header uses colon (`:`) as separator. Since Base45 charset includes `:`, the data portion may contain colons. Therefore, parsing must use a **limited split**:

```ts
// Split into at most 4 parts — everything after the 3rd colon is data
const firstColon = encoded.indexOf(":");
const secondColon = encoded.indexOf(":", firstColon + 1);
const thirdColon = encoded.indexOf(":", secondColon + 1);
const version = encoded.slice(0, firstColon);
const algorithm = encoded.slice(firstColon + 1, secondColon);
const encoding = encoded.slice(secondColon + 1, thirdColon);
const data = encoded.slice(thirdColon + 1);
```

This is critical because a naive `split(":")` would break the data payload.

## File Structure

```
packages/compress/
├── package.json          # @qr-plus/compress, zero runtime deps
├── tsconfig.json         # extends ../../tsconfig.base.json
├── tsup.config.ts        # dual CJS+ESM, same as wifi
├── vitest.config.ts      # node environment, tests/**/*.test.ts
├── LICENSE               # MIT
├── README.md             # Usage docs + browser requirements
├── src/
│   ├── index.ts          # Public re-exports (compress, decompress, types, errors)
│   ├── types.ts          # CompressConfig, CompressResult, constants
│   ├── errors.ts         # CompressError, COMPRESS_ERROR_CODE
│   ├── base45.ts         # base45Encode(), base45Decode() — internal
│   ├── deflate.ts        # deflateRaw(), inflateRaw() — internal, Node/browser
│   └── compress.ts       # compress(), decompress() — public API
└── tests/
    └── compress.test.ts  # All test categories in one file
```

### Module Responsibility

| File | Exports | Visibility |
|------|---------|------------|
| `index.ts` | `compress`, `decompress`, `CompressError`, `COMPRESS_ERROR_CODE`, `CompressConfig`, `CompressResult`, `COMPRESS_ALGORITHM`, `COMPRESS_ENCODING`, `PROTOCOL_VERSION`, `QR_ALPHANUMERIC_CAPACITY` | Public |
| `types.ts` | Constants + interfaces | Public (via index) |
| `errors.ts` | `CompressError`, `COMPRESS_ERROR_CODE` | Public (via index) |
| `base45.ts` | `base45Encode`, `base45Decode` | Internal only |
| `deflate.ts` | `deflateRaw`, `inflateRaw` | Internal only |
| `compress.ts` | `compress`, `decompress` | Public (via index) |

## Type Definitions

### types.ts

```ts
/**
 * @fileoverview Shared types for @qr-plus/compress
 * @module @qr-plus/compress/types
 */

const COMPRESS_ALGORITHM = {
  DEFLATE: "DF",
} as const;

type CompressAlgorithm =
  (typeof COMPRESS_ALGORITHM)[keyof typeof COMPRESS_ALGORITHM];

const COMPRESS_ENCODING = {
  BASE45: "B45",
} as const;

type CompressEncoding =
  (typeof COMPRESS_ENCODING)[keyof typeof COMPRESS_ENCODING];

const PROTOCOL_VERSION = "QP1" as const;

/** Max characters in QR alphanumeric mode, Version 40, ECL Low */
const QR_ALPHANUMERIC_CAPACITY = 4296 as const;

/** Header separator character */
const HEADER_SEPARATOR = ":" as const;

interface CompressConfig {
  /** The string data to compress. Must be non-empty. */
  readonly data: string;
  /** Compression algorithm. @default "DF" (deflate-raw) */
  readonly algorithm?: CompressAlgorithm;
  /** Binary-to-text encoding. @default "B45" (base45) */
  readonly encoding?: CompressEncoding;
}

interface CompressResult {
  /** The compressed, encoded string with header (ready for QR). */
  readonly data: string;
  /** Original input size in bytes (UTF-8). */
  readonly originalSize: number;
  /** Final output size in characters. */
  readonly compressedSize: number;
  /** Compression ratio (compressedSize / originalSize). < 1 means savings. */
  readonly ratio: number;
}
```

### errors.ts

```ts
/**
 * @fileoverview Custom errors for @qr-plus/compress
 * @module @qr-plus/compress/errors
 */

const COMPRESS_ERROR_CODE = {
  EMPTY_DATA: "EMPTY_DATA",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  COMPRESSION_FAILED: "COMPRESSION_FAILED",
  DECOMPRESSION_FAILED: "DECOMPRESSION_FAILED",
  INVALID_FORMAT: "INVALID_FORMAT",
  UNSUPPORTED_ALGORITHM: "UNSUPPORTED_ALGORITHM",
  UNSUPPORTED_ENCODING: "UNSUPPORTED_ENCODING",
} as const;

type CompressErrorCode =
  (typeof COMPRESS_ERROR_CODE)[keyof typeof COMPRESS_ERROR_CODE];

class CompressError extends Error {
  readonly code: CompressErrorCode;

  constructor(code: CompressErrorCode, message: string) {
    super(message);
    this.name = "CompressError";
    this.code = code;
  }
}
```

## Internal Module Design

### base45.ts

Pure functions, no side effects, no dependencies.

```ts
const BASE45_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

function base45Encode(input: Uint8Array): string { ... }
function base45Decode(input: string): Uint8Array { ... }
```

**Encode algorithm**:

1. Process bytes in pairs `(i, i+1)`
2. For each pair: `n = bytes[i] * 256 + bytes[i+1]`
3. Emit 3 chars: `c = n % 45`, `d = (n / 45 | 0) % 45`, `e = (n / 2025 | 0)`
4. Single remaining byte: `n = bytes[i]`, emit 2 chars: `c = n % 45`, `d = (n / 45 | 0)`

**Decode algorithm**:

1. Map each char to its index in `BASE45_CHARSET` — throw on invalid chars
2. Process groups of 3: `n = c + d*45 + e*2025` → 2 bytes
3. Process remaining group of 2: `n = c + d*45` → 1 byte
4. Validate: `n` must be in range `[0, 65535]` for triplets, `[0, 255]` for pairs

### deflate.ts

Environment-adaptive compression. Async functions.

```ts
async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  // Try CompressionStream first (works in both modern Node 18+ and browsers)
  if (typeof globalThis.CompressionStream !== "undefined") {
    return deflateRawWeb(data);
  }
  // Fallback to Node.js zlib
  try {
    const { deflateRaw: nodeDeflateRaw } = await import("node:zlib");
    return deflateRawNode(data, nodeDeflateRaw);
  } catch {
    throw new CompressError(
      COMPRESS_ERROR_CODE.COMPRESSION_FAILED,
      "No compression API available. Requires CompressionStream (browser) or zlib (Node.js)."
    );
  }
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  // Mirror structure of deflateRaw
}
```

**Browser path** (`deflateRawWeb`):

```ts
async function deflateRawWeb(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  // Concatenate chunks into single Uint8Array
  return concatUint8Arrays(chunks);
}
```

**Node.js path** (`deflateRawNode`):

```ts
function deflateRawNode(
  data: Uint8Array,
  nodeDeflateRaw: typeof import("node:zlib").deflateRaw,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    nodeDeflateRaw(data, (err, result) => {
      if (err) reject(err);
      else resolve(new Uint8Array(result));
    });
  });
}
```

### compress.ts

Public API orchestrator. Wires together validation, deflate, base45, and header.

```ts
async function compress(config: CompressConfig): Promise<CompressResult> {
  // 1. Validate input
  // 2. Encode string to bytes
  // 3. Compress with deflateRaw
  // 4. Encode with base45
  // 5. Build header string
  // 6. Validate capacity
  // 7. Return CompressResult with metadata
}

async function decompress(encoded: string): Promise<string> {
  // 1. Parse header (limited split on ":")
  // 2. Validate version, algorithm, encoding
  // 3. Decode with base45
  // 4. Decompress with inflateRaw
  // 5. Decode bytes to string
  // 6. Return original string
}
```

## Package Configuration

### package.json

Key differences from wifi package:

- Name: `@qr-plus/compress`
- Keywords: `qr`, `compression`, `deflate`, `base45`, `qr-code`
- Same devDependencies: `tsup`, `typescript`, `vitest`
- Same engine: `node >= 18.0.0`
- **No runtime dependencies**

### tsconfig.json

Identical to wifi — extends `../../tsconfig.base.json`, module `es2022`, moduleResolution `bundler`.

### tsup.config.ts

Identical to wifi — dual CJS+ESM, dts, sourcemap, treeshake.

**Important**: No `external` config needed. Since `node:zlib` is dynamically imported, tsup won't bundle it. For the browser build, the dynamic import path is never reached.

### vitest.config.ts

Identical to wifi — `environment: "node"`, `include: ["tests/**/*.test.ts"]`.

### biome.json (monorepo-level)

Add compress paths to the `files.includes` array:

```json
"files": {
  "includes": [
    "packages/compress/src/**",
    "packages/compress/tests/**",
    // ... existing entries
  ]
}
```

## Testing Strategy

### Test File: `tests/compress.test.ts`

Single test file covering all categories (consistent with the package's focused scope):

**1. Base45 round-trips**

- Empty input → empty output
- Single byte → 2 chars → decode back
- Byte pair → 3 chars → decode back
- Known RFC 9285 test vectors:
  - `"AB"` → `"BB8"`
  - `"Hello!!"` → `"%69 VD92EX0"`
  - `"base-45"` → `"UJCLQE7W581"`
- Random byte arrays (property-based style)

**2. compress/decompress round-trips**

- Simple ASCII string
- JSON object (realistic use case)
- Unicode content (emoji, CJK characters)
- Large payload (close to capacity limit)
- Minimum payload (single character)

**3. Error cases**

- `EMPTY_DATA`: empty string, whitespace-only string
- `PAYLOAD_TOO_LARGE`: input so large that compressed output exceeds 4,296 chars
- `COMPRESSION_FAILED`: tested via mock (if feasible)
- `DECOMPRESSION_FAILED`: corrupted Base45 data
- `INVALID_FORMAT`: missing header, wrong separator count
- `UNSUPPORTED_ALGORITHM`: header with unknown algorithm (e.g., `QP1:ZS:B45:...`)
- `UNSUPPORTED_ENCODING`: header with unknown encoding (e.g., `QP1:DF:B64:...`)

**4. Header parsing**

- Valid header parses correctly
- Data containing colons is preserved
- Missing version rejects
- Extra segments handled correctly

**5. Capacity validation**

- Output at exactly 4,296 chars → accepted
- Output at 4,297 chars → rejected with `PAYLOAD_TOO_LARGE`

**6. Compression effectiveness**

- Verify that a 2KB JSON payload compresses to under 4,296 chars
- Verify ratio metadata is accurate

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `CompressionStream('deflate-raw')` not available in test environment | Low | Vitest runs in Node.js 18+ which supports both `zlib` and `CompressionStream` |
| Base45 charset includes colon, breaking header parsing | Addressed | Limited split (find first 3 colons only, rest is data) — see Header Parsing Detail |
| Dynamic `import("node:zlib")` fails in browser bundlers | Low | tsup won't resolve dynamic imports; browser path uses `CompressionStream` and never reaches zlib import |
| DEFLATE output differs between Node.js and browser | None | Raw DEFLATE is a standard algorithm; output bytes may differ (implementation-specific) but both can decompress each other's output. Round-trip works cross-platform. |
| Small payloads expand after compression | Expected | DEFLATE adds ~10 bytes overhead. Document that compression is most effective for payloads >100 bytes. Package still works — just no size savings. |

## Files Affected

| File | Action | Description |
|------|--------|-------------|
| `packages/compress/package.json` | Create | Package manifest, zero runtime deps |
| `packages/compress/tsconfig.json` | Create | TypeScript config extending base |
| `packages/compress/tsup.config.ts` | Create | Dual CJS+ESM build config |
| `packages/compress/vitest.config.ts` | Create | Test runner config |
| `packages/compress/LICENSE` | Create | MIT license |
| `packages/compress/README.md` | Create | Usage documentation |
| `packages/compress/src/index.ts` | Create | Public API re-exports |
| `packages/compress/src/types.ts` | Create | Types, constants, interfaces |
| `packages/compress/src/errors.ts` | Create | CompressError class + error codes |
| `packages/compress/src/base45.ts` | Create | Base45 encode/decode (RFC 9285) |
| `packages/compress/src/deflate.ts` | Create | DEFLATE raw via native APIs |
| `packages/compress/src/compress.ts` | Create | Public compress/decompress functions |
| `packages/compress/tests/compress.test.ts` | Create | Full test suite |
| `biome.json` | Modify | Add compress paths to files.includes |

**Total**: 13 new files + 1 modified file.
