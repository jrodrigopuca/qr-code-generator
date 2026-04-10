import { describe, expect, it } from "vitest";
import { base45Decode, base45Encode } from "../src/base45";

describe("Base45 Codec", () => {
	describe("base45Encode", () => {
		it("should encode RFC 9285 test vector: 'AB' → 'BB8'", () => {
			const input = new TextEncoder().encode("AB");
			expect(base45Encode(input)).toBe("BB8");
		});

		it("should encode RFC 9285 test vector: 'Hello!!' → '%69 VD92EX0'", () => {
			const input = new TextEncoder().encode("Hello!!");
			expect(base45Encode(input)).toBe("%69 VD92EX0");
		});

		it("should encode RFC 9285 test vector: 'base-45' → 'UJCLQE7W581'", () => {
			const input = new TextEncoder().encode("base-45");
			expect(base45Encode(input)).toBe("UJCLQE7W581");
		});

		it("should return empty string for empty input", () => {
			expect(base45Encode(new Uint8Array(0))).toBe("");
		});

		it("should produce 2 chars for a single byte", () => {
			const input = new Uint8Array([42]);
			const result = base45Encode(input);
			expect(result).toHaveLength(2);
		});

		it("should produce 3 chars for two bytes", () => {
			const input = new Uint8Array([0, 1]);
			const result = base45Encode(input);
			expect(result).toHaveLength(3);
		});

		it("should only produce QR-alphanumeric characters", () => {
			// Test with all possible byte values
			const input = new Uint8Array(256);
			for (let i = 0; i < 256; i++) input[i] = i;

			const result = base45Encode(input);
			expect(result).toMatch(/^[0-9A-Z $%*+\-./:]*$/);
		});
	});

	describe("base45Decode", () => {
		it("should decode RFC 9285 test vector: 'BB8' → 'AB'", () => {
			const result = base45Decode("BB8");
			const text = new TextDecoder().decode(result);
			expect(text).toBe("AB");
		});

		it("should decode RFC 9285 test vector: '%69 VD92EX0' → 'Hello!!'", () => {
			const result = base45Decode("%69 VD92EX0");
			const text = new TextDecoder().decode(result);
			expect(text).toBe("Hello!!");
		});

		it("should decode RFC 9285 test vector: 'UJCLQE7W581' → 'base-45'", () => {
			const result = base45Decode("UJCLQE7W581");
			const text = new TextDecoder().decode(result);
			expect(text).toBe("base-45");
		});

		it("should return empty Uint8Array for empty string", () => {
			const result = base45Decode("");
			expect(result).toEqual(new Uint8Array(0));
		});

		it("should throw on invalid characters", () => {
			expect(() => base45Decode("abc!")).toThrow(/Invalid Base45 character/);
		});

		it("should throw on invalid string length (remainder 1)", () => {
			expect(() => base45Decode("A")).toThrow(/Invalid Base45 string length/);
		});

		it("should throw on out-of-range triplet value", () => {
			// ":::" would be index 44, 44, 44 → 44 + 44*45 + 44*2025 = 91124 > 65535
			expect(() => base45Decode(":::")).toThrow(/out of range/);
		});

		it("should throw on out-of-range pair value", () => {
			// We need a pair where c + d*45 > 255
			// index 44 (:) + 44*45 = 44 + 1980 = 2024 > 255
			expect(() => base45Decode("::")).toThrow(/out of range/);
		});
	});

	describe("round-trip", () => {
		it("should round-trip arbitrary binary data", () => {
			const input = new Uint8Array([0, 1, 127, 128, 254, 255, 42, 99, 200]);
			const encoded = base45Encode(input);
			const decoded = base45Decode(encoded);
			expect(decoded).toEqual(input);
		});

		it("should round-trip all 256 byte values", () => {
			const input = new Uint8Array(256);
			for (let i = 0; i < 256; i++) input[i] = i;

			const encoded = base45Encode(input);
			const decoded = base45Decode(encoded);
			expect(decoded).toEqual(input);
		});

		it("should round-trip empty data", () => {
			const input = new Uint8Array(0);
			const encoded = base45Encode(input);
			const decoded = base45Decode(encoded);
			expect(decoded).toEqual(input);
		});

		it("should round-trip single byte", () => {
			for (let b = 0; b < 256; b++) {
				const input = new Uint8Array([b]);
				const encoded = base45Encode(input);
				const decoded = base45Decode(encoded);
				expect(decoded).toEqual(input);
			}
		});

		it("should round-trip 100 random bytes", () => {
			const input = new Uint8Array(100);
			for (let i = 0; i < 100; i++) input[i] = Math.floor(Math.random() * 256);

			const encoded = base45Encode(input);
			const decoded = base45Decode(encoded);
			expect(decoded).toEqual(input);
		});

		it("should round-trip text encoded as UTF-8", () => {
			const text = "Hello, World! 🌍";
			const input = new TextEncoder().encode(text);
			const encoded = base45Encode(input);
			const decoded = base45Decode(encoded);
			const result = new TextDecoder().decode(decoded);
			expect(result).toBe(text);
		});
	});
});
