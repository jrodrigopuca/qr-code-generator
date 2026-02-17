/**
 * @fileoverview Exportaciones centralizadas de constantes QR
 * @module constants
 */

export { BYTE_CAPACITY, TOTAL_DATA_CODEWORDS } from "./capacity";
export {
	ECC_CODEWORDS_PER_BLOCK,
	BLOCK_CONFIG,
	REMAINDER_BITS,
} from "./correction";
export { ALIGNMENT_PATTERN_POSITIONS } from "./alignment";
export {
	FORMAT_INFO_STRINGS,
	VERSION_INFO_STRINGS,
	MODE_INDICATORS,
	ALPHANUMERIC_CHARS,
} from "./format";
export { GF_ANTILOG, GF_LOG } from "./galois";
