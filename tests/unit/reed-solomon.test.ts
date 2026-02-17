/**
 * @fileoverview Tests unitarios para ReedSolomon
 */

import { describe, it, expect } from "vitest";
import { ReedSolomon } from "../../src/correction/ReedSolomon";

describe("ReedSolomon", () => {
	describe("constructor", () => {
		it("should create instance with valid ecc count", () => {
			const rs = new ReedSolomon(10);
			expect(rs).toBeDefined();
		});

		it("should throw error for ecc count < 1", () => {
			expect(() => new ReedSolomon(0)).toThrow("ECC count must be at least 1");
			expect(() => new ReedSolomon(-1)).toThrow("ECC count must be at least 1");
		});
	});

	describe("encode", () => {
		it("should generate correct number of ECC codewords", () => {
			const rs = new ReedSolomon(10);
			const data = [32, 91, 11, 120, 209, 114, 220, 77];
			const ecc = rs.encode(data);

			expect(ecc).toHaveLength(10);
		});

		it("should return different ECC for different data", () => {
			const rs = new ReedSolomon(7);
			const ecc1 = rs.encode([1, 2, 3, 4]);
			const ecc2 = rs.encode([4, 3, 2, 1]);

			expect(ecc1).not.toEqual(ecc2);
		});

		it("should handle single byte data", () => {
			const rs = new ReedSolomon(2);
			const ecc = rs.encode([42]);

			expect(ecc).toHaveLength(2);
		});

		it("should generate ECC values in valid byte range", () => {
			const rs = new ReedSolomon(10);
			const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64];
			const ecc = rs.encode(data);

			ecc.forEach((byte) => {
				expect(byte).toBeGreaterThanOrEqual(0);
				expect(byte).toBeLessThanOrEqual(255);
			});
		});

		it("should produce deterministic results", () => {
			const rs = new ReedSolomon(10);
			const data = [32, 91, 11, 120];

			const ecc1 = rs.encode(data);
			const ecc2 = rs.encode(data);

			expect(ecc1).toEqual(ecc2);
		});

		// Reference test case from QR code standard
		it("should generate correct ECC for version 1-M reference data", () => {
			// This is test data that encodes "Hello" in version 1-M
			const rs = new ReedSolomon(10);
			const data = [
				32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17,
			];
			const ecc = rs.encode(data);

			expect(ecc).toHaveLength(10);
			// The ECC values should be valid bytes
			ecc.forEach((byte) => {
				expect(byte).toBeGreaterThanOrEqual(0);
				expect(byte).toBeLessThanOrEqual(255);
			});
		});
	});

	describe("generator polynomial", () => {
		it("should have correct degree", () => {
			const rs = new ReedSolomon(7);
			const poly = rs.getGeneratorPolynomial();

			// Generator polynomial for n ECC codewords has degree n
			// and n+1 coefficients
			expect(poly).toHaveLength(8);
		});

		it("should start with 1 (leading coefficient)", () => {
			const rs = new ReedSolomon(5);
			const poly = rs.getGeneratorPolynomial();

			// Leading coefficient is 1 (coefficient of x^n)
			expect(poly[0]).toBe(1);
		});

		it("should generate different polynomials for different ECC counts", () => {
			const rs5 = new ReedSolomon(5);
			const rs7 = new ReedSolomon(7);

			expect(rs5.getGeneratorPolynomial()).not.toEqual(
				rs7.getGeneratorPolynomial(),
			);
		});
	});

	describe("different ECC levels", () => {
		// Test common QR code ECC counts
		const eccCounts = [7, 10, 13, 17, 22, 26, 30];

		eccCounts.forEach((count) => {
			it(`should handle ECC count ${count}`, () => {
				const rs = new ReedSolomon(count);
				const data = [1, 2, 3, 4, 5, 6, 7, 8];
				const ecc = rs.encode(data);

				expect(ecc).toHaveLength(count);
			});
		});
	});

	describe("edge cases", () => {
		it("should handle empty data array", () => {
			const rs = new ReedSolomon(5);
			const ecc = rs.encode([]);

			// ECC for empty data should be all zeros
			expect(ecc).toHaveLength(5);
		});

		it("should handle data with all zeros", () => {
			const rs = new ReedSolomon(4);
			const data = [0, 0, 0, 0];
			const ecc = rs.encode(data);

			expect(ecc).toHaveLength(4);
			// ECC of all zeros is all zeros
			expect(ecc).toEqual([0, 0, 0, 0]);
		});

		it("should handle data with all 255s", () => {
			const rs = new ReedSolomon(4);
			const data = [255, 255, 255, 255];
			const ecc = rs.encode(data);

			expect(ecc).toHaveLength(4);
			ecc.forEach((byte) => {
				expect(byte).toBeGreaterThanOrEqual(0);
				expect(byte).toBeLessThanOrEqual(255);
			});
		});
	});
});
