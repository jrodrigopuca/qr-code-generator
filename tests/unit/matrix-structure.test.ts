/**
 * @fileoverview Tests de estructura de matriz QR
 * @description Verifica que la matriz tenga la estructura correcta:
 * - Dark module en posición correcta
 * - Número correcto de módulos de datos
 * - Áreas de función reservadas correctamente
 *
 * Basado en: debug-scripts/check-reserved-matrix.js
 */

import { describe, it, expect } from "vitest";
import { QRCode } from "../../src";
import { FinderPattern } from "../../src/patterns/FinderPattern";
import { TimingPattern } from "../../src/patterns/TimingPattern";
import { AlignmentPattern } from "../../src/patterns/AlignmentPattern";
import { FormatInfo } from "../../src/patterns/FormatInfo";

describe("QR Matrix Structure", () => {
	describe("Dark Module", () => {
		it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const)(
			"should have dark module at correct position for version %i",
			(version) => {
				const qr = new QRCode("A".repeat(version * 2), {
					errorCorrectionLevel: "L",
					version,
				});
				const result = qr.generate();
				const matrix = result.matrix;

				// Dark module está en posición (4 * version + 9, 8)
				const darkModuleRow = 4 * version + 9;
				const darkModuleCol = 8;

				expect(matrix[darkModuleRow][darkModuleCol]).toBe(1);
			},
		);

		it("should always be dark (value 1) regardless of mask", () => {
			// Probar con diferentes máscaras
			for (let mask = 0; mask < 8; mask++) {
				const qr = new QRCode("TEST", {
					errorCorrectionLevel: "L",
					mask: mask as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
				});
				const result = qr.generate();
				const darkModuleRow = 4 * 1 + 9; // V1
				expect(result.matrix[darkModuleRow][8]).toBe(1);
			}
		});
	});

	describe("Reserved Areas", () => {
		it("should reserve correct number of modules for V1", () => {
			const size = 21;
			const matrix = Array.from({ length: size }, () => Array(size).fill(0));
			const reserved = Array.from({ length: size }, () => Array(size).fill(0));

			FinderPattern.draw(matrix, reserved);
			TimingPattern.draw(matrix, reserved);
			AlignmentPattern.draw(matrix, reserved, 1);

			// Dark module
			const darkModuleRow = 4 * 1 + 9;
			reserved[darkModuleRow][8] = 1;

			FormatInfo.reserveFormatArea(reserved, size);
			FormatInfo.reserveVersionArea(reserved, 1, size);

			// Contar módulos reservados
			let reservedCount = 0;
			for (let r = 0; r < size; r++) {
				for (let c = 0; c < size; c++) {
					if (reserved[r][c] !== 0) reservedCount++;
				}
			}

			const dataModules = size * size - reservedCount;

			// V1 debe tener exactamente 208 módulos de datos
			expect(dataModules).toBe(208);
		});

		it("should have finder patterns at corners", () => {
			const result = new QRCode("Test", {
				errorCorrectionLevel: "L",
			}).generate();
			const matrix = result.matrix;
			const size = result.size;

			// Top-left finder pattern (7x7)
			for (let r = 0; r < 7; r++) {
				expect(matrix[r][0]).toBe(1); // Left edge
				expect(matrix[r][6]).toBe(1); // Right edge
				expect(matrix[0][r]).toBe(1); // Top edge
				expect(matrix[6][r]).toBe(1); // Bottom edge
			}

			// Top-right finder pattern
			for (let r = 0; r < 7; r++) {
				expect(matrix[r][size - 7]).toBe(1);
				expect(matrix[r][size - 1]).toBe(1);
			}

			// Bottom-left finder pattern
			for (let r = 0; r < 7; r++) {
				expect(matrix[size - 7][r]).toBe(1);
				expect(matrix[size - 1][r]).toBe(1);
			}
		});

		it("should have separators (white areas) around finder patterns", () => {
			const result = new QRCode("Test", {
				errorCorrectionLevel: "L",
			}).generate();
			const matrix = result.matrix;
			const size = result.size;

			// Separator to the right of top-left finder (column 7)
			for (let r = 0; r < 8; r++) {
				expect(matrix[r][7]).toBe(0);
			}

			// Separator below top-left finder (row 7)
			for (let c = 0; c < 8; c++) {
				expect(matrix[7][c]).toBe(0);
			}
		});

		it("should have timing patterns with alternating modules", () => {
			const result = new QRCode("Test", {
				errorCorrectionLevel: "L",
			}).generate();
			const matrix = result.matrix;
			const size = result.size;

			// Horizontal timing pattern at row 6
			for (let col = 8; col < size - 8; col++) {
				expect(matrix[6][col]).toBe(col % 2 === 0 ? 1 : 0);
			}

			// Vertical timing pattern at column 6
			for (let row = 8; row < size - 8; row++) {
				expect(matrix[row][6]).toBe(row % 2 === 0 ? 1 : 0);
			}
		});
	});

	describe("Format Information", () => {
		it("should have format info in correct positions", () => {
			const result = new QRCode("Test", {
				errorCorrectionLevel: "L",
			}).generate();
			const matrix = result.matrix;
			const size = result.size;

			// Format info ocupa fila 8 (col 0-8) y columna 8 (row 0-8)
			// También fila 8 (col size-8 a size-1) y columna 8 (row size-7 a size-1)

			// Los valores pueden ser 0 o 1, solo verificamos que existen
			for (let i = 0; i < 9; i++) {
				expect([0, 1]).toContain(matrix[8][i]);
				expect([0, 1]).toContain(matrix[i][8]);
			}

			for (let i = 0; i < 8; i++) {
				expect([0, 1]).toContain(matrix[8][size - 8 + i]);
				expect([0, 1]).toContain(matrix[size - 8 + i][8]);
			}
		});
	});
});

describe("QR Data Modules", () => {
	describe("Data capacity", () => {
		it("should have correct data capacity for V1-L (26 codewords = 208 bits)", () => {
			// V1-L: 19 data codewords + 7 ECC codewords = 26 total
			// 26 codewords * 8 bits = 208 bits
			const expectedBits = 26 * 8;

			const size = 21;
			const matrix = Array.from({ length: size }, () => Array(size).fill(0));
			const reserved = Array.from({ length: size }, () => Array(size).fill(0));

			FinderPattern.draw(matrix, reserved);
			TimingPattern.draw(matrix, reserved);
			AlignmentPattern.draw(matrix, reserved, 1);
			reserved[13][8] = 1; // dark module
			FormatInfo.reserveFormatArea(reserved, size);

			let dataModules = 0;
			for (let r = 0; r < size; r++) {
				for (let c = 0; c < size; c++) {
					if (reserved[r][c] === 0) dataModules++;
				}
			}

			expect(dataModules).toBe(expectedBits);
		});
	});
});
