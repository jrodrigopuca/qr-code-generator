import { describe, expect, it } from "vitest";
import {
	COMPRESS_ALGORITHM,
	COMPRESS_ENCODING,
	COMPRESS_ERROR_CODE,
	CompressError,
	compress,
	decompress,
	PROTOCOL_VERSION,
	QR_ALPHANUMERIC_CAPACITY,
} from "../src";

describe("compress()", () => {
	it("should return a CompressResult with QP1 header", async () => {
		const result = await compress({ data: "Hello, World!" });
		expect(result.data).toMatch(/^QP1:DF:B45:/);
		expect(result.originalSize).toBeGreaterThan(0);
		expect(result.compressedSize).toBeGreaterThan(0);
		expect(typeof result.ratio).toBe("number");
	});

	it("should return a Promise", () => {
		const result = compress({ data: "test" });
		expect(result).toBeInstanceOf(Promise);
	});

	it("should reject empty string with EMPTY_DATA", async () => {
		await expect(compress({ data: "" })).rejects.toThrow(CompressError);
		try {
			await compress({ data: "" });
		} catch (error) {
			expect((error as CompressError).code).toBe(
				COMPRESS_ERROR_CODE.EMPTY_DATA,
			);
		}
	});

	it("should accept whitespace-only string", async () => {
		const result = await compress({ data: "   " });
		expect(result.data).toMatch(/^QP1:DF:B45:/);
	});

	it("should reject oversized payload with PAYLOAD_TOO_LARGE", async () => {
		// Generate high-entropy data that DEFLATE cannot compress well.
		// Use a simple deterministic PRNG (mulberry32) to produce
		// pseudo-random characters so the output stays above QR capacity.
		const chars = "abcdefghijklmnopqrstuvwxyz0123456789!@#&()[]{}";
		let seed = 42;
		const prng = () => {
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
		let hugeData = "";
		for (let i = 0; i < 20000; i++) {
			hugeData += chars[Math.floor(prng() * chars.length)];
		}

		await expect(compress({ data: hugeData })).rejects.toThrow(CompressError);
		try {
			await compress({ data: hugeData });
		} catch (error) {
			expect((error as CompressError).code).toBe(
				COMPRESS_ERROR_CODE.PAYLOAD_TOO_LARGE,
			);
		}
	});

	it("should compress JSON effectively (output shorter than raw)", async () => {
		const jsonData = JSON.stringify({
			users: Array.from({ length: 20 }, (_, i) => ({
				id: i,
				name: `User ${i}`,
				email: `user${i}@example.com`,
				active: true,
				role: "member",
			})),
		});
		// JSON has lots of repetition — should compress well
		const result = await compress({ data: jsonData });
		expect(result.compressedSize).toBeLessThan(jsonData.length);
	});

	it("should handle small non-repetitive data (may expand)", async () => {
		const result = await compress({
			data: "abcdefghij1234567890",
		});
		// Small data may expand but should still succeed
		expect(result.data).toMatch(/^QP1:DF:B45:/);
	});

	it("should report accurate metadata", async () => {
		const data = "Hello, World!";
		const result = await compress({ data });
		const expectedOriginalSize = new TextEncoder().encode(data).length;
		expect(result.originalSize).toBe(expectedOriginalSize);
		expect(result.compressedSize).toBe(result.data.length);
		expect(result.ratio).toBeCloseTo(
			result.compressedSize / result.originalSize,
			10,
		);
	});
});

describe("decompress()", () => {
	it("should decompress a valid QP1 string", async () => {
		const original = "Hello, World!";
		const compressed = await compress({ data: original });
		const result = await decompress(compressed.data);
		expect(result).toBe(original);
	});

	it("should reject empty string with INVALID_FORMAT", async () => {
		await expect(decompress("")).rejects.toThrow(CompressError);
		try {
			await decompress("");
		} catch (error) {
			expect((error as CompressError).code).toBe(
				COMPRESS_ERROR_CODE.INVALID_FORMAT,
			);
		}
	});

	it("should reject missing QP1 prefix with INVALID_FORMAT", async () => {
		try {
			await decompress("NOT_A_VALID_HEADER:some:data");
		} catch (error) {
			expect(error).toBeInstanceOf(CompressError);
			expect((error as CompressError).code).toBe(
				COMPRESS_ERROR_CODE.INVALID_FORMAT,
			);
		}
	});

	it("should reject incomplete header with INVALID_FORMAT", async () => {
		try {
			await decompress("QP1:DF");
		} catch (error) {
			expect(error).toBeInstanceOf(CompressError);
			expect((error as CompressError).code).toBe(
				COMPRESS_ERROR_CODE.INVALID_FORMAT,
			);
		}
	});

	it("should reject header with empty data with INVALID_FORMAT", async () => {
		try {
			await decompress("QP1:DF:B45:");
		} catch (error) {
			expect(error).toBeInstanceOf(CompressError);
			expect((error as CompressError).code).toBe(
				COMPRESS_ERROR_CODE.INVALID_FORMAT,
			);
		}
	});

	it("should reject unsupported algorithm with UNSUPPORTED_ALGORITHM", async () => {
		try {
			await decompress("QP1:ZSTD:B45:somedata");
		} catch (error) {
			expect(error).toBeInstanceOf(CompressError);
			expect((error as CompressError).code).toBe(
				COMPRESS_ERROR_CODE.UNSUPPORTED_ALGORITHM,
			);
		}
	});

	it("should reject unsupported encoding with UNSUPPORTED_ENCODING", async () => {
		try {
			await decompress("QP1:DF:B64:somedata");
		} catch (error) {
			expect(error).toBeInstanceOf(CompressError);
			expect((error as CompressError).code).toBe(
				COMPRESS_ERROR_CODE.UNSUPPORTED_ENCODING,
			);
		}
	});

	it("should handle corrupted Base45 data with DECOMPRESSION_FAILED", async () => {
		try {
			await decompress("QP1:DF:B45:!!INVALID!!BASE45!!");
		} catch (error) {
			expect(error).toBeInstanceOf(CompressError);
			expect((error as CompressError).code).toBe(
				COMPRESS_ERROR_CODE.DECOMPRESSION_FAILED,
			);
		}
	});

	it("should handle valid Base45 but corrupted DEFLATE with DECOMPRESSION_FAILED", async () => {
		// "BB8" is valid Base45 (decodes to "AB") but not valid DEFLATE data
		try {
			await decompress("QP1:DF:B45:BB8");
		} catch (error) {
			expect(error).toBeInstanceOf(CompressError);
			expect((error as CompressError).code).toBe(
				COMPRESS_ERROR_CODE.DECOMPRESSION_FAILED,
			);
		}
	});
});

describe("round-trip (decompress(compress(x)) === x)", () => {
	it("should round-trip ASCII text", async () => {
		const input = "Hello, World!";
		const compressed = await compress({ data: input });
		const result = await decompress(compressed.data);
		expect(result).toBe(input);
	});

	it("should round-trip JSON payload", async () => {
		const input = JSON.stringify({
			name: "John",
			email: "john@example.com",
			settings: { theme: "dark", notifications: true },
		});
		const compressed = await compress({ data: input });
		const result = await decompress(compressed.data);
		expect(result).toBe(input);
	});

	it("should round-trip Unicode content", async () => {
		const input = "Café ☕ üñîcödé 🚀";
		const compressed = await compress({ data: input });
		const result = await decompress(compressed.data);
		expect(result).toBe(input);
	});

	it("should round-trip CJK characters", async () => {
		const input = "你好世界";
		const compressed = await compress({ data: input });
		const result = await decompress(compressed.data);
		expect(result).toBe(input);
	});

	it("should round-trip large repetitive payload", async () => {
		const input = JSON.stringify(
			Array.from({ length: 50 }, (_, i) => ({
				id: i,
				name: `User ${i}`,
				email: `user${i}@example.com`,
			})),
		);
		const compressed = await compress({ data: input });
		const result = await decompress(compressed.data);
		expect(result).toBe(input);
	});

	it("should round-trip whitespace-only content", async () => {
		const input = "   \t\n   ";
		const compressed = await compress({ data: input });
		const result = await decompress(compressed.data);
		expect(result).toBe(input);
	});

	it("should round-trip special characters", async () => {
		const input = "<script>alert('xss');</script>\n\r\t";
		const compressed = await compress({ data: input });
		const result = await decompress(compressed.data);
		expect(result).toBe(input);
	});

	it("should round-trip data containing colons", async () => {
		// Colons are in Base45 charset — verify header parsing works
		const input = "key1:value1:key2:value2:key3:value3";
		const compressed = await compress({ data: input });
		const result = await decompress(compressed.data);
		expect(result).toBe(input);
	});

	it("should round-trip a URL", async () => {
		const input = "https://example.com/path?query=value&foo=bar#section";
		const compressed = await compress({ data: input });
		const result = await decompress(compressed.data);
		expect(result).toBe(input);
	});
});

describe("CompressError", () => {
	it("should be an instance of Error", () => {
		const error = new CompressError(COMPRESS_ERROR_CODE.EMPTY_DATA, "test");
		expect(error).toBeInstanceOf(Error);
	});

	it("should have correct code and name properties", () => {
		const error = new CompressError(
			COMPRESS_ERROR_CODE.PAYLOAD_TOO_LARGE,
			"Output exceeds QR capacity",
		);
		expect(error.code).toBe("PAYLOAD_TOO_LARGE");
		expect(error.name).toBe("CompressError");
		expect(error.message).toBe("Output exceeds QR capacity");
	});

	it("should define all 7 error codes", () => {
		const codes = Object.keys(COMPRESS_ERROR_CODE);
		expect(codes).toHaveLength(7);
		expect(codes).toContain("EMPTY_DATA");
		expect(codes).toContain("PAYLOAD_TOO_LARGE");
		expect(codes).toContain("COMPRESSION_FAILED");
		expect(codes).toContain("DECOMPRESSION_FAILED");
		expect(codes).toContain("INVALID_FORMAT");
		expect(codes).toContain("UNSUPPORTED_ALGORITHM");
		expect(codes).toContain("UNSUPPORTED_ENCODING");
	});

	it("should have values matching key names", () => {
		for (const [key, value] of Object.entries(COMPRESS_ERROR_CODE)) {
			expect(value).toBe(key);
		}
	});
});

describe("constants", () => {
	it("should have COMPRESS_ALGORITHM.DEFLATE === 'DF'", () => {
		expect(COMPRESS_ALGORITHM.DEFLATE).toBe("DF");
	});

	it("should have COMPRESS_ENCODING.BASE45 === 'B45'", () => {
		expect(COMPRESS_ENCODING.BASE45).toBe("B45");
	});

	it("should have PROTOCOL_VERSION === 'QP1'", () => {
		expect(PROTOCOL_VERSION).toBe("QP1");
	});

	it("should have QR_ALPHANUMERIC_CAPACITY === 4296", () => {
		expect(QR_ALPHANUMERIC_CAPACITY).toBe(4296);
	});
});
