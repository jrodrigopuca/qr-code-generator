/**
 * @fileoverview @qr-plus/compress — Entry Point
 * @description QR-optimized text compression using DEFLATE + Base45 (RFC 9285).
 * Maximizes data capacity in a single QR code by compressing data and encoding
 * it in the QR alphanumeric charset for optimal bit packing.
 *
 * @packageDocumentation
 * @module @qr-plus/compress
 * @license MIT
 *
 * @example Compress data for a QR code
 * ```typescript
 * import { compress } from "@qr-plus/compress";
 *
 * const result = await compress({ data: '{"config":"large JSON..."}' });
 * // result.data → "QP1:DF:B45:..." (ready for QR generation)
 * // result.ratio → 0.65 (35% size reduction)
 * ```
 *
 * @example Decompress scanned QR data
 * ```typescript
 * import { decompress } from "@qr-plus/compress";
 *
 * const original = await decompress("QP1:DF:B45:...");
 * // → original data string
 * ```
 *
 * @example Use with @qr-plus/core
 * ```typescript
 * import { compress } from "@qr-plus/compress";
 * import { renderToSVG } from "@qr-plus/core";
 *
 * const result = await compress({ data: bigJsonString });
 * const svg = renderToSVG(result.data);
 * ```
 */

// Functions
export { compress, decompress } from "./compress";
export type { CompressErrorCode } from "./errors";
// Errors
export { COMPRESS_ERROR_CODE, CompressError } from "./errors";

// Types
export type {
	CompressAlgorithm,
	CompressConfig,
	CompressEncoding,
	CompressResult,
} from "./types";
export {
	COMPRESS_ALGORITHM,
	COMPRESS_ENCODING,
	PROTOCOL_VERSION,
	QR_ALPHANUMERIC_CAPACITY,
} from "./types";
