/**
 * @fileoverview Tests unitarios para ByteEncoder
 */

import { describe, it, expect } from "vitest";
import { ByteEncoder } from "../../src/encoder/ByteEncoder";

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
