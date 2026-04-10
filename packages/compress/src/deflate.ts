/**
 * @fileoverview DEFLATE raw compression adapter
 * @description Environment-adaptive compression using native platform APIs.
 * Prefers Node.js zlib (callback-based, reliable error handling) when available,
 * falls back to Web Streams API (CompressionStream/DecompressionStream) for browsers.
 *
 * @module @qr-plus/compress/deflate
 */

import { COMPRESS_ERROR_CODE, CompressError } from "./errors";

/**
 * Concatenates multiple Uint8Array chunks into a single Uint8Array.
 */
function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
	const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}
	return result;
}

/**
 * Compresses data using the Web Streams API (CompressionStream).
 * Used in browser environments where zlib is not available.
 */
async function deflateRawWeb(data: Uint8Array): Promise<Uint8Array> {
	const cs = new CompressionStream("deflate-raw");
	const writer = cs.writable.getWriter();
	// Cast to Uint8Array<ArrayBuffer> for strict TS — safe since we own this buffer
	const safeData = new Uint8Array(
		data.buffer as ArrayBuffer,
		data.byteOffset,
		data.byteLength,
	);
	const writePromise = writer.write(safeData).then(() => writer.close());

	const reader = cs.readable.getReader();
	const chunks: Uint8Array[] = [];

	const readPromise = (async () => {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}
	})();

	await Promise.all([writePromise, readPromise]);
	return concatUint8Arrays(chunks);
}

/**
 * Decompresses data using the Web Streams API (DecompressionStream).
 * Used in browser environments where zlib is not available.
 */
async function inflateRawWeb(data: Uint8Array): Promise<Uint8Array> {
	const ds = new DecompressionStream("deflate-raw");
	const writer = ds.writable.getWriter();

	// Cast to Uint8Array<ArrayBuffer> for strict TS — safe since we own this buffer
	const safeData = new Uint8Array(
		data.buffer as ArrayBuffer,
		data.byteOffset,
		data.byteLength,
	);
	// Write and close, catching errors from the writable side
	const writePromise = writer.write(safeData).then(() => writer.close());

	const reader = ds.readable.getReader();
	const chunks: Uint8Array[] = [];

	const readPromise = (async () => {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}
	})();

	// Wait for both to settle — errors on either side are caught
	await Promise.all([writePromise, readPromise]);
	return concatUint8Arrays(chunks);
}

/**
 * Compresses data using Node.js zlib.deflateRaw.
 */
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

/**
 * Decompresses data using Node.js zlib.inflateRaw.
 */
function inflateRawNode(
	data: Uint8Array,
	nodeInflateRaw: typeof import("node:zlib").inflateRaw,
): Promise<Uint8Array> {
	return new Promise((resolve, reject) => {
		nodeInflateRaw(data, (err, result) => {
			if (err) reject(err);
			else resolve(new Uint8Array(result));
		});
	});
}

/**
 * Compresses data using raw DEFLATE (no zlib/gzip headers).
 * Prefers Node.js zlib when available (reliable error handling),
 * falls back to CompressionStream for browser environments.
 *
 * @param data - Raw bytes to compress
 * @returns Compressed bytes
 * @throws {CompressError} COMPRESSION_FAILED if compression fails
 */
async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
	// Prefer Node.js zlib — callback-based with reliable error handling
	try {
		const zlib = await import("node:zlib");
		return await deflateRawNode(data, zlib.deflateRaw);
	} catch {
		// Not in Node.js — try Web Streams
	}

	if (typeof globalThis.CompressionStream !== "undefined") {
		try {
			return await deflateRawWeb(data);
		} catch (error) {
			throw new CompressError(
				COMPRESS_ERROR_CODE.COMPRESSION_FAILED,
				`Compression failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	throw new CompressError(
		COMPRESS_ERROR_CODE.COMPRESSION_FAILED,
		"No compression API available. Requires zlib (Node.js) or CompressionStream (browser).",
	);
}

/**
 * Decompresses raw DEFLATE data.
 * Prefers Node.js zlib when available (reliable error handling),
 * falls back to DecompressionStream for browser environments.
 *
 * @param data - Compressed bytes (raw DEFLATE)
 * @returns Decompressed bytes
 * @throws {CompressError} DECOMPRESSION_FAILED if decompression fails
 */
async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
	// Prefer Node.js zlib — callback-based with reliable error handling
	try {
		const zlib = await import("node:zlib");
		return await inflateRawNode(data, zlib.inflateRaw);
	} catch (error) {
		// If it's a zlib decompression error, wrap it
		if (
			error instanceof Error &&
			"code" in error &&
			(error as { code: string }).code === "Z_DATA_ERROR"
		) {
			throw new CompressError(
				COMPRESS_ERROR_CODE.DECOMPRESSION_FAILED,
				`Decompression failed: ${error.message}`,
			);
		}
		// If it's a module resolution error, fall through to Web Streams
		if (
			error instanceof Error &&
			error.message.includes("Cannot find module")
		) {
			// Fall through to browser path
		} else if (error instanceof Error) {
			throw new CompressError(
				COMPRESS_ERROR_CODE.DECOMPRESSION_FAILED,
				`Decompression failed: ${error.message}`,
			);
		}
	}

	if (typeof globalThis.DecompressionStream !== "undefined") {
		try {
			return await inflateRawWeb(data);
		} catch (error) {
			throw new CompressError(
				COMPRESS_ERROR_CODE.DECOMPRESSION_FAILED,
				`Decompression failed: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	throw new CompressError(
		COMPRESS_ERROR_CODE.DECOMPRESSION_FAILED,
		"No decompression API available. Requires zlib (Node.js) or DecompressionStream (browser).",
	);
}

export { deflateRaw, inflateRaw };
