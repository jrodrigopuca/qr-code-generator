/**
 * @fileoverview Patrón de sincronización (Timing Pattern) para códigos QR
 * @description Implementa los patrones de timing horizontal y vertical.
 * @module patterns/TimingPattern
 * @see {@link https://www.thonky.com/qr-code-tutorial/module-placement-matrix}
 */

/** Valor para módulo oscuro */
const DARK = 1;
/** Valor para módulo claro */
const LIGHT = 0;

/**
 * Clase para generar patrones de sincronización (Timing Patterns).
 *
 * @description Los Timing Patterns son líneas alternantes de módulos
 * oscuros y claros que conectan los finder patterns. Ayudan al
 * decodificador a determinar el tamaño de los módulos.
 *
 * Hay dos timing patterns:
 * - **Horizontal**: Fila 6, desde columna 8 hasta size-9
 * - **Vertical**: Columna 6, desde fila 8 hasta size-9
 *
 * Ambos comienzan y terminan con un módulo oscuro.
 *
 * @example
 * ```typescript
 * const matrix = createEmptyMatrix(21);
 * const reserved = createEmptyMatrix(21);
 * TimingPattern.draw(matrix, reserved);
 * ```
 */
export class TimingPattern {
	/** Posición fija del timing pattern (fila y columna 6) */
	static readonly POSITION = 6;

	/**
	 * Dibuja los patrones de timing horizontal y vertical.
	 *
	 * @param matrix - Matriz del QR a modificar
	 * @param reserved - Matriz de reserva para marcar módulos de función
	 *
	 * @example
	 * ```typescript
	 * TimingPattern.draw(matrix, reserved);
	 * ```
	 */
	static draw(matrix: number[][], reserved: number[][]): void {
		const size = matrix.length;

		this.drawHorizontal(matrix, reserved, size);
		this.drawVertical(matrix, reserved, size);
	}

	/**
	 * Dibuja el timing pattern horizontal.
	 *
	 * @description Línea alternante en la fila 6, comenzando en
	 * columna 8 y terminando en columna size-9.
	 *
	 * @param matrix - Matriz del QR
	 * @param reserved - Matriz de reserva
	 * @param size - Tamaño de la matriz
	 *
	 * @internal
	 */
	private static drawHorizontal(
		matrix: number[][],
		reserved: number[][],
		size: number,
	): void {
		const row = this.POSITION;

		for (let col = 8; col < size - 8; col++) {
			// Alternar: columnas pares = oscuro, impares = claro
			matrix[row][col] = col % 2 === 0 ? DARK : LIGHT;
			reserved[row][col] = 1;
		}
	}

	/**
	 * Dibuja el timing pattern vertical.
	 *
	 * @description Línea alternante en la columna 6, comenzando en
	 * fila 8 y terminando en fila size-9.
	 *
	 * @param matrix - Matriz del QR
	 * @param reserved - Matriz de reserva
	 * @param size - Tamaño de la matriz
	 *
	 * @internal
	 */
	private static drawVertical(
		matrix: number[][],
		reserved: number[][],
		size: number,
	): void {
		const col = this.POSITION;

		for (let row = 8; row < size - 8; row++) {
			// Alternar: filas pares = oscuro, impares = claro
			matrix[row][col] = row % 2 === 0 ? DARK : LIGHT;
			reserved[row][col] = 1;
		}
	}

	/**
	 * Calcula la longitud del timing pattern para un tamaño dado.
	 *
	 * @param size - Tamaño de la matriz del QR
	 * @returns Longitud del timing pattern
	 *
	 * @example
	 * ```typescript
	 * TimingPattern.getLength(21) // 5
	 * TimingPattern.getLength(25) // 9
	 * ```
	 */
	static getLength(size: number): number {
		return size - 16; // size - 8 (inicio) - 8 (fin)
	}
}
