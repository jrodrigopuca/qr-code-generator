/**
 * @fileoverview Codificador base abstracto para modos QR
 * @description Define la interfaz común para todos los encoders de datos QR.
 * @module encoder/BaseEncoder
 */

import type { EncodingMode, QRVersion } from "../types";

/**
 * Clase base abstracta para codificadores de datos QR.
 *
 * @description Define la interfaz que deben implementar todos los
 * codificadores de modo (Byte, Numeric, Alphanumeric, Kanji).
 *
 * @example
 * ```typescript
 * class CustomEncoder extends BaseEncoder {
 *   readonly mode: EncodingMode = 'byte';
 *   readonly modeIndicator: string = '0100';
 *
 *   encode(text: string): string {
 *     // Implementación
 *   }
 *
 *   getCharacterCountBits(version: QRVersion): number {
 *     // Implementación
 *   }
 * }
 * ```
 */
export abstract class BaseEncoder {
	/**
	 * Modo de codificación.
	 */
	abstract readonly mode: EncodingMode;

	/**
	 * Indicador de modo (4 bits).
	 */
	abstract readonly modeIndicator: string;

	/**
	 * Codifica el texto en una cadena de bits.
	 *
	 * @param text - Texto a codificar
	 * @returns Cadena de bits codificados (sin indicador de modo ni CCI)
	 */
	abstract encode(text: string): string;

	/**
	 * Obtiene el número de bits para el Character Count Indicator.
	 *
	 * @param version - Versión del QR (1-40)
	 * @returns Número de bits para el CCI
	 */
	abstract getCharacterCountBits(version: QRVersion): number;

	/**
	 * Verifica si el texto puede ser codificado con este modo.
	 *
	 * @param text - Texto a verificar
	 * @returns true si el texto es válido para este modo
	 */
	abstract canEncode(text: string): boolean;

	/**
	 * Genera el Character Count Indicator.
	 *
	 * @param text - Texto a codificar
	 * @param version - Versión del QR
	 * @returns Cadena de bits del CCI
	 *
	 * @example
	 * ```typescript
	 * encoder.getCharacterCountIndicator('Hello', 1); // '00000101' (5 en 8 bits)
	 * ```
	 */
	getCharacterCountIndicator(text: string, version: QRVersion): string {
		const bits = this.getCharacterCountBits(version);
		const count = this.getCharacterCount(text);
		return count.toString(2).padStart(bits, "0");
	}

	/**
	 * Obtiene el conteo de caracteres para el CCI.
	 *
	 * @description Por defecto es la longitud del texto.
	 * Puede ser sobrescrito para modos que cuentan diferente (ej: Kanji).
	 *
	 * @param text - Texto a contar
	 * @returns Número de caracteres
	 */
	protected getCharacterCount(text: string): number {
		return text.length;
	}

	/**
	 * Genera el segmento completo de datos codificados.
	 *
	 * @description Incluye: modo + CCI + datos codificados
	 *
	 * @param text - Texto a codificar
	 * @param version - Versión del QR
	 * @returns Cadena de bits completa del segmento
	 *
	 * @example
	 * ```typescript
	 * const segment = encoder.encodeSegment('Hi', 1);
	 * // '0100' + '00000010' + '01001000 01101001'
	 * ```
	 */
	encodeSegment(text: string, version: QRVersion): string {
		const mode = this.modeIndicator;
		const cci = this.getCharacterCountIndicator(text, version);
		const data = this.encode(text);
		return mode + cci + data;
	}
}
