/**
 * @fileoverview Renderizador de códigos QR para terminal (ASCII/Unicode)
 * @description Implementa el renderizado de QR codes como texto para la consola.
 * Soporta múltiples estilos: bloques Unicode, ASCII y caracteres compactos.
 * @module renderer/TerminalRenderer
 */

import type { QRMatrix } from "../types";

/**
 * Estilo de renderizado para la terminal.
 * - `unicode`: Usa caracteres de bloque Unicode (██ / espacios) — mejor contraste
 * - `compact`: Usa caracteres Unicode de medio bloque (▀▄█ ) — mitad de altura
 * - `ascii`: Usa caracteres ASCII (## / espacios) — máxima compatibilidad
 */
export type TerminalStyle = "unicode" | "compact" | "ascii";

/**
 * Opciones de renderizado para terminal.
 */
export interface TerminalRenderOptions {
	/**
	 * Estilo de caracteres a utilizar.
	 * @default 'unicode'
	 */
	style?: TerminalStyle;

	/**
	 * Margen en módulos (quiet zone) alrededor del QR.
	 * @default 2
	 */
	margin?: number;

	/**
	 * Invertir colores (fondo oscuro, módulos claros).
	 * Útil cuando la terminal tiene fondo oscuro.
	 * @default false
	 */
	invert?: boolean;
}

/** Opciones por defecto de renderizado en terminal */
const DEFAULT_OPTIONS: Required<TerminalRenderOptions> = {
	style: "unicode",
	margin: 2,
	invert: false,
};

/** Caracteres Unicode de bloque completo */
const UNICODE_DARK = "██";
const UNICODE_LIGHT = "  ";

/** Caracteres ASCII */
const ASCII_DARK = "##";
const ASCII_LIGHT = "  ";

/**
 * Caracteres Unicode de medio bloque para modo compacto.
 * Cada carácter representa dos filas verticales.
 */
const COMPACT_BOTH_DARK = "█"; // ambas filas oscuras
const COMPACT_TOP_DARK = "▀"; // fila superior oscura, inferior clara
const COMPACT_BOTTOM_DARK = "▄"; // fila superior clara, inferior oscura
const COMPACT_BOTH_LIGHT = " "; // ambas filas claras

/**
 * Renderizador de códigos QR para terminal.
 *
 * @description Convierte una matriz QR en texto legible en la terminal.
 * Ideal para herramientas CLI, debugging, y scripts de Node.js.
 *
 * Soporta tres estilos de renderizado:
 * - **unicode**: Máxima calidad visual con caracteres de bloque
 * - **compact**: Mitad de altura usando caracteres de medio bloque
 * - **ascii**: Compatible con cualquier terminal
 *
 * @example
 * ```typescript
 * import { generateQR, TerminalRenderer } from 'qr-pure';
 *
 * const { matrix } = generateQR('Hello World');
 *
 * // Renderizado estándar Unicode
 * console.log(TerminalRenderer.render(matrix));
 *
 * // Compacto (mitad de altura)
 * console.log(TerminalRenderer.render(matrix, { style: 'compact' }));
 *
 * // Invertido para terminales con fondo oscuro
 * console.log(TerminalRenderer.render(matrix, { invert: true }));
 * ```
 */
export class TerminalRenderer {
	/**
	 * Renderiza una matriz QR como cadena de texto para terminal.
	 *
	 * @param matrix - Matriz del código QR (0 = claro, 1 = oscuro)
	 * @param options - Opciones de renderizado
	 * @returns Cadena con el QR representado en texto
	 */
	static render(matrix: QRMatrix, options?: TerminalRenderOptions): string {
		const opts = { ...DEFAULT_OPTIONS, ...options };

		switch (opts.style) {
			case "compact":
				return TerminalRenderer.renderCompact(matrix, opts);
			case "ascii":
				return TerminalRenderer.renderStandard(
					matrix,
					opts,
					ASCII_DARK,
					ASCII_LIGHT,
				);
			case "unicode":
			default:
				return TerminalRenderer.renderStandard(
					matrix,
					opts,
					UNICODE_DARK,
					UNICODE_LIGHT,
				);
		}
	}

	/**
	 * Renderiza el QR usando caracteres de ancho doble (unicode o ascii).
	 *
	 * @param matrix - Matriz QR
	 * @param opts - Opciones resueltas
	 * @param darkChar - Carácter para módulos oscuros
	 * @param lightChar - Carácter para módulos claros
	 * @returns Cadena renderizada
	 * @internal
	 */
	private static renderStandard(
		matrix: QRMatrix,
		opts: Required<TerminalRenderOptions>,
		darkChar: string,
		lightChar: string,
	): string {
		const size = matrix.length;
		const { margin, invert } = opts;

		const dark = invert ? lightChar : darkChar;
		const light = invert ? darkChar : lightChar;

		const lines: string[] = [];

		// Líneas de margen superior
		const marginLine = light.repeat(size + margin * 2);
		for (let m = 0; m < margin; m++) {
			lines.push(marginLine);
		}

		// Líneas de datos
		for (let row = 0; row < size; row++) {
			let line = light.repeat(margin);
			for (let col = 0; col < size; col++) {
				line += matrix[row][col] === 1 ? dark : light;
			}
			line += light.repeat(margin);
			lines.push(line);
		}

		// Líneas de margen inferior
		for (let m = 0; m < margin; m++) {
			lines.push(marginLine);
		}

		return lines.join("\n");
	}

	/**
	 * Renderiza el QR en modo compacto usando caracteres de medio bloque.
	 *
	 * @description Cada carácter representa dos filas verticales de la matriz,
	 * reduciendo la altura a la mitad. Usa los caracteres Unicode:
	 * - █ (U+2588): ambas filas oscuras
	 * - ▀ (U+2580): fila superior oscura
	 * - ▄ (U+2584): fila inferior oscura
	 * - (espacio): ambas filas claras
	 *
	 * @param matrix - Matriz QR
	 * @param opts - Opciones resueltas
	 * @returns Cadena renderizada en modo compacto
	 * @internal
	 */
	private static renderCompact(
		matrix: QRMatrix,
		opts: Required<TerminalRenderOptions>,
	): string {
		const size = matrix.length;
		const { margin, invert } = opts;
		const lines: string[] = [];

		// Total de filas incluyendo márgenes (arriba y abajo)
		const totalRows = size + margin * 2;
		const totalCols = size + margin * 2;

		// Función helper para obtener si un módulo es oscuro (considerando márgenes)
		const isDark = (row: number, col: number): boolean => {
			const matRow = row - margin;
			const matCol = col - margin;
			if (matRow < 0 || matRow >= size || matCol < 0 || matCol >= size) {
				return false; // margen = claro
			}
			return matrix[matRow][matCol] === 1;
		};

		// Procesar de a dos filas
		for (let row = 0; row < totalRows; row += 2) {
			let line = "";
			for (let col = 0; col < totalCols; col++) {
				const topDark = isDark(row, col);
				const bottomDark = row + 1 < totalRows ? isDark(row + 1, col) : false;

				let char: string;
				if (topDark && bottomDark) {
					char = invert ? COMPACT_BOTH_LIGHT : COMPACT_BOTH_DARK;
				} else if (topDark && !bottomDark) {
					char = invert ? COMPACT_BOTTOM_DARK : COMPACT_TOP_DARK;
				} else if (!topDark && bottomDark) {
					char = invert ? COMPACT_TOP_DARK : COMPACT_BOTTOM_DARK;
				} else {
					char = invert ? COMPACT_BOTH_DARK : COMPACT_BOTH_LIGHT;
				}
				line += char;
			}
			lines.push(line);
		}

		return lines.join("\n");
	}
}
