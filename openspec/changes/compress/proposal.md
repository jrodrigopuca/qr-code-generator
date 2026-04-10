# Proposal: @qr-plus/compress

## Intent

QR codes have a hard capacity limit (2,953 bytes at Version 40, ECL Low). Users encoding structured data like JSON configs, vCards, or WiFi credentials frequently hit this wall — especially when content includes verbose field names, nested objects, or Unicode.

This package maximizes the amount of data that fits into a single QR code by combining two strategies:
1. **DEFLATE compression** to reduce raw byte count.
2. **Base45 encoding** (RFC 9285) to exploit QR alphanumeric mode, which stores 5.5 bits per character vs 8 bits per character for Base64.

The pipeline produces a self-describing QR-ready string with a header that enables future extensibility (alternative algorithms/encodings).

## Scope

### In Scope
- `compress(data: string, options?): Promise<string>` — compress + encode + validate capacity
- `decompress(encoded: string): Promise<string>` — parse header + decode + decompress
- `CompressError` class with typed error codes (`PAYLOAD_TOO_LARGE`, `EMPTY_DATA`, `COMPRESSION_FAILED`, `DECOMPRESSION_FAILED`, `INVALID_FORMAT`, `UNSUPPORTED_ALGORITHM`, `UNSUPPORTED_ENCODING`)
- Constants: `COMPRESS_ALGORITHM`, `COMPRESS_ENCODING`, `QR_CAPACITY` (version 40 ECL-L = 2,953 bytes)
- Header protocol: `QP1:<algorithm>:<encoding>:<data>`
- Pure Base45 encoder/decoder (RFC 9285) — no runtime deps
- DEFLATE via native APIs: `zlib` (Node), `CompressionStream`/`DecompressionStream` (browser)
- Capacity validation after compress+encode (reject if result exceeds QR limit)
- Full round-trip test suite (compress -> decompress === original)
- Types: `CompressOptions`, `CompressResult` (with metadata like original size, compressed size, ratio)

### Out of Scope
- Image or binary file compression (this is for text/JSON/config data)
- QR code generation (that's `@qr-plus/core`)
- Streaming API for large payloads
- Custom compression dictionaries
- Integration with other packages (wifi, vcard) — future work
- Polyfill bundling for `CompressionStream` (documented as requirement, not shipped)

## Approach

### Pipeline

```
compress:   string → TextEncoder → DEFLATE → Base45 encode → prepend header → validate capacity → QP1:DEFLATE:BASE45:<data>
decompress: QP1:DEFLATE:BASE45:<data> → parse header → Base45 decode → INFLATE → TextDecoder → string
```

### Header Protocol

Format: `QP1:<algorithm>:<encoding>:<data>`

- `QP1` — protocol version identifier (QR-Plus v1)
- `<algorithm>` — compression algorithm (initially only `DEFLATE`)
- `<encoding>` — binary-to-text encoding (initially only `BASE45`)
- `<data>` — the encoded payload

The header is designed for forward compatibility. Future versions can add algorithms (ZSTD, BROTLI) or encodings without breaking existing decoders — unsupported values produce `UNSUPPORTED_ALGORITHM` or `UNSUPPORTED_ENCODING` errors.

### Async API (Key Difference from wifi/vcard)

Unlike `@qr-plus/wifi` and `@qr-plus/vcard` which are synchronous string builders, `compress()` and `decompress()` **must be async** because:
- **Node.js**: `zlib.deflate`/`zlib.inflate` are callback-based (wrapped in Promise)
- **Browser**: `CompressionStream`/`DecompressionStream` are stream-based (inherently async)

This is an intentional architectural decision — keeping the API async allows a single universal implementation strategy and avoids blocking the main thread with synchronous zlib calls.

### Base45 Encoding (RFC 9285)

Implemented as a pure TypeScript module with zero dependencies. The Base45 alphabet uses only characters from QR alphanumeric mode (`0-9`, `A-Z`, ` `, `$`, `%`, `*`, `+`, `-`, `.`, `/`, `:`), which means QR generators encode Base45 output at 5.5 bits/char instead of 8 bits/char for arbitrary bytes. This gives ~30% more capacity compared to Base64.

### Environment Detection

The package will detect the runtime environment and use the appropriate compression API:
- **Node.js** (`typeof process !== 'undefined'`): `zlib.deflate` / `zlib.inflate` wrapped in Promises
- **Browser** (`typeof CompressionStream !== 'undefined'`): `CompressionStream` / `DecompressionStream` with `ReadableStream` piping

### File Structure (following monorepo conventions)

```
packages/compress/
  src/
    index.ts          — Public API exports
    types.ts          — CompressOptions, CompressResult, constants
    errors.ts         — CompressError + COMPRESS_ERROR_CODE
    compress.ts       — compress() implementation
    decompress.ts     — decompress() implementation
    base45.ts         — Base45 encode/decode (RFC 9285)
    deflate.ts        — DEFLATE compress/decompress (environment-adaptive)
    header.ts         — Header parse/build utilities
  tests/
    compress.test.ts
    decompress.test.ts
    base45.test.ts
    header.test.ts
    roundtrip.test.ts
  package.json
  tsconfig.json
  tsup.config.ts
  README.md
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/compress/` | New | Entire new package |
| `pnpm-workspace.yaml` | None | Already includes `packages/*` glob |
| `turbo.json` | None | Already configured for `packages/*` |
| `packages/core/` | None (future) | Future: core could auto-compress when content exceeds capacity |
| `packages/wifi/` | None (future) | Future: wifi builder could optionally compress output |
| `packages/vcard/` | None (future) | Future: vcard builder could optionally compress output |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `CompressionStream` not available in older browsers | Medium | Document minimum browser requirements (Chrome 80+, Firefox 113+, Safari 16.4+). Users with older browsers must polyfill. Do NOT bundle a polyfill — keep zero-dep. |
| Async API breaks composability with sync wifi/vcard builders | Low | This is by design. Document clearly. Future integration packages can wrap the async call. |
| Base45 implementation edge cases (padding, zero bytes) | Low | Implement against RFC 9285 test vectors. Extensive round-trip testing with fuzz-like inputs. |
| Compressed output sometimes larger than input (small payloads) | Medium | DEFLATE adds overhead for very small inputs (~10-20 bytes). Document that compression is most effective for payloads >100 bytes. The function still works — it just doesn't save space for tiny inputs. |
| Header overhead reduces effective capacity | Low | Header `QP1:DEFLATE:BASE45:` is 20 bytes — negligible against 2,953 byte limit. |

## Rollback Plan

This is a new standalone package with no impact on existing packages. Rollback is:
1. Remove `packages/compress/` directory
2. No other packages reference it, so no cascading changes needed

## Dependencies

- **No runtime dependencies** — all compression via native platform APIs
- **Dev dependencies** (same as wifi/vcard): `tsup`, `typescript`, `vitest`
- **Node.js >= 18.0.0** — required for stable `zlib` Promise wrappers and consistent `TextEncoder`/`TextDecoder`
- **Browser**: `CompressionStream` API (Chrome 80+, Firefox 113+, Safari 16.4+)

## Success Criteria

- [ ] `compress()` + `decompress()` round-trip preserves original data for all test inputs
- [ ] Compressed QR string for a 2KB JSON payload fits within 2,953 byte QR limit (where raw JSON would not)
- [ ] `CompressError` thrown with correct error code for: empty input, oversized result, malformed header, unsupported algorithm/encoding
- [ ] Base45 encoder/decoder passes RFC 9285 test vectors
- [ ] Package builds with tsup (dual CJS+ESM), passes typecheck, all vitest tests green
- [ ] Zero runtime dependencies verified in package.json
- [ ] Biome lint/format passes
- [ ] Capacity validation rejects payloads that exceed QR Version 40 ECL-L limit after compression
