# @qr-plus/compress Specification

## Purpose

Maximizes the amount of text data that fits into a single QR code by combining DEFLATE compression with Base45 encoding (RFC 9285). Produces self-describing strings with a versioned header protocol that enables future extensibility. Provides round-trip compress/decompress operations with typed error handling.

---

## Domain: CompressError

### REQ-ERR-01: CompressError MUST extend Error

`CompressError` MUST be a class that extends the built-in `Error` class, following the same pattern as `WifiError` in `@qr-plus/wifi`.

#### Scenario: CompressError is an instance of Error

- GIVEN a `CompressError` is constructed with code `EMPTY_DATA` and message `"Data is empty"`
- WHEN the error is checked with `instanceof Error`
- THEN it MUST return `true`

### REQ-ERR-02: CompressError MUST have a typed `code` property

`CompressError` MUST expose a readonly `code` property typed as `CompressErrorCode`. The `name` property MUST be set to `"CompressError"`.

#### Scenario: Error code is accessible and typed

- GIVEN a `CompressError` is constructed with code `PAYLOAD_TOO_LARGE` and message `"Output exceeds QR capacity"`
- WHEN the `code` property is accessed
- THEN it MUST equal `"PAYLOAD_TOO_LARGE"`
- AND the `name` property MUST equal `"CompressError"`
- AND the `message` property MUST equal `"Output exceeds QR capacity"`

### REQ-ERR-03: Error codes MUST cover all failure modes

The `COMPRESS_ERROR_CODE` constant object MUST define exactly these error codes:

| Code | Usage |
|------|-------|
| `EMPTY_DATA` | Input string is empty or whitespace-only |
| `PAYLOAD_TOO_LARGE` | Compressed + encoded output exceeds QR capacity |
| `COMPRESSION_FAILED` | DEFLATE compression operation failed |
| `DECOMPRESSION_FAILED` | INFLATE decompression operation failed |
| `INVALID_FORMAT` | Input to `decompress()` does not match the QP1 header protocol |
| `UNSUPPORTED_ALGORITHM` | Header specifies an algorithm not supported by this version |
| `UNSUPPORTED_ENCODING` | Header specifies an encoding not supported by this version |

#### Scenario: All error codes are defined

- GIVEN the `COMPRESS_ERROR_CODE` constant is imported
- WHEN all keys are enumerated
- THEN it MUST contain exactly the keys: `EMPTY_DATA`, `PAYLOAD_TOO_LARGE`, `COMPRESSION_FAILED`, `DECOMPRESSION_FAILED`, `INVALID_FORMAT`, `UNSUPPORTED_ALGORITHM`, `UNSUPPORTED_ENCODING`
- AND each value MUST be a string matching its key name

---

## Domain: Base45 Codec (Internal)

### REQ-B45-01: Base45 encode MUST produce RFC 9285 compliant output

The `base45Encode` function MUST accept a `Uint8Array` and return a string consisting exclusively of characters from the Base45 alphabet defined in RFC 9285: `0-9`, `A-Z`, ` `, `$`, `%`, `*`, `+`, `-`, `.`, `/`, `:`.

#### Scenario: Encoding a known test vector from RFC 9285

- GIVEN the input bytes represent the ASCII string `"Hello!!"`
- WHEN `base45Encode` is called with those bytes
- THEN the output MUST equal `"%69 VD92EX0"`

#### Scenario: Encoding an empty byte array

- GIVEN the input is an empty `Uint8Array`
- WHEN `base45Encode` is called
- THEN the output MUST be an empty string `""`

#### Scenario: Encoding a single byte

- GIVEN the input is a `Uint8Array` containing a single byte
- WHEN `base45Encode` is called
- THEN the output MUST be a 2-character Base45 string (per RFC 9285 padding rules)

#### Scenario: Encoding two bytes

- GIVEN the input is a `Uint8Array` containing exactly two bytes
- WHEN `base45Encode` is called
- THEN the output MUST be a 3-character Base45 string (per RFC 9285 grouping rules)

### REQ-B45-02: Base45 decode MUST correctly reverse the encoding

The `base45Decode` function MUST accept a Base45-encoded string and return the original `Uint8Array`.

#### Scenario: Decoding a known test vector from RFC 9285

- GIVEN the input string is `"%69 VD92EX0"`
- WHEN `base45Decode` is called
- THEN the output bytes MUST represent the ASCII string `"Hello!!"`

#### Scenario: Decoding an empty string

- GIVEN the input is an empty string `""`
- WHEN `base45Decode` is called
- THEN the output MUST be an empty `Uint8Array`

### REQ-B45-03: Base45 round-trip MUST be lossless

For any valid `Uint8Array` input, `base45Decode(base45Encode(input))` MUST produce output byte-identical to the original input.

#### Scenario: Round-trip with arbitrary binary data

- GIVEN a `Uint8Array` of arbitrary bytes (including zero bytes, 0xFF, etc.)
- WHEN the data is encoded with `base45Encode` and then decoded with `base45Decode`
- THEN the decoded output MUST be byte-identical to the original input

#### Scenario: Round-trip with all single-byte values (0x00-0xFF)

- GIVEN a `Uint8Array` containing all 256 possible byte values [0x00, 0x01, ..., 0xFF]
- WHEN the data is encoded and then decoded
- THEN the decoded output MUST be byte-identical to the original 256-byte input

### REQ-B45-04: Base45 output MUST be QR-alphanumeric compatible

All characters produced by `base45Encode` MUST be within the QR alphanumeric character set (`0-9`, `A-Z`, ` `, `$`, `%`, `*`, `+`, `-`, `.`, `/`, `:`). This ensures QR generators can encode the output at 5.5 bits/character instead of 8 bits/character.

#### Scenario: Encoded output only contains QR-alphanumeric characters

- GIVEN any valid `Uint8Array` input
- WHEN `base45Encode` is called
- THEN every character in the output MUST match the pattern `[0-9A-Z $%*+\-./:]+`

---

## Domain: Header Protocol

### REQ-HDR-01: Header format MUST follow the QP1 protocol

The header format MUST be: `QP1:<algorithm>:<encoding>:<data>`

- `QP1` is the protocol version identifier (fixed string)
- `<algorithm>` identifies the compression algorithm (e.g., `DF` for DEFLATE)
- `<encoding>` identifies the binary-to-text encoding (e.g., `B45` for Base45)
- `<data>` is the encoded payload
- Fields are separated by the `:` character

#### Scenario: Compressed output has correct header prefix

- GIVEN a valid non-empty string input
- WHEN `compress()` is called
- THEN the output MUST start with `"QP1:DF:B45:"`
- AND the remainder after the prefix MUST be a non-empty Base45-encoded string

### REQ-HDR-02: Header MUST use compact algorithm identifiers

The algorithm identifier in the header MUST be `DF` (not `DEFLATE`) to minimize header overhead.

#### Scenario: Algorithm identifier is compact

- GIVEN any valid input to `compress()`
- WHEN the output header is parsed
- THEN the algorithm field MUST be `"DF"`

### REQ-HDR-03: Header MUST use compact encoding identifiers

The encoding identifier in the header MUST be `B45` (not `BASE45`) to minimize header overhead.

#### Scenario: Encoding identifier is compact

- GIVEN any valid input to `compress()`
- WHEN the output header is parsed
- THEN the encoding field MUST be `"B45"`

---

## Domain: compress() Function

### REQ-CMP-01: compress MUST accept a string and return Promise<string>

The `compress` function MUST accept a `string` as its first argument and return a `Promise<string>`. The returned string is a QR-ready payload with the QP1 header.

#### Scenario: Basic compression of a text string

- GIVEN the input string `"Hello, World!"`
- WHEN `compress()` is called
- THEN it MUST return a Promise that resolves to a string
- AND the resolved string MUST start with `"QP1:DF:B45:"`

### REQ-CMP-02: compress MUST validate non-empty input

The `compress` function MUST throw a `CompressError` with code `EMPTY_DATA` if the input string is empty.

#### Scenario: Empty string input

- GIVEN the input string is `""`
- WHEN `compress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `EMPTY_DATA`

#### Scenario: Whitespace-only string is accepted

- GIVEN the input string is `"   "` (whitespace only)
- WHEN `compress()` is called
- THEN it MUST NOT throw `EMPTY_DATA`
- AND it MUST resolve to a valid QP1-prefixed string

Note: Only truly empty strings (`""`) are invalid. Whitespace-only strings are valid input since whitespace is meaningful data.

### REQ-CMP-03: compress MUST validate capacity after encoding

After compression and Base45 encoding, the complete output (header + data) MUST NOT exceed 4,296 characters (the maximum capacity for QR Version 40, ECL Low, in alphanumeric mode). If the output exceeds this limit, `compress` MUST throw a `CompressError` with code `PAYLOAD_TOO_LARGE`.

#### Scenario: Output within QR alphanumeric capacity

- GIVEN a string input that compresses to a total output of 4,296 characters or fewer
- WHEN `compress()` is called
- THEN it MUST resolve successfully with the QP1-prefixed output

#### Scenario: Output exceeds QR alphanumeric capacity

- GIVEN a string input large enough that the compressed + encoded output exceeds 4,296 characters
- WHEN `compress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `PAYLOAD_TOO_LARGE`

#### Scenario: Boundary — output at exactly 4,296 characters

- GIVEN a string input that compresses to a total output of exactly 4,296 characters
- WHEN `compress()` is called
- THEN it MUST resolve successfully (the limit is inclusive)

### REQ-CMP-04: compress SHOULD achieve meaningful compression on repetitive text

For inputs with significant redundancy (JSON, XML, repeated patterns), the compressed+encoded output SHOULD be smaller than the raw input. DEFLATE is most effective on payloads above ~100 bytes with repetitive content.

#### Scenario: JSON payload is compressed effectively

- GIVEN a JSON string of ~1,500 bytes with typical key-value structure and repeated field names
- WHEN `compress()` is called
- THEN the total output (including header) SHOULD be shorter than the original input string

#### Scenario: Small non-repetitive input may not shrink

- GIVEN a very short input string of ~20 characters with no repetition (e.g., `"abcdefghij1234567890"`)
- WHEN `compress()` is called
- THEN the output MAY be longer than the input (DEFLATE overhead on small data is expected)
- AND the function MUST still succeed (no error)

### REQ-CMP-05: compress MUST propagate compression failures

If the underlying DEFLATE operation fails for any reason, `compress` MUST throw a `CompressError` with code `COMPRESSION_FAILED`.

#### Scenario: Internal DEFLATE failure

- GIVEN the DEFLATE engine encounters an internal error during compression
- WHEN `compress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `COMPRESSION_FAILED`

---

## Domain: decompress() Function

### REQ-DEC-01: decompress MUST accept a QP1-prefixed string and return Promise<string>

The `decompress` function MUST accept a string with the QP1 header protocol and return a `Promise<string>` containing the original uncompressed data.

#### Scenario: Basic decompression

- GIVEN a valid QP1-prefixed string produced by `compress()`
- WHEN `decompress()` is called
- THEN it MUST return a Promise that resolves to the original uncompressed string

### REQ-DEC-02: decompress MUST validate the QP1 header format

If the input string does not start with `"QP1:"` or does not contain the expected number of colon-separated header fields (at least 4 parts: version, algorithm, encoding, data), `decompress` MUST throw a `CompressError` with code `INVALID_FORMAT`.

#### Scenario: Missing QP1 prefix

- GIVEN the input string is `"NOT_A_VALID_HEADER:some:data"`
- WHEN `decompress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `INVALID_FORMAT`

#### Scenario: Empty string input

- GIVEN the input string is `""`
- WHEN `decompress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `INVALID_FORMAT`

#### Scenario: Incomplete header (missing fields)

- GIVEN the input string is `"QP1:DF"`
- WHEN `decompress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `INVALID_FORMAT`

#### Scenario: Header with no data portion

- GIVEN the input string is `"QP1:DF:B45:"`
- WHEN `decompress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `INVALID_FORMAT`

### REQ-DEC-03: decompress MUST validate the algorithm

If the algorithm field in the header is not a supported value, `decompress` MUST throw a `CompressError` with code `UNSUPPORTED_ALGORITHM`. The only supported algorithm in v1 is `DF` (DEFLATE).

#### Scenario: Unsupported algorithm

- GIVEN the input string is `"QP1:ZSTD:B45:somedata"`
- WHEN `decompress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `UNSUPPORTED_ALGORITHM`

#### Scenario: Supported algorithm is accepted

- GIVEN a valid QP1 string with algorithm `DF`
- WHEN `decompress()` is called
- THEN it MUST NOT throw `UNSUPPORTED_ALGORITHM`

### REQ-DEC-04: decompress MUST validate the encoding

If the encoding field in the header is not a supported value, `decompress` MUST throw a `CompressError` with code `UNSUPPORTED_ENCODING`. The only supported encoding in v1 is `B45` (Base45).

#### Scenario: Unsupported encoding

- GIVEN the input string is `"QP1:DF:B64:somedata"`
- WHEN `decompress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `UNSUPPORTED_ENCODING`

#### Scenario: Supported encoding is accepted

- GIVEN a valid QP1 string with encoding `B45`
- WHEN `decompress()` is called
- THEN it MUST NOT throw `UNSUPPORTED_ENCODING`

### REQ-DEC-05: decompress MUST handle corrupted data gracefully

If the data portion of the input contains invalid Base45 characters, or the decoded bytes cannot be decompressed by INFLATE, `decompress` MUST throw a `CompressError` with code `DECOMPRESSION_FAILED`.

#### Scenario: Corrupted Base45 data

- GIVEN the input string is `"QP1:DF:B45:!!INVALID!!BASE45!!"`
- WHEN `decompress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `DECOMPRESSION_FAILED`

#### Scenario: Valid Base45 but corrupted compressed bytes

- GIVEN the input has a valid QP1 header and valid Base45 encoding, but the decoded bytes are not valid DEFLATE data
- WHEN `decompress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `DECOMPRESSION_FAILED`

#### Scenario: Truncated data

- GIVEN the input has a valid QP1 header but the data portion is truncated mid-stream
- WHEN `decompress()` is called
- THEN it MUST reject with a `CompressError`
- AND the error code MUST be `DECOMPRESSION_FAILED`

---

## Domain: Round-Trip Integrity

### REQ-RT-01: decompress(compress(data)) MUST equal original data

For any valid non-empty string input, the round-trip `decompress(compress(data))` MUST produce output identical to the original input. This is the fundamental correctness guarantee of the package.

#### Scenario: Round-trip with ASCII text

- GIVEN the input string is `"Hello, World!"`
- WHEN `compress()` is called, then `decompress()` is called on the result
- THEN the final output MUST exactly equal `"Hello, World!"`

#### Scenario: Round-trip with a JSON payload

- GIVEN the input string is a JSON object `{"name":"John","email":"john@example.com","settings":{"theme":"dark","notifications":true}}`
- WHEN the round-trip compress/decompress is performed
- THEN the output MUST exactly equal the original JSON string

#### Scenario: Round-trip with Unicode content

- GIVEN the input string contains Unicode characters: `"Caf\u00e9 \u2615 \u00fc\u00f1\u00eec\u00f6d\u00e9 \ud83d\ude80"`
- WHEN the round-trip compress/decompress is performed
- THEN the output MUST exactly equal the original Unicode string

#### Scenario: Round-trip with multi-byte UTF-8 characters

- GIVEN the input string contains CJK characters: `"\u4f60\u597d\u4e16\u754c"`
- WHEN the round-trip compress/decompress is performed
- THEN the output MUST exactly equal the original string

#### Scenario: Round-trip with large repetitive payload

- GIVEN the input string is a 3,000-character repetitive JSON payload (within compressible QR limits)
- WHEN the round-trip compress/decompress is performed
- THEN the output MUST exactly equal the original string

#### Scenario: Round-trip with whitespace-only content

- GIVEN the input string is `"   \t\n   "`
- WHEN the round-trip compress/decompress is performed
- THEN the output MUST exactly equal the original whitespace string

#### Scenario: Round-trip with special characters

- GIVEN the input string contains special characters: `"<script>alert('xss');</script>\n\r\t\0"`
- WHEN the round-trip compress/decompress is performed
- THEN the output MUST exactly equal the original string (null bytes and control characters preserved)

---

## Domain: Capacity Limits

### REQ-CAP-01: QR alphanumeric mode capacity constant MUST be 4,296

The package MUST define a constant for QR Version 40, ECL Low, alphanumeric mode capacity as 4,296 characters. This is the effective limit because Base45 output consists exclusively of QR-alphanumeric characters, allowing QR generators to use the more efficient alphanumeric encoding mode.

#### Scenario: Capacity constant value

- GIVEN the `QR_ALPHANUMERIC_CAPACITY` constant is imported
- WHEN its value is read
- THEN it MUST equal `4296`

### REQ-CAP-02: Capacity check MUST apply to the complete output including header

The capacity validation MUST check the total length of the output string (header + data), not just the data portion. The header `QP1:DF:B45:` contributes 12 characters toward the 4,296 character limit.

#### Scenario: Header is included in capacity calculation

- GIVEN a string that compresses and encodes to exactly 4,284 data characters (4,296 - 12 header chars)
- WHEN `compress()` is called
- THEN the total output is 4,296 characters and MUST succeed

#### Scenario: Data alone fits but total with header exceeds limit

- GIVEN a string that compresses and encodes to 4,290 data characters
- WHEN `compress()` is called
- THEN the total output would be 4,302 characters (4,290 + 12 header)
- AND it MUST reject with `PAYLOAD_TOO_LARGE`

---

## Domain: Constants and Types

### REQ-TYP-01: Compression algorithm constants MUST be defined

The package MUST export a `COMPRESS_ALGORITHM` constant object with at least `DEFLATE: "DF"`.

#### Scenario: Algorithm constant is available

- GIVEN `COMPRESS_ALGORITHM` is imported
- WHEN `COMPRESS_ALGORITHM.DEFLATE` is accessed
- THEN it MUST equal `"DF"`

### REQ-TYP-02: Compression encoding constants MUST be defined

The package MUST export a `COMPRESS_ENCODING` constant object with at least `BASE45: "B45"`.

#### Scenario: Encoding constant is available

- GIVEN `COMPRESS_ENCODING` is imported
- WHEN `COMPRESS_ENCODING.BASE45` is accessed
- THEN it MUST equal `"B45"`

### REQ-TYP-03: CompressOptions type MAY be accepted by compress

The `compress` function MAY accept an optional second argument of type `CompressOptions` for future extensibility (e.g., algorithm selection). In v1, this parameter has no required fields.

#### Scenario: Compress works without options

- GIVEN a valid input string
- WHEN `compress()` is called without a second argument
- THEN it MUST succeed using default algorithm (DEFLATE) and encoding (Base45)

### REQ-TYP-04: Package MUST export public API surface

The package's `index.ts` MUST export the following:
- `compress` function
- `decompress` function
- `CompressError` class
- `COMPRESS_ERROR_CODE` constant
- `COMPRESS_ALGORITHM` constant
- `COMPRESS_ENCODING` constant
- `QR_ALPHANUMERIC_CAPACITY` constant
- `CompressOptions` type
- `CompressErrorCode` type

#### Scenario: All public exports are accessible

- GIVEN the package is imported via `import { compress, decompress, CompressError, COMPRESS_ERROR_CODE, COMPRESS_ALGORITHM, COMPRESS_ENCODING, QR_ALPHANUMERIC_CAPACITY } from "@qr-plus/compress"`
- WHEN each export is referenced
- THEN all MUST be defined and non-undefined

---

## Non-Functional Requirements

### REQ-NFR-01: Package MUST have zero runtime dependencies

The `package.json` MUST NOT list any `dependencies`. All compression and encoding MUST use native platform APIs (Node.js `zlib`, browser `CompressionStream`/`DecompressionStream`).

#### Scenario: No runtime dependencies

- GIVEN the `package.json` for `@qr-plus/compress`
- WHEN the `dependencies` field is inspected
- THEN it MUST be empty or absent

### REQ-NFR-02: Package MUST support dual CJS/ESM output

The package MUST be built with tsup producing both CommonJS and ESM bundles, matching the build configuration used by `@qr-plus/wifi`.

#### Scenario: Package builds in both formats

- GIVEN the tsup build configuration
- WHEN the package is built
- THEN it MUST produce both `.cjs` and `.js` (ESM) output files

### REQ-NFR-03: Async API contract

Both `compress` and `decompress` MUST return Promises. They MUST NOT use synchronous zlib APIs. This ensures compatibility with both Node.js and browser environments without blocking the main thread.

#### Scenario: Functions return Promises

- GIVEN a call to `compress("test")`
- WHEN the return value is inspected
- THEN it MUST be an instance of `Promise`

---

## Summary

| Category | Requirements | Scenarios |
|----------|-------------|-----------|
| CompressError | 3 | 4 |
| Base45 Codec | 4 | 9 |
| Header Protocol | 3 | 3 |
| compress() | 5 | 8 |
| decompress() | 5 | 10 |
| Round-Trip | 1 | 7 |
| Capacity Limits | 2 | 3 |
| Constants & Types | 4 | 4 |
| Non-Functional | 3 | 3 |
| **TOTAL** | **30** | **51** |
