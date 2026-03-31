/**
 * @fileoverview Tests de integración para generación completa de códigos QR
 */

import { describe, it, expect } from "vitest";
import { QRCode, generateQR, renderToSVG, SVGRenderer } from "../../src";

describe("QR Code Generation - Integration", () => {
	describe("generateQR helper", () => {
		it("should generate valid QR for simple text", () => {
			const result = generateQR("Hello World");

			expect(result.version).toBeGreaterThanOrEqual(1);
			expect(result.version).toBeLessThanOrEqual(40);
			expect(result.size).toBe((result.version - 1) * 4 + 21);
			expect(result.matrix).toHaveLength(result.size);
			expect(result.matrix[0]).toHaveLength(result.size);
		});

		it("should generate version 1 for short text", () => {
			const result = generateQR("Hi");

			expect(result.version).toBe(1);
			expect(result.size).toBe(21);
		});

		it("should auto-select higher version for long text", () => {
			const longText = "A".repeat(100);
			const result = generateQR(longText);

			expect(result.version).toBeGreaterThan(1);
		});

		it("should respect error correction level", () => {
			const resultL = generateQR("Test", { errorCorrectionLevel: "L" });
			const resultH = generateQR("Test", { errorCorrectionLevel: "H" });

			expect(resultL.errorCorrectionLevel).toBe("L");
			expect(resultH.errorCorrectionLevel).toBe("H");
		});

		it("should handle URL encoding", () => {
			const result = generateQR("https://example.com/path?query=value");

			expect(result.version).toBeGreaterThanOrEqual(1);
			expect(result.matrix.length).toBe(result.size);
		});

		it("should handle UTF-8 text", () => {
			const result = generateQR("Héllo Wörld");

			expect(result.version).toBeGreaterThanOrEqual(1);
			expect(result.matrix).toBeDefined();
		});
	});

	describe("QRCode class", () => {
		it("should create instance with default options", () => {
			const qr = new QRCode("Test");
			const result = qr.generate();

			expect(result.errorCorrectionLevel).toBe("M"); // default
			expect(result.version).toBeGreaterThanOrEqual(1);
		});

		it("should create instance with specified version", () => {
			const qr = new QRCode("Hi", { version: 5 });
			const result = qr.generate();

			expect(result.version).toBe(5);
			expect(result.size).toBe(37); // (5-1)*4 + 21
		});

		it("should throw error for empty content", () => {
			expect(() => new QRCode("")).toThrow();
		});

		it("should generate deterministic results", () => {
			const qr1 = new QRCode("Test", { mask: 3 });
			const qr2 = new QRCode("Test", { mask: 3 });

			const result1 = qr1.generate();
			const result2 = qr2.generate();

			expect(result1.matrix).toEqual(result2.matrix);
		});
	});

	describe("Matrix structure", () => {
		it("should have finder patterns in corners", () => {
			const result = generateQR("Test");
			const matrix = result.matrix;
			const size = result.size;

			// Top-left corner should have dark module at (0,0)
			expect(matrix[0][0]).toBe(1);

			// Top-right corner finder pattern
			expect(matrix[0][size - 7]).toBe(1);
			expect(matrix[0][size - 1]).toBe(1);

			// Bottom-left corner finder pattern
			expect(matrix[size - 7][0]).toBe(1);
			expect(matrix[size - 1][0]).toBe(1);
		});

		it("should have timing patterns", () => {
			const result = generateQR("Test");
			const matrix = result.matrix;

			// Horizontal timing pattern at row 6
			// Vertical timing pattern at col 6
			// They alternate between dark and light
			// Position (6, 8) and (8, 6) should follow timing pattern
			expect(matrix[6][8]).toBeDefined();
			expect(matrix[8][6]).toBeDefined();
		});

		it("should contain only 0s and 1s", () => {
			const result = generateQR("Hello World");

			result.matrix.forEach((row) => {
				row.forEach((cell) => {
					expect(cell === 0 || cell === 1).toBe(true);
				});
			});
		});
	});

	describe("Version selection", () => {
		it("should select version 1 for very short content", () => {
			const result = generateQR("A", { errorCorrectionLevel: "L" });
			expect(result.version).toBe(1);
		});

		it("should increase version for more data", () => {
			const short = generateQR("ABC");
			const longer = generateQR("A".repeat(50));

			expect(longer.version).toBeGreaterThan(short.version);
		});

		it("should select higher version for higher ECC", () => {
			const text = "A".repeat(20);
			const lowEcc = generateQR(text, { errorCorrectionLevel: "L" });
			const highEcc = generateQR(text, { errorCorrectionLevel: "H" });

			// Higher ECC might need higher version for same data
			expect(highEcc.version).toBeGreaterThanOrEqual(lowEcc.version);
		});
	});

	describe("SVG Rendering", () => {
		it("should generate valid SVG string", () => {
			const svg = renderToSVG("Test");

			expect(svg).toContain("<svg");
			expect(svg).toContain("</svg>");
			expect(svg).toContain("xmlns=");
			expect(svg).toContain("viewBox=");
		});

		it("should respect scale option", () => {
			const svg5 = renderToSVG("Test", { scale: 5 });
			const svg10 = renderToSVG("Test", { scale: 10 });

			// Larger scale should produce larger SVG
			expect(svg10.length).toBeGreaterThan(svg5.length);
		});

		it("should respect color options", () => {
			const svg = renderToSVG("Test", {
				darkColor: "#FF0000",
				lightColor: "#00FF00",
			});

			expect(svg).toContain("#FF0000");
			expect(svg).toContain("#00FF00");
		});
	});

	describe("SVGRenderer class", () => {
		it("should render matrix to SVG", () => {
			const qr = new QRCode("Test");
			const result = qr.generate();
			const svg = SVGRenderer.render(result.matrix);

			expect(svg).toContain("<svg");
			expect(svg.includes("<path") || svg.includes("<rect")).toBe(true);
		});

		it("should generate optimized path by default", () => {
			const qr = new QRCode("Test");
			const result = qr.generate();
			const svg = SVGRenderer.render(result.matrix);

			// Optimized version uses path instead of individual rects
			expect(svg).toContain("<path");
		});

		it("should generate individual rects when optimization disabled", () => {
			const qr = new QRCode("Test");
			const result = qr.generate();
			const svg = SVGRenderer.render(result.matrix, { optimizePaths: false });

			// Non-optimized uses rect elements
			expect(svg).toContain("<rect");
			// Should have multiple rect elements for dark modules
			const rectCount = (svg.match(/<rect/g) || []).length;
			expect(rectCount).toBeGreaterThan(1);
		});

		it("should support data URL generation", () => {
			const qr = new QRCode("Test");
			const result = qr.generate();
			const dataUrl = SVGRenderer.toDataURL(result.matrix);

			expect(dataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
		});
	});

	describe("Error handling", () => {
		it("should throw for empty content", () => {
			expect(() => generateQR("")).toThrow();
		});

		it("should handle maximum capacity", () => {
			// Version 40-L can hold about 2953 bytes
			const nearMax = "A".repeat(2000);
			const result = generateQR(nearMax, { errorCorrectionLevel: "L" });

			expect(result.version).toBeGreaterThan(20);
		});
	});

	describe("Real-world use cases", () => {
		it("should encode phone number", () => {
			const result = generateQR("tel:+1234567890");
			expect(result.version).toBeGreaterThanOrEqual(1);
		});

		it("should encode email", () => {
			const result = generateQR("mailto:test@example.com");
			expect(result.version).toBeGreaterThanOrEqual(1);
		});

		it("should encode WiFi config", () => {
			const wifi = "WIFI:T:WPA;S:MyNetwork;P:MyPassword;;";
			const result = generateQR(wifi);
			expect(result.version).toBeGreaterThanOrEqual(1);
		});

		it("should encode vCard", () => {
			const vcard = `BEGIN:VCARD
VERSION:3.0
N:Doe;John
FN:John Doe
TEL:+1234567890
END:VCARD`;
			const result = generateQR(vcard);
			expect(result.version).toBeGreaterThanOrEqual(1);
		});
	});

	describe("Encoding modes", () => {
		it("should auto-detect numeric mode for digits", () => {
			const result = generateQR("1234567890");

			expect(result.mode).toBe("numeric");
			expect(result.version).toBe(1);
		});

		it("should auto-detect alphanumeric mode for uppercase", () => {
			const result = generateQR("HELLO WORLD");

			expect(result.mode).toBe("alphanumeric");
		});

		it("should auto-detect byte mode for lowercase", () => {
			const result = generateQR("hello world");

			expect(result.mode).toBe("byte");
		});

		it("should use specified mode when valid", () => {
			const qr = new QRCode("12345", { mode: "byte" });
			const result = qr.generate();

			// Should use byte even though numeric would work
			expect(result.mode).toBe("byte");
		});

		it("should throw for invalid mode", () => {
			// Trying to use numeric mode for text with letters
			expect(() => new QRCode("ABC", { mode: "numeric" })).toThrow();
		});

		it("should optimize capacity with numeric mode", () => {
			// Long numeric string should fit in smaller version with numeric mode
			const digits = "1234567890".repeat(3); // 30 digits
			const result = generateQR(digits);

			expect(result.mode).toBe("numeric");
			expect(result.version).toBe(1); // 34 digits fit in v1-M numeric
		});

		it("should optimize capacity with alphanumeric mode", () => {
			// Uppercase text should use alphanumeric
			const text = "ABCDEFGHIJKLMNOP"; // 16 chars
			const result = generateQR(text);

			expect(result.mode).toBe("alphanumeric");
			expect(result.version).toBe(1); // 20 chars fit in v1-M alphanumeric
		});

		it("should include mode in result", () => {
			const result = generateQR("Test");

			expect(result.mode).toBeDefined();
			expect(["numeric", "alphanumeric", "byte"]).toContain(result.mode);
		});

		it("should generate valid QR with alphanumeric symbols", () => {
			const result = generateQR("AC-42/CODE:123");

			expect(result.mode).toBe("alphanumeric");
			expect(result.matrix).toBeDefined();
		});

		it("should handle URL with uppercase optimization", () => {
			// URLs are case-insensitive for domain, uppercase can use alphanumeric
			const result = generateQR("HTTPS://EXAMPLE.COM/TEST");

			expect(result.mode).toBe("alphanumeric");
		});
	});
});
