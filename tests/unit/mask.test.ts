/**
 * @fileoverview Tests unitarios para MaskEvaluator
 */

import { describe, it, expect } from "vitest";
import { MaskEvaluator } from "../../src/mask/MaskEvaluator";
import type { MaskPattern } from "../../src/types";

describe("MaskEvaluator", () => {
	// Helper to create a test matrix
	function createTestMatrix(size: number): number[][] {
		return Array.from({ length: size }, () => Array(size).fill(0));
	}

	// Helper to create a reserved matrix
	function createReservedMatrix(size: number): number[][] {
		return Array.from({ length: size }, () => Array(size).fill(0));
	}

	describe("apply", () => {
		it("should apply mask pattern 0: (row + col) % 2 === 0", () => {
			const matrix = createTestMatrix(4);
			const reserved = createReservedMatrix(4);

			MaskEvaluator.apply(matrix, reserved, 0);

			// Pattern 0: should flip when (row + col) % 2 === 0
			expect(matrix[0][0]).toBe(1); // 0+0=0, 0%2=0, flip
			expect(matrix[0][1]).toBe(0); // 0+1=1, 1%2≠0, no flip
			expect(matrix[1][0]).toBe(0); // 1+0=1, 1%2≠0, no flip
			expect(matrix[1][1]).toBe(1); // 1+1=2, 2%2=0, flip
		});

		it("should apply mask pattern 1: row % 2 === 0", () => {
			const matrix = createTestMatrix(4);
			const reserved = createReservedMatrix(4);

			MaskEvaluator.apply(matrix, reserved, 1);

			// Pattern 1: should flip when row % 2 === 0
			expect(matrix[0][0]).toBe(1); // row 0, 0%2=0, flip
			expect(matrix[0][1]).toBe(1); // row 0, 0%2=0, flip
			expect(matrix[1][0]).toBe(0); // row 1, 1%2≠0, no flip
			expect(matrix[1][1]).toBe(0); // row 1, 1%2≠0, no flip
		});

		it("should apply mask pattern 2: col % 3 === 0", () => {
			const matrix = createTestMatrix(6);
			const reserved = createReservedMatrix(6);

			MaskEvaluator.apply(matrix, reserved, 2);

			// Pattern 2: should flip when col % 3 === 0
			expect(matrix[0][0]).toBe(1); // col 0, 0%3=0, flip
			expect(matrix[0][1]).toBe(0); // col 1, 1%3≠0, no flip
			expect(matrix[0][2]).toBe(0); // col 2, 2%3≠0, no flip
			expect(matrix[0][3]).toBe(1); // col 3, 3%3=0, flip
		});

		it("should not modify reserved modules", () => {
			const matrix = createTestMatrix(4);
			const reserved = createReservedMatrix(4);

			// Mark some cells as reserved
			reserved[0][0] = 1;
			reserved[1][1] = 1;
			matrix[0][0] = 1; // pre-set to 1

			MaskEvaluator.apply(matrix, reserved, 0);

			// Reserved cells should not change
			expect(matrix[0][0]).toBe(1); // was 1, reserved, stays 1
			expect(matrix[1][1]).toBe(0); // was 0, reserved, stays 0
		});

		it("should toggle existing 1s to 0s when mask applies", () => {
			const matrix = createTestMatrix(4);
			const reserved = createReservedMatrix(4);

			// Pre-fill with 1s
			matrix[0][0] = 1;
			matrix[0][2] = 1;

			MaskEvaluator.apply(matrix, reserved, 0);

			// XOR behavior: 1 XOR 1 = 0
			expect(matrix[0][0]).toBe(0); // was 1, mask flips, now 0
			expect(matrix[0][2]).toBe(0); // was 1, mask flips, now 0
		});
	});

	describe("findBestMask", () => {
		it("should return a valid mask pattern (0-7)", () => {
			const matrix = createTestMatrix(21);
			const reserved = createReservedMatrix(21);

			const best = MaskEvaluator.findBestMask(matrix, reserved);

			expect(best).toBeGreaterThanOrEqual(0);
			expect(best).toBeLessThanOrEqual(7);
		});

		it("should be deterministic for same input", () => {
			const matrix = createTestMatrix(21);
			const reserved = createReservedMatrix(21);

			// Set some pattern
			for (let i = 0; i < 21; i++) {
				matrix[i][i] = 1;
			}

			const best1 = MaskEvaluator.findBestMask(matrix, reserved);
			const best2 = MaskEvaluator.findBestMask(matrix, reserved);

			expect(best1).toBe(best2);
		});
	});

	describe("calculatePenalty", () => {
		it("should calculate penalty for empty matrix", () => {
			const matrix = createTestMatrix(21);

			// All zeros - rule 4 penalty for 100% dark ratio imbalance
			const penalty = MaskEvaluator.calculatePenalty(matrix);

			expect(penalty).toBeGreaterThanOrEqual(0);
		});

		it("should calculate penalty for all-dark matrix", () => {
			const matrix = createTestMatrix(21);
			for (let i = 0; i < 21; i++) {
				for (let j = 0; j < 21; j++) {
					matrix[i][j] = 1;
				}
			}

			const penalty = MaskEvaluator.calculatePenalty(matrix);

			// Should have high penalty due to rule 4 (dark ratio)
			// and rule 1/2 (consecutive/blocks)
			expect(penalty).toBeGreaterThan(0);
		});

		it("should give lower penalty for checkerboard pattern", () => {
			const matrix1 = createTestMatrix(21);
			const matrix2 = createTestMatrix(21);

			// Checkerboard pattern (good)
			for (let i = 0; i < 21; i++) {
				for (let j = 0; j < 21; j++) {
					matrix1[i][j] = (i + j) % 2;
				}
			}

			// All same color (bad)
			for (let i = 0; i < 21; i++) {
				for (let j = 0; j < 21; j++) {
					matrix2[i][j] = 1;
				}
			}

			const penalty1 = MaskEvaluator.calculatePenalty(matrix1);
			const penalty2 = MaskEvaluator.calculatePenalty(matrix2);

			expect(penalty1).toBeLessThan(penalty2);
		});
	});

	describe("penalty rules", () => {
		describe("rule 1 - consecutive modules", () => {
			it("should penalize 5+ consecutive same color modules", () => {
				const matrix = createTestMatrix(21);
				// Create 7 consecutive dark modules horizontally
				for (let i = 0; i < 7; i++) {
					matrix[0][i] = 1;
				}

				const penalty = MaskEvaluator.calculatePenalty(matrix);

				// Should have penalty from rule 1
				expect(penalty).toBeGreaterThan(0);
			});
		});

		describe("rule 2 - 2x2 blocks", () => {
			it("should penalize 2x2 blocks of same color", () => {
				const matrix = createTestMatrix(21);
				// Create 2x2 dark block
				matrix[0][0] = 1;
				matrix[0][1] = 1;
				matrix[1][0] = 1;
				matrix[1][1] = 1;

				const penalty = MaskEvaluator.calculatePenalty(matrix);

				expect(penalty).toBeGreaterThan(0);
			});
		});
	});

	describe("all mask patterns", () => {
		const patterns: MaskPattern[] = [0, 1, 2, 3, 4, 5, 6, 7];

		patterns.forEach((pattern) => {
			it(`should correctly apply mask pattern ${pattern}`, () => {
				const matrix = createTestMatrix(21);
				const reserved = createReservedMatrix(21);

				// Should not throw
				expect(() =>
					MaskEvaluator.apply(matrix, reserved, pattern),
				).not.toThrow();

				// Matrix should be modified (at least some cells flipped)
				const hasFlipped = matrix.some((row) => row.some((cell) => cell === 1));
				expect(hasFlipped).toBe(true);
			});
		});
	});
});
