/**
 * @fileoverview Shared types for @qr-plus/compress
 * @description Type definitions for QR-optimized compression.
 * @module @qr-plus/compress/types
 */

/**
 * Supported compression algorithms.
 * Currently only DEFLATE raw (RFC 1951).
 */
const COMPRESS_ALGORITHM = {
	DEFLATE: "DF",
} as const;

type CompressAlgorithm =
	(typeof COMPRESS_ALGORITHM)[keyof typeof COMPRESS_ALGORITHM];

/**
 * Supported binary-to-text encodings.
 * Currently only Base45 (RFC 9285).
 */
const COMPRESS_ENCODING = {
	BASE45: "B45",
} as const;

type CompressEncoding =
	(typeof COMPRESS_ENCODING)[keyof typeof COMPRESS_ENCODING];

/** Protocol version identifier for the QP1 header format. */
const PROTOCOL_VERSION = "QP1" as const;

/** Max characters in QR alphanumeric mode, Version 40, ECL Low. */
const QR_ALPHANUMERIC_CAPACITY = 4296 as const;

/** Header separator character. */
const HEADER_SEPARATOR = ":" as const;

/**
 * Configuration for the compress function.
 */
interface CompressConfig {
	/** The string data to compress. Must be non-empty. */
	readonly data: string;
	/** Compression algorithm. @default "DF" (deflate-raw) */
	readonly algorithm?: CompressAlgorithm;
	/** Binary-to-text encoding. @default "B45" (base45) */
	readonly encoding?: CompressEncoding;
}

/**
 * Result of a compression operation.
 */
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

export type {
	CompressAlgorithm,
	CompressConfig,
	CompressEncoding,
	CompressResult,
};
export {
	COMPRESS_ALGORITHM,
	COMPRESS_ENCODING,
	HEADER_SEPARATOR,
	PROTOCOL_VERSION,
	QR_ALPHANUMERIC_CAPACITY,
};
