/**
 * @fileoverview QR-optimized compress/decompress functions
 * @description Public API that wires together DEFLATE compression,
 * Base45 encoding, and the QP1 header protocol.
 *
 * Pipeline: string → DEFLATE → Base45 → "QP1:DF:B45:<data>"
 * Reverse:  "QP1:DF:B45:<data>" → Base45 → INFLATE → string
 *
 * @module @qr-plus/compress/compress
 */

import { base45Decode, base45Encode } from "./base45";
import { deflateRaw, inflateRaw } from "./deflate";
import { COMPRESS_ERROR_CODE, CompressError } from "./errors";
import type { CompressConfig, CompressResult } from "./types";
import {
	COMPRESS_ALGORITHM,
	COMPRESS_ENCODING,
	HEADER_SEPARATOR,
	PROTOCOL_VERSION,
	QR_ALPHANUMERIC_CAPACITY,
} from "./types";

/**
 * Builds the QP1 header string.
 */
function buildHeader(algorithm: string, encoding: string): string {
	return `${PROTOCOL_VERSION}${HEADER_SEPARATOR}${algorithm}${HEADER_SEPARATOR}${encoding}${HEADER_SEPARATOR}`;
}

/**
 * Parses the QP1 header using positional limited split.
 * This is critical because Base45 charset includes ":" —
 * a naive split(":") would corrupt the data payload.
 *
 * @returns Parsed header fields or null if invalid
 */
function parseHeader(encoded: string): {
	version: string;
	algorithm: string;
	encoding: string;
	data: string;
} | null {
	const firstColon = encoded.indexOf(HEADER_SEPARATOR);
	if (firstColon === -1) return null;

	const secondColon = encoded.indexOf(HEADER_SEPARATOR, firstColon + 1);
	if (secondColon === -1) return null;

	const thirdColon = encoded.indexOf(HEADER_SEPARATOR, secondColon + 1);
	if (thirdColon === -1) return null;

	return {
		version: encoded.slice(0, firstColon),
		algorithm: encoded.slice(firstColon + 1, secondColon),
		encoding: encoded.slice(secondColon + 1, thirdColon),
		data: encoded.slice(thirdColon + 1),
	};
}

/**
 * Compresses a string into a QR-optimized payload with the QP1 header.
 *
 * Pipeline: string → UTF-8 bytes → DEFLATE → Base45 → "QP1:DF:B45:<data>"
 *
 * @param config - Compression configuration with the data string
 * @returns Promise resolving to a CompressResult with the QR-ready string
 *
 * @throws {CompressError} EMPTY_DATA if the input string is empty
 * @throws {CompressError} PAYLOAD_TOO_LARGE if compressed output exceeds
 *   QR alphanumeric capacity (4,296 chars)
 * @throws {CompressError} COMPRESSION_FAILED if DEFLATE compression fails
 *
 * @example
 * ```typescript
 * const result = await compress({ data: '{"key": "value"}' });
 * // result.data → "QP1:DF:B45:..."
 * // result.ratio → 0.85 (smaller = better compression)
 * ```
 */
async function compress(config: CompressConfig): Promise<CompressResult> {
	// 1. Validate non-empty
	if (config.data === "") {
		throw new CompressError(
			COMPRESS_ERROR_CODE.EMPTY_DATA,
			"Data must be a non-empty string.",
		);
	}

	// 2. Encode string to UTF-8 bytes
	const rawBytes = new TextEncoder().encode(config.data);

	// 3. Compress with DEFLATE
	const compressed = await deflateRaw(rawBytes);

	// 4. Encode with Base45
	const encoded = base45Encode(compressed);

	// 5. Build header
	const algorithm = config.algorithm ?? COMPRESS_ALGORITHM.DEFLATE;
	const encoding = config.encoding ?? COMPRESS_ENCODING.BASE45;
	const header = buildHeader(algorithm, encoding);
	const result = header + encoded;

	// 6. Validate capacity
	if (result.length > QR_ALPHANUMERIC_CAPACITY) {
		throw new CompressError(
			COMPRESS_ERROR_CODE.PAYLOAD_TOO_LARGE,
			`Compressed output (${result.length} chars) exceeds QR alphanumeric capacity (${QR_ALPHANUMERIC_CAPACITY}).`,
		);
	}

	// 7. Return result with metadata
	return {
		data: result,
		originalSize: rawBytes.length,
		compressedSize: result.length,
		ratio: result.length / rawBytes.length,
	};
}

/**
 * Decompresses a QP1-encoded string back to the original data.
 *
 * Pipeline: "QP1:DF:B45:<data>" → Base45 → INFLATE → UTF-8 string
 *
 * @param encoded - QP1-prefixed compressed string
 * @returns Promise resolving to the original uncompressed string
 *
 * @throws {CompressError} INVALID_FORMAT if the header is missing or malformed
 * @throws {CompressError} UNSUPPORTED_ALGORITHM if the algorithm is not supported
 * @throws {CompressError} UNSUPPORTED_ENCODING if the encoding is not supported
 * @throws {CompressError} DECOMPRESSION_FAILED if decompression fails
 *
 * @example
 * ```typescript
 * const original = await decompress("QP1:DF:B45:...");
 * // → original data string
 * ```
 */
async function decompress(encoded: string): Promise<string> {
	// 1. Parse header with limited split
	const header = parseHeader(encoded);
	if (!header) {
		throw new CompressError(
			COMPRESS_ERROR_CODE.INVALID_FORMAT,
			"Invalid format: expected QP1:alg:enc:data header.",
		);
	}

	// 2. Validate version
	if (header.version !== PROTOCOL_VERSION) {
		throw new CompressError(
			COMPRESS_ERROR_CODE.INVALID_FORMAT,
			`Invalid format: expected version "${PROTOCOL_VERSION}", got "${header.version}".`,
		);
	}

	// 3. Validate algorithm
	const validAlgorithms: readonly string[] = Object.values(COMPRESS_ALGORITHM);
	if (!validAlgorithms.includes(header.algorithm)) {
		throw new CompressError(
			COMPRESS_ERROR_CODE.UNSUPPORTED_ALGORITHM,
			`Unsupported algorithm: "${header.algorithm}". Supported: ${validAlgorithms.join(", ")}.`,
		);
	}

	// 4. Validate encoding
	const validEncodings: readonly string[] = Object.values(COMPRESS_ENCODING);
	if (!validEncodings.includes(header.encoding)) {
		throw new CompressError(
			COMPRESS_ERROR_CODE.UNSUPPORTED_ENCODING,
			`Unsupported encoding: "${header.encoding}". Supported: ${validEncodings.join(", ")}.`,
		);
	}

	// 5. Validate data is non-empty
	if (header.data === "") {
		throw new CompressError(
			COMPRESS_ERROR_CODE.INVALID_FORMAT,
			"Invalid format: data portion is empty.",
		);
	}

	// 6. Base45 decode
	let compressed: Uint8Array;
	try {
		compressed = base45Decode(header.data);
	} catch (error) {
		throw new CompressError(
			COMPRESS_ERROR_CODE.DECOMPRESSION_FAILED,
			`Decompression failed: invalid Base45 data. ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// 7. DEFLATE decompress
	const rawBytes = await inflateRaw(compressed);

	// 8. Decode UTF-8 bytes to string
	return new TextDecoder().decode(rawBytes);
}

export { compress, decompress };
