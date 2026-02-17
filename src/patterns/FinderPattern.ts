/**
 * @fileoverview Patrón de búsqueda (Finder Pattern) para códigos QR
 * @description Implementa los tres patrones de búsqueda en las esquinas del QR.
 * @module patterns/FinderPattern
 * @see {@link https://www.thonky.com/qr-code-tutorial/module-placement-matrix}
 */

import type { QRVersion } from "../types";

/** Valor para módulo oscuro en patrones */
const DARK = 1;
/** Valor para módulo claro en patrones */
const LIGHT = 0;

/**
 * Clase para generar patrones de búsqueda (Finder Patterns).
 *
 * @description Los Finder Patterns son los tres cuadrados grandes en las
 * esquinas del código QR. Cada uno es un cuadrado de 7x7 módulos con:
 * - Borde exterior oscuro (7x7)
 * - Capa intermedia clara (5x5)
 * - Centro oscuro (3x3)
 *
 * Están ubicados en:
 * - Esquina superior izquierda (0, 0)
 * - Esquina superior derecha (0, size-7)
 * - Esquina inferior izquierda (size-7, 0)
 *
 * @example
 * ```typescript
 * const matrix = createEmptyMatrix(21);
 * FinderPattern.draw(matrix);
 * ```
 */
export class FinderPattern {
	/** Tamaño del patrón de búsqueda */
	static readonly SIZE = 7;

	/** Tamaño del separador */
	static readonly SEPARATOR_SIZE = 1;

	/**
	 * Dibuja los tres patrones de búsqueda y sus separadores.
	 *
	 * @description Coloca los finder patterns en las tres esquinas
	 * y añade los separadores de 1 módulo de ancho.
	 *
	 * @param matrix - Matriz del QR a modificar
	 * @param reserved - Matriz de reserva para marcar módulos de función
	 *
	 * @example
	 * ```typescript
	 * const matrix = createEmptyMatrix(21);
	 * const reserved = createEmptyMatrix(21);
	 * FinderPattern.draw(matrix, reserved);
	 * ```
	 */
	static draw(matrix: number[][], reserved: number[][]): void {
		const size = matrix.length;

		// Posiciones de las tres esquinas
		const positions = [
			{ row: 0, col: 0 }, // Superior izquierda
			{ row: 0, col: size - this.SIZE }, // Superior derecha
			{ row: size - this.SIZE, col: 0 }, // Inferior izquierda
		];

		for (const pos of positions) {
			this.drawSingle(matrix, reserved, pos.row, pos.col);
		}

		// Dibujar separadores
		this.drawSeparators(matrix, reserved, size);
	}

	/**
	 * Dibuja un solo patrón de búsqueda.
	 *
	 * @param matrix - Matriz del QR
	 * @param reserved - Matriz de reserva
	 * @param startRow - Fila inicial
	 * @param startCol - Columna inicial
	 *
	 * @internal
	 */
	private static drawSingle(
		matrix: number[][],
		reserved: number[][],
		startRow: number,
		startCol: number,
	): void {
		for (let row = 0; row < this.SIZE; row++) {
			for (let col = 0; col < this.SIZE; col++) {
				const r = startRow + row;
				const c = startCol + col;

				// Determinar si el módulo debe ser oscuro
				const isEdge = row === 0 || row === 6 || col === 0 || col === 6;
				const isInnerEdge = row === 1 || row === 5 || col === 1 || col === 5;
				const isCenter = row >= 2 && row <= 4 && col >= 2 && col <= 4;

				if (isEdge || isCenter) {
					matrix[r][c] = DARK;
				} else if (isInnerEdge) {
					matrix[r][c] = LIGHT;
				}

				// Marcar como reservado
				reserved[r][c] = 1;
			}
		}
	}

	/**
	 * Dibuja los separadores alrededor de los finder patterns.
	 *
	 * @description Los separadores son una línea de módulos claros
	 * de 1 módulo de ancho que rodean cada finder pattern.
	 *
	 * @param matrix - Matriz del QR
	 * @param reserved - Matriz de reserva
	 * @param size - Tamaño de la matriz
	 *
	 * @internal
	 */
	private static drawSeparators(
		matrix: number[][],
		reserved: number[][],
		size: number,
	): void {
		// Separador superior izquierdo (derecha y abajo del finder)
		for (let i = 0; i < 8; i++) {
			// Columna 7 (derecha)
			if (i < size) {
				matrix[i][7] = LIGHT;
				reserved[i][7] = 1;
			}
			// Fila 7 (abajo)
			if (7 < size) {
				matrix[7][i] = LIGHT;
				reserved[7][i] = 1;
			}
		}

		// Separador superior derecho (izquierda y abajo del finder)
		for (let i = 0; i < 8; i++) {
			// Columna size-8 (izquierda)
			matrix[i][size - 8] = LIGHT;
			reserved[i][size - 8] = 1;
			// Fila 7 (abajo)
			matrix[7][size - 8 + i] = LIGHT;
			reserved[7][size - 8 + i] = 1;
		}

		// Separador inferior izquierdo (derecha y arriba del finder)
		for (let i = 0; i < 8; i++) {
			// Columna 7 (derecha)
			matrix[size - 8 + i][7] = LIGHT;
			reserved[size - 8 + i][7] = 1;
			// Fila size-8 (arriba)
			matrix[size - 8][i] = LIGHT;
			reserved[size - 8][i] = 1;
		}
	}

	/**
	 * Calcula el tamaño total ocupado incluyendo separadores.
	 *
	 * @returns Tamaño total (7 + 1 separador = 8)
	 */
	static getTotalSize(): number {
		return this.SIZE + this.SEPARATOR_SIZE;
	}
}
