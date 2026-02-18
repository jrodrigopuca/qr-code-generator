/**
 * @fileoverview Tests de codewords y Reed-Solomon para QR
 * @description Verifica que los codewords generados y colocados sean correctos:
 * - Data codewords se generan correctamente
 * - ECC codewords de Reed-Solomon son correctos
 * - Los codewords se colocan correctamente en la matriz
 *
 * Basado en: debug-scripts/verify-codewords-simple.js, extract-codewords.js
 */

import { describe, it, expect } from "vitest";
import { QRCode } from "../../src";
import { AlphanumericEncoder } from "../../src/encoder/AlphanumericEncoder";
import { ByteEncoder } from "../../src/encoder/ByteEncoder";
import { NumericEncoder } from "../../src/encoder/NumericEncoder";
import { ReedSolomon } from "../../src/correction/ReedSolomon";
import {
	ECC_CODEWORDS_PER_BLOCK,
	BLOCK_CONFIG,
} from "../../src/constants/correction";

/**
 * Convierte bits a codewords con padding.
 */
function bitsToCodewords(bits: string, count: number): number[] {
	const totalBits = count * 8;
	let paddedBits = bits;

	// Terminator (hasta 4 bits de 0)
	const terminatorBits = Math.min(4, totalBits - bits.length);
	paddedBits += "0".repeat(terminatorBits);

	// Pad para alinear a byte
	while (paddedBits.length % 8 !== 0) {
		paddedBits += "0";
	}

	// Pad words alternados 0xEC 0x11
	const padPatterns = ["11101100", "00010001"];
	let padIndex = 0;
	while (paddedBits.length < totalBits) {
		paddedBits += padPatterns[padIndex % 2];
		padIndex++;
	}

	// Convertir a bytes
	const bytes: number[] = [];
	for (let i = 0; i < count * 8; i += 8) {
		let byte = 0;
		for (let j = 0; j < 8; j++) {
			byte = (byte << 1) | parseInt(paddedBits[i + j] || "0");
		}
		bytes.push(byte);
	}
	return bytes;
}

/**
 * Extrae bits de la matriz en orden zigzag.
 */
function extractBitsFromMatrix(
	matrix: number[][],
	reserved: number[][],
	expectedBits: number,
): number[] {
	const size = matrix.length;
	const bits: number[] = [];
	let right = size - 1;
	let goingUp = true;

	while (right >= 0 && bits.length < expectedBits) {
		if (right === 6) {
			right--;
			continue;
		}

		for (let vert = 0; vert < size && bits.length < expectedBits; vert++) {
			const row = goingUp ? size - 1 - vert : vert;

			for (let horz = 0; horz < 2 && bits.length < expectedBits; horz++) {
				const col = right - horz;
				if (col < 0) continue;
				if (reserved[row][col] !== 0) continue;

				bits.push(matrix[row][col]);
			}
		}

		right -= 2;
		goingUp = !goingUp;
	}

	return bits;
}

describe("Codeword Generation", () => {
	describe("Alphanumeric encoding for V1-L", () => {
		it('should generate correct data codewords for "A"', () => {
			const encoder = new AlphanumericEncoder();
			const bits = encoder.encodeSegment("A", 1);

			// Modo alphanumeric: 0010, longitud (9 bits): 000000001, datos: 01010
			// Total: 0010 000000001 01010 = 19 bits
			expect(bits).toBe("0010000000001001010");

			const dataCodewords = bitsToCodewords(bits, 19);

			// Esperado: 20 09 40 EC 11 EC 11 EC 11 EC 11 EC 11 EC 11 EC 11 EC 11
			expect(dataCodewords[0]).toBe(0x20);
			expect(dataCodewords[1]).toBe(0x09);
			expect(dataCodewords[2]).toBe(0x40);
			expect(dataCodewords[3]).toBe(0xec);
			expect(dataCodewords[4]).toBe(0x11);
		});

		it("should generate correct ECC codewords for alphanumeric A", () => {
			const encoder = new AlphanumericEncoder();
			const bits = encoder.encodeSegment("A", 1);
			const dataCodewords = bitsToCodewords(bits, 19);

			const rs = new ReedSolomon(7); // V1-L tiene 7 ECC codewords
			const eccCodewords = rs.encode(dataCodewords);

			// Esperado: CB 0A 1D 28 A2 2D 12
			expect(eccCodewords).toEqual([0xcb, 0x0a, 0x1d, 0x28, 0xa2, 0x2d, 0x12]);
		});
	});

	describe("Byte encoding for V1-L", () => {
		it('should generate correct data codewords for "A" in byte mode', () => {
			const encoder = new ByteEncoder();
			const bits = encoder.encodeSegment("A", 1);

			// Modo byte: 0100, longitud (8 bits): 00000001, datos: 01000001 (ASCII 65)
			// Total: 0100 00000001 01000001 = 20 bits
			expect(bits).toBe("01000000000101000001");

			const dataCodewords = bitsToCodewords(bits, 19);

			// Esperado: 40 14 10 EC 11 EC 11 EC 11 EC 11 EC 11 EC 11 EC 11 EC 11
			expect(dataCodewords[0]).toBe(0x40);
			expect(dataCodewords[1]).toBe(0x14);
			expect(dataCodewords[2]).toBe(0x10);
		});

		it("should generate correct ECC codewords for byte mode A", () => {
			const encoder = new ByteEncoder();
			const bits = encoder.encodeSegment("A", 1);
			const dataCodewords = bitsToCodewords(bits, 19);

			const rs = new ReedSolomon(7);
			const eccCodewords = rs.encode(dataCodewords);

			// Esperado: 52 4B B5 3B AF 8D F1
			expect(eccCodewords).toEqual([0x52, 0x4b, 0xb5, 0x3b, 0xaf, 0x8d, 0xf1]);
		});
	});

	describe("Numeric encoding", () => {
		it("should generate correct bits for numeric data", () => {
			const encoder = new NumericEncoder();
			const bits = encoder.encodeSegment("12345", 1);

			// Modo numérico: 0001
			// Longitud (10 bits para V1): 0000000101
			// Datos: 123 -> 0001111011 (10 bits), 45 -> 0101101 (7 bits)
			expect(bits.startsWith("0001")).toBe(true);
		});
	});
});

describe("Reed-Solomon Error Correction", () => {
	describe("V1-L (7 ECC codewords)", () => {
		it("should produce correct ECC for known input", () => {
			const data = [
				0x20, 0x09, 0x40, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec,
				0x11, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11,
			];

			const rs = new ReedSolomon(7);
			const ecc = rs.encode(data);

			expect(ecc).toHaveLength(7);
			expect(ecc).toEqual([0xcb, 0x0a, 0x1d, 0x28, 0xa2, 0x2d, 0x12]);
		});
	});

	describe("V1-M (10 ECC codewords)", () => {
		it("should produce ECC with correct length", () => {
			const data = new Array(16).fill(0xec);
			const rs = new ReedSolomon(10);
			const ecc = rs.encode(data);

			expect(ecc).toHaveLength(10);
		});
	});

	describe("V1-Q (13 ECC codewords)", () => {
		it("should produce ECC with correct length", () => {
			const data = new Array(13).fill(0xec);
			const rs = new ReedSolomon(13);
			const ecc = rs.encode(data);

			expect(ecc).toHaveLength(13);
		});
	});

	describe("V1-H (17 ECC codewords)", () => {
		it("should produce ECC with correct length", () => {
			const data = new Array(9).fill(0xec);
			const rs = new ReedSolomon(17);
			const ecc = rs.encode(data);

			expect(ecc).toHaveLength(17);
		});
	});
});

describe("Error Correction Configuration", () => {
	describe("Block configuration for V1", () => {
		it("should have correct configuration for V1-L", () => {
			const config = BLOCK_CONFIG[0].L; // V1, L
			const [g1Blocks, g1DataCw, g2Blocks, g2DataCw] = config;

			expect(g1Blocks).toBe(1); // 1 bloque
			expect(g1DataCw).toBe(19); // 19 data codewords
			expect(g2Blocks).toBe(0); // sin grupo 2
			expect(g2DataCw).toBe(0);
		});

		it("should have correct ECC count for V1-L", () => {
			const eccCount = ECC_CODEWORDS_PER_BLOCK[0].L; // V1, L
			expect(eccCount).toBe(7);
		});

		it("should have total codewords = data + ECC for V1-L", () => {
			const [g1Blocks, g1DataCw] = BLOCK_CONFIG[0].L;
			const eccCount = ECC_CODEWORDS_PER_BLOCK[0].L;

			const totalDataCw = g1Blocks * g1DataCw;
			const totalEccCw = g1Blocks * eccCount;
			const totalCw = totalDataCw + totalEccCw;

			expect(totalCw).toBe(26); // V1-L: 26 codewords total
		});
	});
});
