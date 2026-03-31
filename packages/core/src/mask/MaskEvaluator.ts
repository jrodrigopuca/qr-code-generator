/**
 * @fileoverview Evaluador de máscaras para códigos QR
 * @description Implementa las 8 funciones de máscara y evaluación de penalización.
 * @module mask/MaskEvaluator
 * @see {@link https://www.thonky.com/qr-code-tutorial/mask-patterns}
 */

import type { MaskPattern } from "../types";

/**
 * Clase para aplicar y evaluar patrones de máscara.
 *
 * @description Los patrones de máscara se aplican a los módulos de datos
 * para mejorar la legibilidad del código QR. El estándar define 8 patrones,
 * y se debe seleccionar el que resulte en la menor penalización.
 *
 * Las funciones de máscara determinan qué módulos invertir:
 * - 0: (row + col) % 2 === 0
 * - 1: row % 2 === 0
 * - 2: col % 3 === 0
 * - 3: (row + col) % 3 === 0
 * - 4: (Math.floor(row/2) + Math.floor(col/3)) % 2 === 0
 * - 5: (row * col) % 2 + (row * col) % 3 === 0
 * - 6: ((row * col) % 2 + (row * col) % 3) % 2 === 0
 * - 7: ((row + col) % 2 + (row * col) % 3) % 2 === 0
 *
 * @example
 * ```typescript
 * const bestMask = MaskEvaluator.findBestMask(matrix, reserved);
 * MaskEvaluator.apply(matrix, reserved, bestMask);
 * ```
 */
export class MaskEvaluator {
	/**
	 * Funciones de máscara según el estándar ISO/IEC 18004.
	 *
	 * @description Cada función retorna true si el módulo debe invertirse.
	 */
	private static readonly MASK_FUNCTIONS: Record<
		MaskPattern,
		(row: number, col: number) => boolean
	> = {
		0: (row, col) => (row + col) % 2 === 0,
		1: (row) => row % 2 === 0,
		2: (_, col) => col % 3 === 0,
		3: (row, col) => (row + col) % 3 === 0,
		4: (row, col) => (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0,
		5: (row, col) => ((row * col) % 2) + ((row * col) % 3) === 0,
		6: (row, col) => (((row * col) % 2) + ((row * col) % 3)) % 2 === 0,
		7: (row, col) => (((row + col) % 2) + ((row * col) % 3)) % 2 === 0,
	};

	/**
	 * Aplica un patrón de máscara a la matriz.
	 *
	 * @description Solo invierte módulos de datos (no reservados).
	 *
	 * @param matrix - Matriz del QR a modificar
	 * @param reserved - Matriz de reserva (módulos de función)
	 * @param pattern - Patrón de máscara (0-7)
	 *
	 * @example
	 * ```typescript
	 * MaskEvaluator.apply(matrix, reserved, 0);
	 * ```
	 */
	static apply(
		matrix: number[][],
		reserved: number[][],
		pattern: MaskPattern,
	): void {
		const size = matrix.length;
		const maskFn = this.MASK_FUNCTIONS[pattern];

		for (let row = 0; row < size; row++) {
			for (let col = 0; col < size; col++) {
				// Solo aplicar a módulos de datos (no reservados)
				if (reserved[row][col] === 0 && maskFn(row, col)) {
					matrix[row][col] ^= 1; // Invertir
				}
			}
		}
	}

	/**
	 * Encuentra el mejor patrón de máscara para una matriz.
	 *
	 * @description Evalúa los 8 patrones y retorna el que tenga
	 * menor penalización total.
	 *
	 * @param matrix - Matriz del QR (sin máscara aplicada)
	 * @param reserved - Matriz de reserva
	 * @returns El patrón de máscara óptimo (0-7)
	 *
	 * @example
	 * ```typescript
	 * const best = MaskEvaluator.findBestMask(matrix, reserved);
	 * console.log(`Mejor máscara: ${best}`);
	 * ```
	 */
	static findBestMask(matrix: number[][], reserved: number[][]): MaskPattern {
		let bestMask: MaskPattern = 0;
		let bestPenalty = Infinity;

		for (let pattern = 0; pattern < 8; pattern++) {
			// Crear copia para evaluar
			const testMatrix = this.copyMatrix(matrix);
			this.apply(testMatrix, reserved, pattern as MaskPattern);

			const penalty = this.calculatePenalty(testMatrix);

			if (penalty < bestPenalty) {
				bestPenalty = penalty;
				bestMask = pattern as MaskPattern;
			}
		}

		return bestMask;
	}

	/**
	 * Calcula la penalización total de una matriz.
	 *
	 * @description Suma las cuatro reglas de penalización:
	 * 1. Secuencias de 5+ módulos del mismo color
	 * 2. Bloques 2x2 del mismo color
	 * 3. Patrones que se asemejan a finder patterns
	 * 4. Desequilibrio en proporción oscuro/claro
	 *
	 * @param matrix - Matriz del QR (con máscara aplicada)
	 * @returns Penalización total
	 */
	static calculatePenalty(matrix: number[][]): number {
		return (
			this.penalty1(matrix) +
			this.penalty2(matrix) +
			this.penalty3(matrix) +
			this.penalty4(matrix)
		);
	}

	/**
	 * Regla 1: Secuencias horizontales y verticales.
	 *
	 * @description Penalización por 5+ módulos consecutivos del mismo color.
	 * Penalización = 3 + (longitud - 5) por cada secuencia.
	 *
	 * @param matrix - Matriz del QR
	 * @returns Penalización de la regla 1
	 *
	 * @internal
	 */
	private static penalty1(matrix: number[][]): number {
		const size = matrix.length;
		let penalty = 0;

		// Horizontal
		for (let row = 0; row < size; row++) {
			let count = 1;
			for (let col = 1; col < size; col++) {
				if (matrix[row][col] === matrix[row][col - 1]) {
					count++;
				} else {
					if (count >= 5) {
						penalty += 3 + (count - 5);
					}
					count = 1;
				}
			}
			if (count >= 5) {
				penalty += 3 + (count - 5);
			}
		}

		// Vertical
		for (let col = 0; col < size; col++) {
			let count = 1;
			for (let row = 1; row < size; row++) {
				if (matrix[row][col] === matrix[row - 1][col]) {
					count++;
				} else {
					if (count >= 5) {
						penalty += 3 + (count - 5);
					}
					count = 1;
				}
			}
			if (count >= 5) {
				penalty += 3 + (count - 5);
			}
		}

		return penalty;
	}

	/**
	 * Regla 2: Bloques 2x2.
	 *
	 * @description Penalización de 3 por cada bloque 2x2 del mismo color.
	 *
	 * @param matrix - Matriz del QR
	 * @returns Penalización de la regla 2
	 *
	 * @internal
	 */
	private static penalty2(matrix: number[][]): number {
		const size = matrix.length;
		let penalty = 0;

		for (let row = 0; row < size - 1; row++) {
			for (let col = 0; col < size - 1; col++) {
				const color = matrix[row][col];
				if (
					matrix[row][col + 1] === color &&
					matrix[row + 1][col] === color &&
					matrix[row + 1][col + 1] === color
				) {
					penalty += 3;
				}
			}
		}

		return penalty;
	}

	/**
	 * Regla 3: Patrones similares a finder patterns.
	 *
	 * @description Penalización de 40 por cada patrón 1:1:3:1:1
	 * seguido o precedido por área clara de 4 módulos.
	 *
	 * Patrón: [1,0,1,1,1,0,1] con [0,0,0,0] antes o después.
	 *
	 * @param matrix - Matriz del QR
	 * @returns Penalización de la regla 3
	 *
	 * @internal
	 */
	private static penalty3(matrix: number[][]): number {
		const size = matrix.length;
		let penalty = 0;

		// Patrones a buscar (con área clara)
		const pattern1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
		const pattern2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];

		// Horizontal
		for (let row = 0; row < size; row++) {
			for (let col = 0; col <= size - 11; col++) {
				let matches1 = true;
				let matches2 = true;

				for (let i = 0; i < 11; i++) {
					if (matrix[row][col + i] !== pattern1[i]) matches1 = false;
					if (matrix[row][col + i] !== pattern2[i]) matches2 = false;
				}

				if (matches1) penalty += 40;
				if (matches2) penalty += 40;
			}
		}

		// Vertical
		for (let col = 0; col < size; col++) {
			for (let row = 0; row <= size - 11; row++) {
				let matches1 = true;
				let matches2 = true;

				for (let i = 0; i < 11; i++) {
					if (matrix[row + i][col] !== pattern1[i]) matches1 = false;
					if (matrix[row + i][col] !== pattern2[i]) matches2 = false;
				}

				if (matches1) penalty += 40;
				if (matches2) penalty += 40;
			}
		}

		return penalty;
	}

	/**
	 * Regla 4: Proporción de módulos oscuros.
	 *
	 * @description Penalización basada en cuánto se desvía la proporción
	 * de módulos oscuros del 50%.
	 *
	 * Cálculo:
	 * 1. Calcular porcentaje de módulos oscuros
	 * 2. Encontrar múltiplos de 5 más cercanos
	 * 3. Calcular |múltiplo - 50| / 5 para ambos
	 * 4. Tomar el menor y multiplicar por 10
	 *
	 * @param matrix - Matriz del QR
	 * @returns Penalización de la regla 4
	 *
	 * @internal
	 */
	private static penalty4(matrix: number[][]): number {
		const size = matrix.length;
		let darkCount = 0;
		const total = size * size;

		for (let row = 0; row < size; row++) {
			for (let col = 0; col < size; col++) {
				if (matrix[row][col] === 1) {
					darkCount++;
				}
			}
		}

		const percentage = (darkCount / total) * 100;
		const lower = Math.floor(percentage / 5) * 5;
		const upper = lower + 5;

		const penalty1 = Math.abs(lower - 50) / 5;
		const penalty2 = Math.abs(upper - 50) / 5;

		return Math.min(penalty1, penalty2) * 10;
	}

	/**
	 * Crea una copia profunda de la matriz.
	 *
	 * @param matrix - Matriz a copiar
	 * @returns Copia de la matriz
	 *
	 * @internal
	 */
	private static copyMatrix(matrix: number[][]): number[][] {
		return matrix.map((row) => [...row]);
	}

	/**
	 * Verifica si una máscara es válida.
	 *
	 * @param pattern - Valor a verificar
	 * @returns true si es un patrón válido (0-7)
	 */
	static isValidPattern(pattern: number): pattern is MaskPattern {
		return Number.isInteger(pattern) && pattern >= 0 && pattern <= 7;
	}
}
