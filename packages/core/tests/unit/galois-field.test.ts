/**
 * @fileoverview Tests unitarios para GaloisField
 */

import { describe, it, expect } from "vitest";
import { GaloisField } from "../../src/correction/GaloisField";

describe("GaloisField", () => {
	describe("antilog", () => {
		it("should return 1 for exponent 0", () => {
			// α^0 = 1
			expect(GaloisField.antilog(0)).toBe(1);
		});

		it("should return 2 for exponent 1", () => {
			// α^1 = 2
			expect(GaloisField.antilog(1)).toBe(2);
		});

		it("should return 4 for exponent 2", () => {
			// α^2 = 4
			expect(GaloisField.antilog(2)).toBe(4);
		});

		it("should handle exponent 8 with primitive polynomial", () => {
			// α^8 = 29 (due to primitive polynomial x^8 + x^4 + x^3 + x^2 + 1)
			expect(GaloisField.antilog(8)).toBe(29);
		});

		it("should normalize exponents >= 255", () => {
			// α^255 = α^0 = 1
			expect(GaloisField.antilog(255)).toBe(GaloisField.antilog(0));
			expect(GaloisField.antilog(256)).toBe(GaloisField.antilog(1));
		});
	});

	describe("log", () => {
		it("should return 0 for value 1", () => {
			// log(1) = 0 because α^0 = 1
			expect(GaloisField.log(1)).toBe(0);
		});

		it("should return 1 for value 2", () => {
			// log(2) = 1 because α^1 = 2
			expect(GaloisField.log(2)).toBe(1);
		});

		it("should return 8 for value 29", () => {
			// log(29) = 8 because α^8 = 29
			expect(GaloisField.log(29)).toBe(8);
		});

		it("should throw error for log(0)", () => {
			expect(() => GaloisField.log(0)).toThrow("Logarithm of 0 is undefined");
		});
	});

	describe("add (XOR)", () => {
		it("should return 0 when adding same values", () => {
			// a + a = 0 in GF(2^8)
			expect(GaloisField.add(5, 5)).toBe(0);
			expect(GaloisField.add(255, 255)).toBe(0);
		});

		it("should return same value when adding 0", () => {
			// a + 0 = a
			expect(GaloisField.add(42, 0)).toBe(42);
			expect(GaloisField.add(0, 42)).toBe(42);
		});

		it("should perform XOR correctly", () => {
			// 5 XOR 3 = 6
			expect(GaloisField.add(5, 3)).toBe(6);
			// 170 XOR 85 = 255
			expect(GaloisField.add(170, 85)).toBe(255);
		});
	});

	describe("multiply", () => {
		it("should return 0 when multiplying by 0", () => {
			expect(GaloisField.multiply(42, 0)).toBe(0);
			expect(GaloisField.multiply(0, 42)).toBe(0);
		});

		it("should return same value when multiplying by 1", () => {
			expect(GaloisField.multiply(42, 1)).toBe(42);
			expect(GaloisField.multiply(1, 42)).toBe(42);
		});

		it("should multiply correctly", () => {
			// Known values from GF(2^8) multiplication
			expect(GaloisField.multiply(2, 2)).toBe(4);
			expect(GaloisField.multiply(17, 42)).toBeDefined();
		});

		it("should be commutative", () => {
			const a = 23;
			const b = 45;
			expect(GaloisField.multiply(a, b)).toBe(GaloisField.multiply(b, a));
		});
	});

	describe("divide", () => {
		it("should return original value when dividing by 1", () => {
			expect(GaloisField.divide(42, 1)).toBe(42);
		});

		it("should return 1 when dividing same values", () => {
			expect(GaloisField.divide(42, 42)).toBe(1);
		});

		it("should throw error when dividing by 0", () => {
			expect(() => GaloisField.divide(42, 0)).toThrow();
		});

		it("should satisfy a / b * b = a", () => {
			const a = 42;
			const b = 17;
			const quotient = GaloisField.divide(a, b);
			expect(GaloisField.multiply(quotient, b)).toBe(a);
		});
	});

	describe("power", () => {
		it("should return 1 for exponent 0", () => {
			expect(GaloisField.power(2, 0)).toBe(1);
			expect(GaloisField.power(42, 0)).toBe(1);
		});

		it("should return base for exponent 1", () => {
			expect(GaloisField.power(2, 1)).toBe(2);
			expect(GaloisField.power(42, 1)).toBe(42);
		});

		it("should calculate powers correctly", () => {
			// 2^2 = 4 in GF(2^8)
			expect(GaloisField.power(2, 2)).toBe(4);
			// 2^3 = 8
			expect(GaloisField.power(2, 3)).toBe(8);
		});
	});

	describe("consistency", () => {
		it("should maintain antilog(log(x)) = x", () => {
			for (let x = 1; x <= 255; x++) {
				expect(GaloisField.antilog(GaloisField.log(x))).toBe(x);
			}
		});

		it("should maintain log(antilog(i)) = i for i < 255", () => {
			for (let i = 0; i < 255; i++) {
				expect(GaloisField.log(GaloisField.antilog(i))).toBe(i);
			}
		});
	});
});
