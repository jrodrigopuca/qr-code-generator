# Tasks: @qr-plus/compress

## Overview

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1 — Scaffold | 5 | Package skeleton, configs, biome |
| Phase 2 — Types & Errors | 2 | Constants, interfaces, CompressError |
| Phase 3 — Base45 Codec | 2 | Encode/decode + tests |
| Phase 4 — DEFLATE Adapter | 2 | Platform-adaptive deflate/inflate + tests |
| Phase 5 — Public API | 2 | compress(), decompress() + tests |
| Phase 6 — Integration Tests | 1 | Round-trip, capacity, header edge cases |
| Phase 7 — Validation | 2 | Build, typecheck, lint, full green |
| **TOTAL** | **16** | |

---

## Phase 1 — Scaffold

Package skeleton matching `@qr-plus/wifi` conventions exactly.

### Task 1.1: Create `packages/compress/package.json`

- [ ] Create `packages/compress/package.json`
- Follow exact structure from `packages/wifi/package.json`
- Name: `@qr-plus/compress`
- Description: `"QR-optimized text compression using DEFLATE + Base45 (RFC 9285). Maximizes data capacity in a single QR code."`
- `"type": "module"`
- Dual CJS+ESM exports (same `exports` map as wifi)
- `files`: `["dist", "README.md", "LICENSE"]`
- Scripts: `build`, `dev`, `typecheck`, `test`, `test:watch`, `prepublishOnly` (same as wifi)
- Keywords: `["qr", "qrcode", "compression", "deflate", "base45", "qr-code", "typescript"]`
- `engines.node`: `">=18.0.0"`
- **Zero `dependencies`** — only `devDependencies`: `tsup`, `typescript`, `vitest` (same versions as wifi)
- Repository directory: `"packages/compress"`

**Refs**: `packages/wifi/package.json`, Design §Package Configuration, Spec REQ-NFR-01

### Task 1.2: Create `packages/compress/tsconfig.json`

- [ ] Create `packages/compress/tsconfig.json`
- Extend `../../tsconfig.base.json`
- `outDir`: `"dist"`, `rootDir`: `"src"`
- `module`: `"es2022"`, `moduleResolution`: `"bundler"`
- `ignoreDeprecations`: `"6.0"`
- `include`: `["src/**/*"]`
- Must be identical to `packages/wifi/tsconfig.json`

**Refs**: `packages/wifi/tsconfig.json`

### Task 1.3: Create `packages/compress/tsup.config.ts`

- [ ] Create `packages/compress/tsup.config.ts`
- Entry: `["src/index.ts"]`
- Format: `["cjs", "esm"]`
- `dts: true`, `clean: true`, `sourcemap: true`, `splitting: false`, `treeshake: true`, `minify: false`
- `outDir: "dist"`
- Identical to `packages/wifi/tsup.config.ts`
- Note: No `external` needed — `node:zlib` is dynamically imported so tsup won't resolve it

**Refs**: `packages/wifi/tsup.config.ts`, Design §tsup.config.ts

### Task 1.4: Create `packages/compress/vitest.config.ts`

- [ ] Create `packages/compress/vitest.config.ts`
- `globals: true`, `environment: "node"`
- `include: ["tests/**/*.test.ts"]`
- Identical to `packages/wifi/vitest.config.ts`

**Refs**: `packages/wifi/vitest.config.ts`

### Task 1.5: Update `biome.json` to include compress package

- [ ] Edit root `biome.json`
- Add `"packages/compress/src/**"` and `"packages/compress/tests/**"` to `files.includes` array
- Place them alphabetically between core and vcard entries

**Refs**: Root `biome.json` lines 48-57, Design §biome.json

---

## Phase 2 — Types & Errors

Foundation types and error class. These are imported by all other source modules.

### Task 2.1: Create `packages/compress/src/types.ts`

- [ ] Create `packages/compress/src/types.ts`
- Follow `const` + `typeof` pattern from `packages/wifi/src/types.ts`
- Define constants:
  - `COMPRESS_ALGORITHM = { DEFLATE: "DF" } as const`
  - `COMPRESS_ENCODING = { BASE45: "B45" } as const`
  - `PROTOCOL_VERSION = "QP1" as const`
  - `QR_ALPHANUMERIC_CAPACITY = 4296 as const`
  - `HEADER_SEPARATOR = ":" as const`
- Define derived types:
  - `CompressAlgorithm = (typeof COMPRESS_ALGORITHM)[keyof typeof COMPRESS_ALGORITHM]`
  - `CompressEncoding = (typeof COMPRESS_ENCODING)[keyof typeof COMPRESS_ENCODING]`
- Define interfaces:
  - `CompressConfig` — `{ readonly data: string; readonly algorithm?: CompressAlgorithm; readonly encoding?: CompressEncoding }`
  - `CompressResult` — `{ readonly data: string; readonly originalSize: number; readonly compressedSize: number; readonly ratio: number }`
- Export types with `export type { ... }` and values with `export { ... }` (same pattern as wifi)

**Refs**: Design §Type Definitions (types.ts), Spec REQ-TYP-01 through REQ-TYP-04, `packages/wifi/src/types.ts`

**Note**: Spec uses the name `CompressOptions` but Design uses `CompressConfig`. Follow the Design — use `CompressConfig` (consistent with `WifiConfig`). The `index.ts` public export can alias if needed.

### Task 2.2: Create `packages/compress/src/errors.ts`

- [ ] Create `packages/compress/src/errors.ts`
- Follow exact pattern from `packages/wifi/src/errors.ts`
- Define `COMPRESS_ERROR_CODE` const object with 7 error codes:
  - `EMPTY_DATA`, `PAYLOAD_TOO_LARGE`, `COMPRESSION_FAILED`, `DECOMPRESSION_FAILED`, `INVALID_FORMAT`, `UNSUPPORTED_ALGORITHM`, `UNSUPPORTED_ENCODING`
  - Each value is a string matching its key name (e.g., `EMPTY_DATA: "EMPTY_DATA"`)
- Derive `CompressErrorCode` type via `typeof`
- `CompressError` class:
  - Extends `Error`
  - `readonly code: CompressErrorCode`
  - Constructor: `(code, message)` → `super(message)`, `this.name = "CompressError"`, `this.code = code`
- Export: `export type { CompressErrorCode }` and `export { COMPRESS_ERROR_CODE, CompressError }`

**Refs**: Design §errors.ts, Spec REQ-ERR-01 through REQ-ERR-03, `packages/wifi/src/errors.ts`

---

## Phase 3 — Base45 Codec

Internal module. Not exported from `index.ts`. Must be tested directly via relative imports in tests.

### Task 3.1: Create `packages/compress/src/base45.ts`

- [ ] Create `packages/compress/src/base45.ts`
- Define `BASE45_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"`
- Build a reverse lookup map (char → index) at module level for O(1) decode lookups
- Implement `base45Encode(input: Uint8Array): string`:
  - Process bytes in pairs: each pair → value `a*256 + b` → 3 Base45 chars (`n%45`, `(n/45|0)%45`, `(n/2025|0)`)
  - Single remaining byte → 2 chars (`n%45`, `(n/45|0)`)
  - Empty input → empty string
- Implement `base45Decode(input: string): Uint8Array`:
  - Validate all chars are in charset, throw on invalid chars
  - Process groups of 3 chars → 2 bytes: `n = c + d*45 + e*2025`
  - Remaining group of 2 → 1 byte: `n = c + d*45`
  - Validate ranges: triplet `n <= 65535`, pair `n <= 255`
  - Empty string → empty Uint8Array
- No imports from other src modules (pure standalone)
- Export only `base45Encode` and `base45Decode`

**Refs**: Design §base45.ts, Spec REQ-B45-01 through REQ-B45-04

### Task 3.2: Create `packages/compress/tests/base45.test.ts`

- [ ] Create `packages/compress/tests/base45.test.ts`
- Import `base45Encode`, `base45Decode` from `"../src/base45"`
- `describe("Base45 Codec")`:
  - `describe("base45Encode")`:
    - RFC 9285 test vectors:
      - `"AB"` (as bytes) → `"BB8"` (Spec REQ-B45-01)
      - `"Hello!!"` (as bytes) → `"%69 VD92EX0"` (Spec REQ-B45-01)
      - `"base-45"` (as bytes) → `"UJCLQE7W581"` (Design §Testing)
    - Empty `Uint8Array` → `""` (Spec REQ-B45-01 Scenario 2)
    - Single byte → 2-char output (Spec REQ-B45-01 Scenario 3)
    - Two bytes → 3-char output (Spec REQ-B45-01 Scenario 4)
    - All output chars match QR-alphanumeric pattern `[0-9A-Z $%*+\-./:]+` (Spec REQ-B45-04)
  - `describe("base45Decode")`:
    - Reverse of all RFC 9285 vectors (Spec REQ-B45-02)
    - Empty string → empty `Uint8Array` (Spec REQ-B45-02 Scenario 2)
    - Invalid character → throws (Design §Decode algorithm step 1)
  - `describe("round-trip")`:
    - Arbitrary binary data round-trip (Spec REQ-B45-03 Scenario 1)
    - All 256 byte values [0x00..0xFF] round-trip (Spec REQ-B45-03 Scenario 2)
    - Multiple lengths (0, 1, 2, 3, 100, 255 bytes) round-trip
- Follow `describe/it` pattern from `packages/wifi/tests/wifi.test.ts`

**Refs**: Spec REQ-B45-01 through REQ-B45-04, Design §Testing Strategy §1

---

## Phase 4 — DEFLATE Adapter

Internal module for environment-adaptive compression. Not exported from `index.ts`.

### Task 4.1: Create `packages/compress/src/deflate.ts`

- [ ] Create `packages/compress/src/deflate.ts`
- Import `CompressError`, `COMPRESS_ERROR_CODE` from `"./errors"`
- Implement `deflateRaw(data: Uint8Array): Promise<Uint8Array>`:
  - Check `globalThis.CompressionStream` first → call `deflateRawWeb`
  - Else dynamic `import("node:zlib")` → call `deflateRawNode`
  - If neither → throw `CompressError(COMPRESSION_FAILED, ...)`
- Implement `inflateRaw(data: Uint8Array): Promise<Uint8Array>`:
  - Mirror structure: `DecompressionStream` → `inflateRawWeb`, else `import("node:zlib")` → `inflateRawNode`
  - Catch and wrap errors as `CompressError(DECOMPRESSION_FAILED, ...)`
- Internal helpers:
  - `deflateRawWeb(data)`: Use `CompressionStream("deflate-raw")`, writer/reader pattern, collect chunks, concatenate
  - `deflateRawNode(data, nodeDeflateRaw)`: Wrap callback in Promise
  - `inflateRawWeb(data)`: Use `DecompressionStream("deflate-raw")`, same stream pattern
  - `inflateRawNode(data, nodeInflateRaw)`: Wrap callback in Promise
  - `concatUint8Arrays(chunks)`: Helper to merge Uint8Array chunks into one
- Export only `deflateRaw` and `inflateRaw`

**Refs**: Design §deflate.ts, AD-2, AD-3, Spec REQ-CMP-05, REQ-DEC-05

### Task 4.2: Create `packages/compress/tests/deflate.test.ts`

- [ ] Create `packages/compress/tests/deflate.test.ts`
- Import `deflateRaw`, `inflateRaw` from `"../src/deflate"`
- `describe("DEFLATE Adapter")`:
  - `describe("deflateRaw")`:
    - Returns a `Uint8Array` for valid input
    - Compresses non-trivial input (output should be non-empty)
    - Empty `Uint8Array(0)` produces valid (non-empty) DEFLATE output (DEFLATE has overhead even for empty)
  - `describe("inflateRaw")`:
    - Decompresses output from `deflateRaw` back to original bytes
    - Throws on invalid/corrupted DEFLATE data (verify `DECOMPRESSION_FAILED` error code)
  - `describe("round-trip")`:
    - Short text bytes round-trip
    - Large repetitive data round-trip
    - Unicode text bytes round-trip (encode with `TextEncoder` before, decode with `TextDecoder` after)

**Refs**: Spec REQ-CMP-05, REQ-DEC-05, Design §deflate.ts

---

## Phase 5 — Public API

The `compress()` and `decompress()` functions + public barrel export.

### Task 5.1: Create `packages/compress/src/compress.ts`

- [ ] Create `packages/compress/src/compress.ts`
- Import from local modules: `types.ts`, `errors.ts`, `base45.ts`, `deflate.ts`
- Implement `compress(config: CompressConfig): Promise<CompressResult>`:
  1. Validate `config.data` is non-empty string → `EMPTY_DATA` (only `""` is invalid, whitespace is valid per Spec REQ-CMP-02)
  2. `TextEncoder.encode(config.data)` → `Uint8Array`
  3. `await deflateRaw(bytes)` → compressed bytes (wrap error as `COMPRESSION_FAILED`)
  4. `base45Encode(compressed)` → encoded string
  5. Build header: `${PROTOCOL_VERSION}${HEADER_SEPARATOR}${algorithm}${HEADER_SEPARATOR}${encoding}${HEADER_SEPARATOR}${encoded}`
  6. Validate `result.length <= QR_ALPHANUMERIC_CAPACITY` → else `PAYLOAD_TOO_LARGE`
  7. Return `CompressResult` with `data`, `originalSize` (byte length), `compressedSize` (result.length), `ratio`
- Implement `decompress(encoded: string): Promise<string>`:
  1. Parse header using **positional limited split** (find first 3 colons, NOT `split(":")`) — CRITICAL because Base45 charset includes `:`
  2. Validate `version === "QP1"` → else `INVALID_FORMAT`
  3. Validate `algorithm` is supported (`"DF"`) → else `UNSUPPORTED_ALGORITHM`
  4. Validate `encoding` is supported (`"B45"`) → else `UNSUPPORTED_ENCODING`
  5. Validate `data` portion is non-empty → else `INVALID_FORMAT`
  6. `base45Decode(data)` → compressed bytes
  7. `await inflateRaw(compressed)` → raw bytes (wrap error as `DECOMPRESSION_FAILED`)
  8. `TextDecoder.decode(raw)` → original string
  9. Return the string
- Export both functions

**Refs**: Design §compress.ts, Design §Header Parsing Detail, Spec REQ-CMP-01 through REQ-CMP-05, REQ-DEC-01 through REQ-DEC-05

### Task 5.2: Create `packages/compress/src/index.ts`

- [ ] Create `packages/compress/src/index.ts`
- Follow exact pattern from `packages/wifi/src/index.ts`
- Add JSDoc module header with `@fileoverview`, `@packageDocumentation`, `@module`, `@license MIT`, `@example`
- Public exports:
  - `export { compress, decompress } from "./compress"` — functions
  - `export { CompressError, COMPRESS_ERROR_CODE } from "./errors"` — errors
  - `export type { CompressErrorCode } from "./errors"` — error type
  - `export { COMPRESS_ALGORITHM, COMPRESS_ENCODING, PROTOCOL_VERSION, QR_ALPHANUMERIC_CAPACITY } from "./types"` — constants
  - `export type { CompressConfig, CompressResult, CompressAlgorithm, CompressEncoding } from "./types"` — types
- Do NOT export `base45Encode`, `base45Decode`, `deflateRaw`, `inflateRaw` (internal)

**Refs**: Spec REQ-TYP-04, Design §Module Responsibility table, `packages/wifi/src/index.ts`

---

## Phase 6 — Integration Tests

Full test coverage against the spec scenarios.

### Task 6.1: Create `packages/compress/tests/compress.test.ts`

- [ ] Create `packages/compress/tests/compress.test.ts`
- Import public API from `"../src"` (same as wifi test pattern)
- `describe("compress()")`:
  - Returns Promise resolving to `CompressResult` (Spec REQ-CMP-01)
  - Output starts with `"QP1:DF:B45:"` header (Spec REQ-HDR-01, REQ-HDR-02, REQ-HDR-03)
  - Rejects empty string with `EMPTY_DATA` (Spec REQ-CMP-02)
  - Accepts whitespace-only string (Spec REQ-CMP-02 Scenario 2)
  - Rejects oversized payload with `PAYLOAD_TOO_LARGE` (Spec REQ-CMP-03)
  - Boundary: output at exactly capacity → succeeds (Spec REQ-CMP-03 Scenario 3)
  - JSON payload compresses smaller than raw (Spec REQ-CMP-04)
  - Small non-repetitive input may expand but succeeds (Spec REQ-CMP-04 Scenario 2)
  - `CompressResult` metadata: `originalSize`, `compressedSize`, `ratio` are accurate
- `describe("decompress()")`:
  - Decompresses valid QP1 string (Spec REQ-DEC-01)
  - Rejects empty string → `INVALID_FORMAT` (Spec REQ-DEC-02 Scenario 2)
  - Rejects missing `QP1:` prefix → `INVALID_FORMAT` (Spec REQ-DEC-02 Scenario 1)
  - Rejects incomplete header → `INVALID_FORMAT` (Spec REQ-DEC-02 Scenario 3)
  - Rejects header with empty data → `INVALID_FORMAT` (Spec REQ-DEC-02 Scenario 4)
  - Rejects unsupported algorithm → `UNSUPPORTED_ALGORITHM` (Spec REQ-DEC-03)
  - Rejects unsupported encoding → `UNSUPPORTED_ENCODING` (Spec REQ-DEC-04)
  - Handles corrupted Base45 data → `DECOMPRESSION_FAILED` (Spec REQ-DEC-05 Scenario 1)
  - Handles valid Base45 but corrupted DEFLATE → `DECOMPRESSION_FAILED` (Spec REQ-DEC-05 Scenario 2)
- `describe("round-trip (decompress(compress(x)) === x)")`:
  - ASCII text: `"Hello, World!"` (Spec REQ-RT-01 Scenario 1)
  - JSON payload (Spec REQ-RT-01 Scenario 2)
  - Unicode: `"Café ☕ üñîcödé 🚀"` (Spec REQ-RT-01 Scenario 3)
  - CJK characters: `"你好世界"` (Spec REQ-RT-01 Scenario 4)
  - Large repetitive payload ~3000 chars (Spec REQ-RT-01 Scenario 5)
  - Whitespace-only: `"   \t\n   "` (Spec REQ-RT-01 Scenario 6)
  - Special characters with null bytes (Spec REQ-RT-01 Scenario 7)
  - Data containing colons (verify header limited split works correctly)
- `describe("CompressError")`:
  - Is instance of Error (Spec REQ-ERR-01)
  - Has correct `code` and `name` properties (Spec REQ-ERR-02)
  - All 7 error codes exist in `COMPRESS_ERROR_CODE` (Spec REQ-ERR-03)
- `describe("constants")`:
  - `COMPRESS_ALGORITHM.DEFLATE === "DF"` (Spec REQ-TYP-01)
  - `COMPRESS_ENCODING.BASE45 === "B45"` (Spec REQ-TYP-02)
  - `QR_ALPHANUMERIC_CAPACITY === 4296` (Spec REQ-CAP-01)

**Refs**: Spec (all REQ-* scenarios), Design §Testing Strategy

---

## Phase 7 — Validation

Ensure everything works together and passes all quality gates.

### Task 7.1: Run `pnpm install` and verify package resolution

- [ ] Run `pnpm install` from monorepo root
- Verify `packages/compress` is recognized by the workspace
- Verify no dependency resolution errors

### Task 7.2: Run full quality gate

- [ ] Run `pnpm --filter @qr-plus/compress typecheck` — zero errors
- [ ] Run `pnpm --filter @qr-plus/compress test` — all tests green
- [ ] Run `pnpm --filter @qr-plus/compress build` — successful dual CJS+ESM output
- [ ] Run biome check on compress package files — no lint/format errors
- If any failures, fix and re-run until all green

**Refs**: Proposal §Success Criteria, Spec REQ-NFR-01 through REQ-NFR-03

---

## Dependency Graph

```
Phase 1 (Scaffold)
    │
    v
Phase 2 (Types & Errors)
    │
    ├──────────────────┐
    v                  v
Phase 3 (Base45)    Phase 4 (DEFLATE)
    │                  │
    └──────┬───────────┘
           v
    Phase 5 (Public API + index.ts)
           │
           v
    Phase 6 (Integration Tests)
           │
           v
    Phase 7 (Validation)
```

- Phases 3 and 4 can be done **in parallel** (no dependencies between them)
- All other phases are sequential

---

## Naming Clarification

The spec references `CompressOptions` while the design uses `CompressConfig`. The design takes precedence — use `CompressConfig` everywhere, consistent with the monorepo convention (`WifiConfig`, `VCardConfig`). The `index.ts` can export `CompressConfig` as the public type.

---

## Total: 16 tasks across 7 phases
