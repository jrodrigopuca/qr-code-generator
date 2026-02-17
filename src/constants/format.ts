/**
 * @fileoverview Tablas de información de formato y versión para códigos QR
 * @description Cadenas de bits pre-calculadas para información de formato
 * y versión según ISO/IEC 18004.
 * @module constants/format
 * @see {@link https://www.thonky.com/qr-code-tutorial/format-version-information}
 */

import type { ErrorCorrectionLevel, MaskPattern } from "../types";

/**
 * Cadenas de información de formato (15 bits).
 * Indexado por [máscara][nivel de corrección].
 * Incluyen los 5 bits de datos + 10 bits BCH de corrección + máscara XOR.
 *
 * @example
 * ```typescript
 * // Formato para máscara 0, corrección L
 * const formatBits = FORMAT_INFO_STRINGS[0].L; // '111011111000100'
 * ```
 */
export const FORMAT_INFO_STRINGS: readonly Record<
	ErrorCorrectionLevel,
	string
>[] = [
	{
		L: "111011111000100",
		M: "101010000010010",
		Q: "011010101011111",
		H: "001011010001001",
	},
	{
		L: "111001011110011",
		M: "101000100100101",
		Q: "011000001101000",
		H: "001001110111110",
	},
	{
		L: "111110110101010",
		M: "101111001111100",
		Q: "011111100110001",
		H: "001110011100111",
	},
	{
		L: "111100010011101",
		M: "101101101001011",
		Q: "011101000000110",
		H: "001100111010000",
	},
	{
		L: "110011000101111",
		M: "100010111111001",
		Q: "010010010110100",
		H: "000011101100010",
	},
	{
		L: "110001100011000",
		M: "100000011001110",
		Q: "010000110000011",
		H: "000001001010101",
	},
	{
		L: "110110001000001",
		M: "100111110010111",
		Q: "010111011011010",
		H: "000110100001100",
	},
	{
		L: "110100101110110",
		M: "100101010100000",
		Q: "010101111101101",
		H: "000100000111011",
	},
] as const;

/**
 * Cadenas de información de versión (18 bits).
 * Solo para versiones 7-40.
 * Indexado por versión - 7.
 *
 * @example
 * ```typescript
 * // Información de versión para versión 7
 * const versionBits = VERSION_INFO_STRINGS[0]; // '000111110010010100'
 * ```
 */
export const VERSION_INFO_STRINGS: readonly string[] = [
	"000111110010010100", // Version 7
	"001000010110111100", // Version 8
	"001001101010011001", // Version 9
	"001010010011010011", // Version 10
	"001011101111110110", // Version 11
	"001100011101100010", // Version 12
	"001101100001000111", // Version 13
	"001110011000001101", // Version 14
	"001111100100101000", // Version 15
	"010000101101111000", // Version 16
	"010001010001011101", // Version 17
	"010010101000010111", // Version 18
	"010011010100110010", // Version 19
	"010100100110100110", // Version 20
	"010101011010000011", // Version 21
	"010110100011001001", // Version 22
	"010111011111101100", // Version 23
	"011000111011000100", // Version 24
	"011001000111100001", // Version 25
	"011010111110101011", // Version 26
	"011011000010001110", // Version 27
	"011100110000011010", // Version 28
	"011101001100111111", // Version 29
	"011110110101110101", // Version 30
	"011111001001010000", // Version 31
	"100000100111010101", // Version 32
	"100001011011110000", // Version 33
	"100010100010111010", // Version 34
	"100011011110011111", // Version 35
	"100100101100001011", // Version 36
	"100101010000101110", // Version 37
	"100110101001100100", // Version 38
	"100111010101000001", // Version 39
	"101000110001101001", // Version 40
] as const;

/**
 * Indicadores de modo de codificación (4 bits).
 *
 * @example
 * ```typescript
 * const byteMode = MODE_INDICATORS.byte; // '0100'
 * ```
 */
export const MODE_INDICATORS = {
	numeric: "0001",
	alphanumeric: "0010",
	byte: "0100",
	kanji: "1000",
	eci: "0111",
	terminator: "0000",
} as const;

/**
 * Caracteres válidos para modo alfanumérico y sus valores.
 *
 * @example
 * ```typescript
 * const value = ALPHANUMERIC_CHARS['A']; // 10
 * ```
 */
export const ALPHANUMERIC_CHARS: Record<string, number> = {
	"0": 0,
	"1": 1,
	"2": 2,
	"3": 3,
	"4": 4,
	"5": 5,
	"6": 6,
	"7": 7,
	"8": 8,
	"9": 9,
	A: 10,
	B: 11,
	C: 12,
	D: 13,
	E: 14,
	F: 15,
	G: 16,
	H: 17,
	I: 18,
	J: 19,
	K: 20,
	L: 21,
	M: 22,
	N: 23,
	O: 24,
	P: 25,
	Q: 26,
	R: 27,
	S: 28,
	T: 29,
	U: 30,
	V: 31,
	W: 32,
	X: 33,
	Y: 34,
	Z: 35,
	" ": 36,
	$: 37,
	"%": 38,
	"*": 39,
	"+": 40,
	"-": 41,
	".": 42,
	"/": 43,
	":": 44,
} as const;
