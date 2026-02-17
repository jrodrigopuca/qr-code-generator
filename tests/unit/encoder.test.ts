/**
 * @fileoverview Tests unitarios para Encoders
 */

import { describe, it, expect } from "vitest";
import { ByteEncoder } from "../../src/encoder/ByteEncoder";
import { NumericEncoder } from "../../src/encoder/NumericEncoder";
import { AlphanumericEncoder } from "../../src/encoder/AlphanumericEncoder";
import { ModeDetector } from "../../src/encoder/ModeDetector";

describe("ByteEncoder", () => {
	describe("encode", () => {
		it("should encode single ASCII character", () => {
			const encoder = new ByteEncoder();
			const result = encoder.encode("A");

			// 'A' = 65 = 01000001
			expect(result).toBe("01000001");
		});

		it("should encode multiple ASCII characters", () => {
			const encoder = new ByteEncoder();
			const result = encoder.encode("Hi");

			// 'H' = 72 = 01001000, 'i' = 105 = 01101001
			expect(result).toBe("0100100001101001");
		});

		it("should encode digits correctly", () => {
			const encoder = new ByteEncoder();
			const result = encoder.encode("0");

			// '0' = 48 = 00110000
			expect(result).toBe("00110000");
		});

		it("should encode hello world correctly", () => {
			const encoder = new ByteEncoder();
			const result = encoder.encode("Hello");

			// H=72, e=101, l=108, l=108, o=111
			expect(result).toHaveLength(5 * 8); // 40 bits
			expect(result.substring(0, 8)).toBe("01001000"); // 'H' = 72
		});

		it("should handle empty string", () => {
			const encoder = new ByteEncoder();
			const result = encoder.encode("");

			expect(result).toBe("");
		});

		it("should encode special characters", () => {
			const encoder = new ByteEncoder();
			const result = encoder.encode("@");

			// '@' = 64 = 01000000
			expect(result).toBe("01000000");
		});
	});

	describe("encodeUTF8", () => {
		it("should encode ASCII as single bytes", () => {
			const encoder = new ByteEncoder();
			const result = encoder.encodeUTF8("A");

			expect(result).toEqual([65]);
		});

		it("should encode UTF-8 multibyte characters", () => {
			const encoder = new ByteEncoder();
			const result = encoder.encodeUTF8("é");

			// 'é' in UTF-8 is 0xC3 0xA9 = [195, 169]
			expect(result).toEqual([195, 169]);
		});

		it("should handle emoji (4-byte UTF-8)", () => {
			const encoder = new ByteEncoder();
			const result = encoder.encodeUTF8("😀");

			// Emoji uses 4 bytes in UTF-8
			expect(result).toHaveLength(4);
		});
	});

	describe("getCharacterCountBits", () => {
		it("should return 8 bits for versions 1-9", () => {
			const encoder = new ByteEncoder();

			expect(encoder.getCharacterCountBits(1)).toBe(8);
			expect(encoder.getCharacterCountBits(5)).toBe(8);
			expect(encoder.getCharacterCountBits(9)).toBe(8);
		});

		it("should return 16 bits for versions 10-40", () => {
			const encoder = new ByteEncoder();

			expect(encoder.getCharacterCountBits(10)).toBe(16);
			expect(encoder.getCharacterCountBits(25)).toBe(16);
			expect(encoder.getCharacterCountBits(40)).toBe(16);
		});
	});

	describe("canEncode", () => {
		it("should accept any ASCII text", () => {
			const encoder = new ByteEncoder();

			expect(encoder.canEncode("Hello World")).toBe(true);
			expect(encoder.canEncode("123")).toBe(true);
			expect(encoder.canEncode("!@#$%")).toBe(true);
		});

		it("should accept ISO-8859-1 text (codes 0-255)", () => {
			const encoder = new ByteEncoder();

			// é = 233, within ISO-8859-1
			expect(encoder.canEncode("Héllo")).toBe(true);
		});

		it("should reject Unicode characters outside ISO-8859-1", () => {
			const encoder = new ByteEncoder();

			// Japanese characters are outside ISO-8859-1
			expect(encoder.canEncode("日本語")).toBe(false);
		});

		it("should accept empty string", () => {
			const encoder = new ByteEncoder();

			expect(encoder.canEncode("")).toBe(true);
		});
	});

	describe("getUTF8ByteLength", () => {
		it("should return correct byte length for ASCII", () => {
			const encoder = new ByteEncoder();

			expect(encoder.getUTF8ByteLength("Hello")).toBe(5);
			expect(encoder.getUTF8ByteLength("A")).toBe(1);
		});

		it("should return correct byte length for UTF-8 multibyte", () => {
			const encoder = new ByteEncoder();

			// 'é' is 2 bytes in UTF-8
			expect(encoder.getUTF8ByteLength("é")).toBe(2);
			// Japanese character is 3 bytes in UTF-8
			expect(encoder.getUTF8ByteLength("日")).toBe(3);
		});
	});

	describe("mode properties", () => {
		it("should have correct mode", () => {
			const encoder = new ByteEncoder();

			expect(encoder.mode).toBe("byte");
		});

		it("should have correct mode indicator", () => {
			const encoder = new ByteEncoder();

			expect(encoder.modeIndicator).toBe("0100");
		});
	});
});

describe("NumericEncoder", () => {
	describe("encode", () => {
		it("should encode single digit", () => {
			const encoder = new NumericEncoder();
			const result = encoder.encode("5");

			// 5 in 4 bits = 0101
			expect(result).toBe("0101");
		});

		it("should encode two digits", () => {
			const encoder = new NumericEncoder();
			const result = encoder.encode("42");

			// 42 in 7 bits = 0101010
			expect(result).toBe("0101010");
		});

		it("should encode three digits", () => {
			const encoder = new NumericEncoder();
			const result = encoder.encode("123");

			// 123 in 10 bits = 0001111011
			expect(result).toBe("0001111011");
		});

		it("should encode multiple groups", () => {
			const encoder = new NumericEncoder();
			const result = encoder.encode("12345");

			// 123 = 0001111011 (10 bits)
			// 45 = 0101101 (7 bits)
			expect(result).toBe("00011110110101101");
		});

		it("should encode seven digits correctly", () => {
			const encoder = new NumericEncoder();
			const result = encoder.encode("8675309");

			// 867 = 1101100011 (10 bits)
			// 530 = 1000010010 (10 bits)
			// 9 = 1001 (4 bits)
			expect(result).toBe("110110001110000100101001");
		});

		it("should throw for non-numeric input", () => {
			const encoder = new NumericEncoder();

			expect(() => encoder.encode("12A34")).toThrow();
		});
	});

	describe("canEncode", () => {
		it("should accept only digits", () => {
			const encoder = new NumericEncoder();

			expect(encoder.canEncode("12345")).toBe(true);
			expect(encoder.canEncode("0")).toBe(true);
			expect(encoder.canEncode("9876543210")).toBe(true);
		});

		it("should reject non-digits", () => {
			const encoder = new NumericEncoder();

			expect(encoder.canEncode("123A")).toBe(false);
			expect(encoder.canEncode("12.34")).toBe(false);
			expect(encoder.canEncode("12 34")).toBe(false);
			expect(encoder.canEncode("-123")).toBe(false);
			expect(encoder.canEncode("")).toBe(false);
		});
	});

	describe("getCharacterCountBits", () => {
		it("should return 10 bits for versions 1-9", () => {
			const encoder = new NumericEncoder();

			expect(encoder.getCharacterCountBits(1)).toBe(10);
			expect(encoder.getCharacterCountBits(9)).toBe(10);
		});

		it("should return 12 bits for versions 10-26", () => {
			const encoder = new NumericEncoder();

			expect(encoder.getCharacterCountBits(10)).toBe(12);
			expect(encoder.getCharacterCountBits(26)).toBe(12);
		});

		it("should return 14 bits for versions 27-40", () => {
			const encoder = new NumericEncoder();

			expect(encoder.getCharacterCountBits(27)).toBe(14);
			expect(encoder.getCharacterCountBits(40)).toBe(14);
		});
	});

	describe("mode properties", () => {
		it("should have correct mode", () => {
			const encoder = new NumericEncoder();

			expect(encoder.mode).toBe("numeric");
		});

		it("should have correct mode indicator", () => {
			const encoder = new NumericEncoder();

			expect(encoder.modeIndicator).toBe("0001");
		});
	});
});

describe("AlphanumericEncoder", () => {
	describe("encode", () => {
		it("should encode single character", () => {
			const encoder = new AlphanumericEncoder();
			const result = encoder.encode("A");

			// A = 10 in 6 bits = 001010
			expect(result).toBe("001010");
		});

		it("should encode pair of characters", () => {
			const encoder = new AlphanumericEncoder();
			const result = encoder.encode("AB");

			// A=10, B=11 → (10*45)+11 = 461 in 11 bits = 00111001101
			expect(result).toBe("00111001101");
		});

		it("should encode HELLO correctly", () => {
			const encoder = new AlphanumericEncoder();
			const result = encoder.encode("HELLO");

			// HE = (17*45)+14 = 779 → 01100001011
			// LL = (21*45)+21 = 966 → 01111000110
			// O = 24 → 011000
			expect(result).toBe("0110000101101111000110011000");
		});

		it("should handle numeric characters", () => {
			const encoder = new AlphanumericEncoder();
			const result = encoder.encode("42");

			// 4=4, 2=2 → (4*45)+2 = 182 in 11 bits = 00010110110
			expect(result).toBe("00010110110");
		});

		it("should handle space and symbols", () => {
			const encoder = new AlphanumericEncoder();

			// Space is valid in alphanumeric
			expect(() => encoder.encode("A B")).not.toThrow();
			expect(() => encoder.encode("$%")).not.toThrow();
		});

		it("should throw for lowercase", () => {
			const encoder = new AlphanumericEncoder();

			expect(() => encoder.encode("hello")).toThrow();
		});
	});

	describe("canEncode", () => {
		it("should accept uppercase letters and digits", () => {
			const encoder = new AlphanumericEncoder();

			expect(encoder.canEncode("HELLO")).toBe(true);
			expect(encoder.canEncode("123")).toBe(true);
			expect(encoder.canEncode("ABC123")).toBe(true);
		});

		it("should accept valid symbols", () => {
			const encoder = new AlphanumericEncoder();

			expect(encoder.canEncode("$")).toBe(true);
			expect(encoder.canEncode("%")).toBe(true);
			expect(encoder.canEncode("*")).toBe(true);
			expect(encoder.canEncode("+")).toBe(true);
			expect(encoder.canEncode("-")).toBe(true);
			expect(encoder.canEncode(".")).toBe(true);
			expect(encoder.canEncode("/")).toBe(true);
			expect(encoder.canEncode(":")).toBe(true);
			expect(encoder.canEncode(" ")).toBe(true);
		});

		it("should reject lowercase", () => {
			const encoder = new AlphanumericEncoder();

			expect(encoder.canEncode("Hello")).toBe(false);
			expect(encoder.canEncode("abc")).toBe(false);
		});

		it("should reject invalid symbols", () => {
			const encoder = new AlphanumericEncoder();

			expect(encoder.canEncode("@")).toBe(false);
			expect(encoder.canEncode("!")).toBe(false);
			expect(encoder.canEncode("#")).toBe(false);
		});

		it("should reject empty string", () => {
			const encoder = new AlphanumericEncoder();

			expect(encoder.canEncode("")).toBe(false);
		});
	});

	describe("getCharacterCountBits", () => {
		it("should return 9 bits for versions 1-9", () => {
			const encoder = new AlphanumericEncoder();

			expect(encoder.getCharacterCountBits(1)).toBe(9);
			expect(encoder.getCharacterCountBits(9)).toBe(9);
		});

		it("should return 11 bits for versions 10-26", () => {
			const encoder = new AlphanumericEncoder();

			expect(encoder.getCharacterCountBits(10)).toBe(11);
			expect(encoder.getCharacterCountBits(26)).toBe(11);
		});

		it("should return 13 bits for versions 27-40", () => {
			const encoder = new AlphanumericEncoder();

			expect(encoder.getCharacterCountBits(27)).toBe(13);
			expect(encoder.getCharacterCountBits(40)).toBe(13);
		});
	});

	describe("mode properties", () => {
		it("should have correct mode", () => {
			const encoder = new AlphanumericEncoder();

			expect(encoder.mode).toBe("alphanumeric");
		});

		it("should have correct mode indicator", () => {
			const encoder = new AlphanumericEncoder();

			expect(encoder.modeIndicator).toBe("0010");
		});
	});
});

describe("ModeDetector", () => {
	describe("detectMode", () => {
		it("should detect numeric mode for digits only", () => {
			expect(ModeDetector.detectMode("12345")).toBe("numeric");
			expect(ModeDetector.detectMode("0")).toBe("numeric");
			expect(ModeDetector.detectMode("9876543210")).toBe("numeric");
		});

		it("should detect alphanumeric for uppercase and digits", () => {
			expect(ModeDetector.detectMode("ABC123")).toBe("alphanumeric");
			expect(ModeDetector.detectMode("HELLO")).toBe("alphanumeric");
			expect(ModeDetector.detectMode("A")).toBe("alphanumeric");
		});

		it("should detect alphanumeric for valid symbols", () => {
			expect(ModeDetector.detectMode("AC-42")).toBe("alphanumeric");
			expect(ModeDetector.detectMode("50%")).toBe("alphanumeric");
			expect(ModeDetector.detectMode("HELLO WORLD")).toBe("alphanumeric");
		});

		it("should detect byte for lowercase", () => {
			expect(ModeDetector.detectMode("hello")).toBe("byte");
			expect(ModeDetector.detectMode("Hello")).toBe("byte");
		});

		it("should detect byte for invalid symbols", () => {
			expect(ModeDetector.detectMode("test@example.com")).toBe("byte");
			expect(ModeDetector.detectMode("Hello!")).toBe("byte");
		});

		it("should detect byte for empty string", () => {
			expect(ModeDetector.detectMode("")).toBe("byte");
		});
	});

	describe("isNumeric", () => {
		it("should return true for digits only", () => {
			expect(ModeDetector.isNumeric("12345")).toBe(true);
		});

		it("should return false for non-digits", () => {
			expect(ModeDetector.isNumeric("123A")).toBe(false);
			expect(ModeDetector.isNumeric("")).toBe(false);
		});
	});

	describe("isAlphanumeric", () => {
		it("should return true for valid alphanumeric", () => {
			expect(ModeDetector.isAlphanumeric("HELLO123")).toBe(true);
			expect(ModeDetector.isAlphanumeric("A-B")).toBe(true);
		});

		it("should return false for lowercase", () => {
			expect(ModeDetector.isAlphanumeric("hello")).toBe(false);
		});
	});

	describe("getCapacity", () => {
		it("should return correct capacity for numeric mode", () => {
			// Version 1, M level: 34 numeric characters
			expect(ModeDetector.getCapacity(1, "numeric", "M")).toBe(34);
		});

		it("should return correct capacity for alphanumeric mode", () => {
			// Version 1, M level: 20 alphanumeric characters
			expect(ModeDetector.getCapacity(1, "alphanumeric", "M")).toBe(20);
		});

		it("should return correct capacity for byte mode", () => {
			// Version 1, M level: 14 bytes
			expect(ModeDetector.getCapacity(1, "byte", "M")).toBe(14);
		});
	});

	describe("findMinVersion", () => {
		it("should find minimum version for numeric data", () => {
			const version = ModeDetector.findMinVersion("12345", "numeric", "M");
			expect(version).toBe(1);
		});

		it("should find minimum version for large data", () => {
			// 100 digits requires version > 1
			const data = "1234567890".repeat(10);
			const version = ModeDetector.findMinVersion(data, "numeric", "M");
			expect(version).toBeGreaterThan(1);
		});

		it("should return null for data too long", () => {
			// Very long string that exceeds max capacity
			const data = "A".repeat(10000);
			const version = ModeDetector.findMinVersion(data, "byte", "H");
			expect(version).toBeNull();
		});
	});

	describe("findOptimal", () => {
		it("should find optimal mode and version", () => {
			const result = ModeDetector.findOptimal("12345", "M");

			expect(result).not.toBeNull();
			expect(result!.mode).toBe("numeric");
			expect(result!.version).toBe(1);
		});

		it("should select most efficient mode", () => {
			const result = ModeDetector.findOptimal("HELLO", "M");

			expect(result).not.toBeNull();
			expect(result!.mode).toBe("alphanumeric");
		});

		it("should fallback to byte mode when needed", () => {
			const result = ModeDetector.findOptimal("hello@world.com", "M");

			expect(result).not.toBeNull();
			expect(result!.mode).toBe("byte");
		});
	});
});
