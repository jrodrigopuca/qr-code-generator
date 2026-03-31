/**
 * @fileoverview Información de formato y versión para códigos QR
 * @description Implementa la colocación de información de formato y versión.
 * @module patterns/FormatInfo
 * @see {@link https://www.thonky.com/qr-code-tutorial/format-version-information}
 */

import type { QRVersion, ErrorCorrectionLevel, MaskPattern } from "../types";
import { FORMAT_INFO_STRINGS, VERSION_INFO_STRINGS } from "../constants";

/** Valor para módulo oscuro */
const DARK = 1;
/** Valor para módulo claro */
const LIGHT = 0;

/**
 * Clase para manejar la información de formato y versión del QR.
 *
 * @description La información de formato incluye:
 * - Nivel de corrección de errores (2 bits)
 * - Patrón de máscara (3 bits)
 * - Bits de corrección BCH (10 bits)
 *
 * Se coloca en dos lugares para redundancia:
 * 1. Cerca del finder pattern superior izquierdo
 * 2. Entre los finder patterns (horizontal y vertical)
 *
 * La información de versión (solo versiones >= 7) se coloca cerca de
 * los finder patterns superior derecho e inferior izquierdo.
 *
 * @example
 * ```typescript
 * FormatInfo.draw(matrix, reserved, 'M', 0, 7);
 * ```
 */
export class FormatInfo {
	/** Longitud de la cadena de formato */
	static readonly FORMAT_LENGTH = 15;

	/** Longitud de la cadena de versión */
	static readonly VERSION_LENGTH = 18;

	/**
	 * Dibuja la información de formato en la matriz.
	 *
	 * @param matrix - Matriz del QR a modificar
	 * @param reserved - Matriz de reserva
	 * @param errorLevel - Nivel de corrección de errores
	 * @param maskPattern - Patrón de máscara (0-7)
	 *
	 * @example
	 * ```typescript
	 * FormatInfo.drawFormat(matrix, reserved, 'M', 0);
	 * ```
	 */
	static drawFormat(
		matrix: number[][],
		reserved: number[][],
		errorLevel: ErrorCorrectionLevel,
		maskPattern: MaskPattern,
	): void {
		const formatString = this.getFormatString(errorLevel, maskPattern);
		const size = matrix.length;

		// Colocar la información de formato
		this.placeFormatBits(matrix, reserved, formatString, size);
	}

	/**
	 * Reserva los módulos para la información de formato.
	 *
	 * @description Marca como reservados los módulos donde irá la
	 * información de formato, incluyendo el módulo oscuro fijo.
	 *
	 * @param reserved - Matriz de reserva
	 * @param size - Tamaño de la matriz
	 */
	static reserveFormatArea(reserved: number[][], size: number): void {
		// Área cerca del finder superior izquierdo
		// Fila 8, columnas 0-8 (excepto columna 6 que es timing)
		for (let col = 0; col <= 8; col++) {
			reserved[8][col] = 1;
		}

		// Columna 8, filas 0-8 (excepto fila 6 que es timing)
		for (let row = 0; row <= 8; row++) {
			reserved[row][8] = 1;
		}

		// Área horizontal inferior
		for (let col = size - 8; col < size; col++) {
			reserved[8][col] = 1;
		}

		// Área vertical derecha
		for (let row = size - 7; row < size; row++) {
			reserved[row][8] = 1;
		}
	}

	/**
	 * Obtiene la cadena de formato para un nivel y máscara dados.
	 *
	 * @param errorLevel - Nivel de corrección de errores
	 * @param maskPattern - Patrón de máscara (0-7)
	 * @returns Cadena de 15 bits de formato
	 *
	 * @internal
	 */
	private static getFormatString(
		errorLevel: ErrorCorrectionLevel,
		maskPattern: MaskPattern,
	): string {
		return FORMAT_INFO_STRINGS[maskPattern][errorLevel];
	}

	/**
	 * Coloca los bits de formato en las posiciones correctas.
	 *
	 * @param matrix - Matriz del QR
	 * @param reserved - Matriz de reserva
	 * @param formatBits - Cadena de 15 bits
	 * @param size - Tamaño de la matriz
	 *
	 * @internal
	 */
	private static placeFormatBits(
		matrix: number[][],
		reserved: number[][],
		formatBits: string,
		size: number,
	): void {
		// Primera copia: cerca del finder superior izquierdo
		// Bits 0-5: fila 8, columnas 0-5
		// Bit 6: fila 8, columna 7 (skip columna 6 = timing)
		// Bit 7: fila 8, columna 8
		// Bit 8: fila 7, columna 8 (skip fila 6 = timing)
		// Bits 9-14: fila 5 hasta 0, columna 8

		const firstCopyPositions = [
			{ row: 8, col: 0 }, // bit 0
			{ row: 8, col: 1 }, // bit 1
			{ row: 8, col: 2 }, // bit 2
			{ row: 8, col: 3 }, // bit 3
			{ row: 8, col: 4 }, // bit 4
			{ row: 8, col: 5 }, // bit 5
			{ row: 8, col: 7 }, // bit 6 - Skip col 6 (timing)
			{ row: 8, col: 8 }, // bit 7
			{ row: 7, col: 8 }, // bit 8 - Skip row 6 (timing)
			{ row: 5, col: 8 }, // bit 9
			{ row: 4, col: 8 }, // bit 10
			{ row: 3, col: 8 }, // bit 11
			{ row: 2, col: 8 }, // bit 12
			{ row: 1, col: 8 }, // bit 13
			{ row: 0, col: 8 }, // bit 14
		];

		// Segunda copia: entre finder patterns
		// Según ISO/IEC 18004:
		// Bits 0-6: columna 8, filas (size-1) hasta (size-7), de abajo hacia arriba
		// Bits 7-14: fila 8, columnas (size-8) hasta (size-1), de izquierda a derecha

		const secondCopyPositions = [
			// Bits 0-6: Vertical, columna 8, desde abajo
			{ row: size - 1, col: 8 }, // bit 0
			{ row: size - 2, col: 8 }, // bit 1
			{ row: size - 3, col: 8 }, // bit 2
			{ row: size - 4, col: 8 }, // bit 3
			{ row: size - 5, col: 8 }, // bit 4
			{ row: size - 6, col: 8 }, // bit 5
			{ row: size - 7, col: 8 }, // bit 6
			// Bits 7-14: Horizontal, fila 8, desde izquierda
			{ row: 8, col: size - 8 }, // bit 7
			{ row: 8, col: size - 7 }, // bit 8
			{ row: 8, col: size - 6 }, // bit 9
			{ row: 8, col: size - 5 }, // bit 10
			{ row: 8, col: size - 4 }, // bit 11
			{ row: 8, col: size - 3 }, // bit 12
			{ row: 8, col: size - 2 }, // bit 13
			{ row: 8, col: size - 1 }, // bit 14
		];

		// Colocar los bits
		for (let i = 0; i < this.FORMAT_LENGTH; i++) {
			const value = formatBits[i] === "1" ? DARK : LIGHT;

			const pos1 = firstCopyPositions[i];
			matrix[pos1.row][pos1.col] = value;
			reserved[pos1.row][pos1.col] = 1;

			const pos2 = secondCopyPositions[i];
			matrix[pos2.row][pos2.col] = value;
			reserved[pos2.row][pos2.col] = 1;
		}

		// Módulo oscuro fijo (siempre oscuro)
		matrix[size - 8][8] = DARK;
		reserved[size - 8][8] = 1;
	}

	/**
	 * Dibuja la información de versión (solo para versiones >= 7).
	 *
	 * @param matrix - Matriz del QR
	 * @param reserved - Matriz de reserva
	 * @param version - Versión del QR
	 *
	 * @example
	 * ```typescript
	 * if (version >= 7) {
	 *   FormatInfo.drawVersion(matrix, reserved, version);
	 * }
	 * ```
	 */
	static drawVersion(
		matrix: number[][],
		reserved: number[][],
		version: QRVersion,
	): void {
		if (version < 7) {
			return; // Versiones < 7 no tienen información de versión
		}

		const versionString = VERSION_INFO_STRINGS[version];
		if (!versionString) {
			return;
		}

		const size = matrix.length;

		// Colocar en dos ubicaciones
		this.placeVersionBits(matrix, reserved, versionString, size);
	}

	/**
	 * Coloca los bits de versión en las posiciones correctas.
	 *
	 * @param matrix - Matriz del QR
	 * @param reserved - Matriz de reserva
	 * @param versionBits - Cadena de 18 bits
	 * @param size - Tamaño de la matriz
	 *
	 * @internal
	 */
	private static placeVersionBits(
		matrix: number[][],
		reserved: number[][],
		versionBits: string,
		size: number,
	): void {
		let bitIndex = 0;

		// Bloque inferior izquierdo (3 filas x 6 columnas)
		// Ubicación: filas size-11 a size-9, columnas 0-5
		for (let col = 0; col < 6; col++) {
			for (let row = 0; row < 3; row++) {
				const value = versionBits[bitIndex] === "1" ? DARK : LIGHT;

				// Bloque inferior izquierdo
				matrix[size - 11 + row][col] = value;
				reserved[size - 11 + row][col] = 1;

				// Bloque superior derecho (transpuesto)
				matrix[col][size - 11 + row] = value;
				reserved[col][size - 11 + row] = 1;

				bitIndex++;
			}
		}
	}

	/**
	 * Reserva el área para la información de versión.
	 *
	 * @param reserved - Matriz de reserva
	 * @param version - Versión del QR
	 * @param size - Tamaño de la matriz
	 */
	static reserveVersionArea(
		reserved: number[][],
		version: QRVersion,
		size: number,
	): void {
		if (version < 7) {
			return;
		}

		// Bloque inferior izquierdo
		for (let row = size - 11; row < size - 8; row++) {
			for (let col = 0; col < 6; col++) {
				reserved[row][col] = 1;
			}
		}

		// Bloque superior derecho
		for (let row = 0; row < 6; row++) {
			for (let col = size - 11; col < size - 8; col++) {
				reserved[row][col] = 1;
			}
		}
	}
}
