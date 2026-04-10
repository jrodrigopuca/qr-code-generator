/**
 * @fileoverview Base45 encoder/decoder (RFC 9285)
 * @description Internal module for binary-to-text encoding using the Base45
 * alphabet. All output characters are within the QR alphanumeric charset,
 * enabling 5.5 bits/char encoding instead of 8 bits/char (byte mode).
 *
 * @module @qr-plus/compress/base45
 * @see https://datatracker.ietf.org/doc/html/rfc9285
 */

/**
 * Base45 alphabet — 45 characters matching QR alphanumeric mode.
 * Index 0-44 maps to: 0-9, A-Z, space, $, %, *, +, -, ., /, :
 */
const BASE45_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

/**
 * Reverse lookup: character → index in BASE45_CHARSET.
 * Built once at module load for O(1) decode lookups.
 */
const CHAR_TO_INDEX = new Map<string, number>();
for (let i = 0; i < BASE45_CHARSET.length; i++) {
	CHAR_TO_INDEX.set(BASE45_CHARSET[i], i);
}

/**
 * Encodes a Uint8Array into a Base45 string per RFC 9285.
 *
 * - Byte pairs → 3 Base45 characters
 * - Single remaining byte → 2 Base45 characters
 * - Empty input → empty string
 *
 * @param input - Raw bytes to encode
 * @returns Base45-encoded string (QR-alphanumeric compatible)
 */
function base45Encode(input: Uint8Array): string {
	if (input.length === 0) return "";

	let result = "";

	for (let i = 0; i < input.length; i += 2) {
		if (i + 1 < input.length) {
			// Two bytes → value up to 65535 → 3 Base45 chars
			const n = input[i] * 256 + input[i + 1];
			const c = n % 45;
			const d = ((n / 45) | 0) % 45;
			const e = (n / 2025) | 0;
			result += BASE45_CHARSET[c] + BASE45_CHARSET[d] + BASE45_CHARSET[e];
		} else {
			// Single byte → value up to 255 → 2 Base45 chars
			const n = input[i];
			const c = n % 45;
			const d = (n / 45) | 0;
			result += BASE45_CHARSET[c] + BASE45_CHARSET[d];
		}
	}

	return result;
}

/**
 * Decodes a Base45 string back into a Uint8Array per RFC 9285.
 *
 * - Groups of 3 chars → 2 bytes
 * - Remaining group of 2 chars → 1 byte
 * - Empty string → empty Uint8Array
 *
 * @param input - Base45-encoded string
 * @returns Decoded bytes
 * @throws {Error} If input contains characters outside the Base45 alphabet
 *   or decoded values are out of range
 */
function base45Decode(input: string): Uint8Array {
	if (input.length === 0) return new Uint8Array(0);

	// Validate all characters first
	for (let i = 0; i < input.length; i++) {
		if (!CHAR_TO_INDEX.has(input[i])) {
			throw new Error(
				`Invalid Base45 character "${input[i]}" at position ${i}.`,
			);
		}
	}

	const remainder = input.length % 3;
	if (remainder === 1) {
		throw new Error(
			`Invalid Base45 string length: ${input.length}. Length must not have remainder 1 when divided by 3.`,
		);
	}

	// Calculate output size: groups of 3 → 2 bytes, group of 2 → 1 byte
	const fullGroups = ((input.length / 3) | 0) * 2;
	const extra = remainder === 2 ? 1 : 0;
	const output = new Uint8Array(fullGroups + extra);
	let outIdx = 0;

	// Safe lookup — validation above guarantees the key exists.
	const idx = (char: string): number => CHAR_TO_INDEX.get(char) ?? 0;

	for (let i = 0; i < input.length; i += 3) {
		if (i + 2 < input.length) {
			// 3 chars → 2 bytes
			const c = idx(input[i]);
			const d = idx(input[i + 1]);
			const e = idx(input[i + 2]);
			const n = c + d * 45 + e * 2025;
			if (n > 65535) {
				throw new Error(
					`Base45 value out of range at position ${i}: ${n} > 65535.`,
				);
			}
			output[outIdx++] = (n >> 8) & 0xff;
			output[outIdx++] = n & 0xff;
		} else {
			// 2 chars → 1 byte
			const c = idx(input[i]);
			const d = idx(input[i + 1]);
			const n = c + d * 45;
			if (n > 255) {
				throw new Error(
					`Base45 value out of range at position ${i}: ${n} > 255.`,
				);
			}
			output[outIdx++] = n;
		}
	}

	return output;
}

export { base45Decode, base45Encode };
