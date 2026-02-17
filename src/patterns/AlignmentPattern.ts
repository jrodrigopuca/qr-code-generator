/**
 * @fileoverview Patrón de alineación (Alignment Pattern) para códigos QR
 * @description Implementa los patrones de alineación para versiones >= 2.
 * @module patterns/AlignmentPattern
 * @see {@link https://www.thonky.com/qr-code-tutorial/module-placement-matrix}
 */

import type { QRVersion } from "../types";
import { ALIGNMENT_PATTERN_POSITIONS } from "../constants";

/** Valor para módulo oscuro en patrones */
const DARK = 1;
/** Valor para módulo claro en patrones */
const LIGHT = 0;

/**
 * Clase para generar patrones de alineación (Alignment Patterns).
 *
 * @description Los Alignment Patterns son cuadrados de 5x5 módulos que
 * ayudan a decodificar el QR cuando hay distorsión. Aparecen en versiones
 * >= 2 y su cantidad aumenta con la versión:
 * - Versión 1: 0 patrones
 * - Versión 2-6: 1 patrón
 * - Versión 7-13: 6 patrones
 * - Versión 14-20: 13 patrones
 * - etc.
 *
 * @example
 * ```typescript
 * const version = 7;
 * const matrix = createEmptyMatrix(getSize(version));
 * const reserved = createEmptyMatrix(getSize(version));
 * AlignmentPattern.draw(matrix, reserved, version);
 * ```
 */
export class AlignmentPattern {
	/** Tamaño del patrón de alineación */
	static readonly SIZE = 5;

	/** Radio del patrón (desde el centro) */
	static readonly RADIUS = 2;

	/**
	 * Dibuja todos los patrones de alineación para una versión dada.
	 *
	 * @description Calcula las posiciones de todos los alignment patterns
	 * y los dibuja evitando solaparse con los finder patterns.
	 *
	 * @param matrix - Matriz del QR a modificar
	 * @param reserved - Matriz de reserva para marcar módulos de función
	 * @param version - Versión del QR (1-40)
	 *
	 * @example
	 * ```typescript
	 * AlignmentPattern.draw(matrix, reserved, 7);
	 * ```
	 */
	static draw(
		matrix: number[][],
		reserved: number[][],
		version: QRVersion,
	): void {
		if (version < 2) {
			return; // Versión 1 no tiene alignment patterns
		}

		const positions = this.getPositions(version);

		for (const row of positions) {
			for (const col of positions) {
				// Skip si se solapa con finder patterns (esquinas)
				if (this.overlapsWithFinder(row, col, matrix.length)) {
					continue;
				}

				this.drawSingle(matrix, reserved, row, col);
			}
		}
	}

	/**
	 * Obtiene las coordenadas de posición para una versión.
	 *
	 * @param version - Versión del QR
	 * @returns Array de coordenadas de centro de alignment patterns
	 *
	 * @example
	 * ```typescript
	 * const positions = AlignmentPattern.getPositions(7);
	 * // [6, 22, 38]
	 * ```
	 */
	static getPositions(version: QRVersion): readonly number[] {
		return ALIGNMENT_PATTERN_POSITIONS[version] || [];
	}

	/**
	 * Dibuja un solo patrón de alineación.
	 *
	 * @param matrix - Matriz del QR
	 * @param reserved - Matriz de reserva
	 * @param centerRow - Fila del centro del patrón
	 * @param centerCol - Columna del centro del patrón
	 *
	 * @internal
	 */
	private static drawSingle(
		matrix: number[][],
		reserved: number[][],
		centerRow: number,
		centerCol: number,
	): void {
		for (let dr = -this.RADIUS; dr <= this.RADIUS; dr++) {
			for (let dc = -this.RADIUS; dc <= this.RADIUS; dc++) {
				const row = centerRow + dr;
				const col = centerCol + dc;

				// Determinar el valor del módulo
				const isEdge = Math.abs(dr) === 2 || Math.abs(dc) === 2;
				const isCenter = dr === 0 && dc === 0;

				if (isEdge || isCenter) {
					matrix[row][col] = DARK;
				} else {
					matrix[row][col] = LIGHT;
				}

				// Marcar como reservado
				reserved[row][col] = 1;
			}
		}
	}

	/**
	 * Verifica si una posición se solapa con un finder pattern.
	 *
	 * @param centerRow - Fila del centro del alignment pattern
	 * @param centerCol - Columna del centro del alignment pattern
	 * @param size - Tamaño de la matriz
	 * @returns true si hay solapamiento
	 *
	 * @internal
	 */
	private static overlapsWithFinder(
		centerRow: number,
		centerCol: number,
		size: number,
	): boolean {
		// Finder pattern superior izquierdo (incluye separador)
		if (centerRow <= 8 && centerCol <= 8) {
			return true;
		}

		// Finder pattern superior derecho (incluye separador)
		if (centerRow <= 8 && centerCol >= size - 9) {
			return true;
		}

		// Finder pattern inferior izquierdo (incluye separador)
		if (centerRow >= size - 9 && centerCol <= 8) {
			return true;
		}

		return false;
	}

	/**
	 * Calcula el número total de alignment patterns para una versión.
	 *
	 * @param version - Versión del QR
	 * @returns Número de alignment patterns
	 *
	 * @example
	 * ```typescript
	 * AlignmentPattern.getCount(7) // 6
	 * AlignmentPattern.getCount(1) // 0
	 * ```
	 */
	static getCount(version: QRVersion): number {
		if (version < 2) return 0;
		const positions = this.getPositions(version);
		const n = positions.length;
		// Número total de combinaciones menos las 3 esquinas con finder patterns
		return n * n - 3;
	}
}
