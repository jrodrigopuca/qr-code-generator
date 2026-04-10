import { describe, expect, it } from "vitest";
import { deflateRaw, inflateRaw } from "../src/deflate";
import { CompressError } from "../src/errors";

describe("DEFLATE Adapter", () => {
	describe("deflateRaw", () => {
		it("should return a Uint8Array for valid input", async () => {
			const input = new TextEncoder().encode("Hello, World!");
			const result = await deflateRaw(input);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBeGreaterThan(0);
		});

		it("should produce valid output for empty input", async () => {
			const input = new Uint8Array(0);
			const result = await deflateRaw(input);
			expect(result).toBeInstanceOf(Uint8Array);
			// DEFLATE has overhead even for empty data
			expect(result.length).toBeGreaterThan(0);
		});

		it("should compress repetitive data effectively", async () => {
			const text = "AAAA".repeat(500);
			const input = new TextEncoder().encode(text);
			const result = await deflateRaw(input);
			expect(result.length).toBeLessThan(input.length);
		});
	});

	describe("inflateRaw", () => {
		it("should decompress output from deflateRaw", async () => {
			const original = new TextEncoder().encode("Hello, World!");
			const compressed = await deflateRaw(original);
			const decompressed = await inflateRaw(compressed);
			expect(decompressed).toEqual(original);
		});

		it("should throw CompressError on corrupted data", async () => {
			const corrupted = new Uint8Array([0, 1, 2, 3, 4, 5]);
			await expect(inflateRaw(corrupted)).rejects.toThrow(CompressError);
		});

		it("should throw with DECOMPRESSION_FAILED error code", async () => {
			const corrupted = new Uint8Array([255, 254, 253]);
			try {
				await inflateRaw(corrupted);
				expect.unreachable("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(CompressError);
				expect((error as CompressError).code).toBe("DECOMPRESSION_FAILED");
			}
		});
	});

	describe("round-trip", () => {
		it("should round-trip short text", async () => {
			const text = "Short text for testing";
			const input = new TextEncoder().encode(text);
			const compressed = await deflateRaw(input);
			const decompressed = await inflateRaw(compressed);
			expect(new TextDecoder().decode(decompressed)).toBe(text);
		});

		it("should round-trip large repetitive data", async () => {
			const text = "Hello World! ".repeat(200);
			const input = new TextEncoder().encode(text);
			const compressed = await deflateRaw(input);
			const decompressed = await inflateRaw(compressed);
			expect(new TextDecoder().decode(decompressed)).toBe(text);
		});

		it("should round-trip Unicode text", async () => {
			const text = "Café ☕ 日本語 🚀 مرحبا";
			const input = new TextEncoder().encode(text);
			const compressed = await deflateRaw(input);
			const decompressed = await inflateRaw(compressed);
			expect(new TextDecoder().decode(decompressed)).toBe(text);
		});

		it("should round-trip binary data with all byte values", async () => {
			const input = new Uint8Array(256);
			for (let i = 0; i < 256; i++) input[i] = i;
			const compressed = await deflateRaw(input);
			const decompressed = await inflateRaw(compressed);
			expect(decompressed).toEqual(input);
		});
	});
});
