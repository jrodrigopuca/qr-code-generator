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

export type { CompressErrorCode };
export { COMPRESS_ERROR_CODE, CompressError };
