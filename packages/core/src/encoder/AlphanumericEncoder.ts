/**
 * @fileoverview Codificador de modo Alfanumérico para códigos QR
 * @description Implementa la codificación de caracteres alfanuméricos.
 * @module encoder/AlphanumericEncoder
 * @see {@link https://www.thonky.com/qr-code-tutorial/alphanumeric-mode-encoding}
 */

import type { EncodingMode, QRVersion } from "../types";
import { MODE_INDICATORS, ALPHANUMERIC_CHARS } from "../constants";
import { BaseEncoder } from "./BaseEncoder";

/**
 * Codificador de modo Alfanumérico para códigos QR.
 *
 * @description El modo Alfanumérico codifica un conjunto limitado de 45 caracteres:
 * - Dígitos: 0-9
 * - Letras mayúsculas: A-Z
 * - Símbolos: espacio, $, %, *, +, -, ., /, :
 *
 * Eficiencia: 5.5 bits por carácter (comparado con 8 bits en modo Byte).
 *
 * Los caracteres se agrupan en pares y cada par se codifica como un
 * número de 11 bits. Caracteres sueltos usan 6 bits.
 *
 * Fórmula para pares: (valor1 × 45) + valor2 → 11 bits
 *
 * @example
 * ```typescript
 * const encoder = new AlphanumericEncoder();
 *
 * // Verificar si puede codificar
 * encoder.canEncode('HELLO');    // true
 * encoder.canEncode('HELLO 123'); // true
 * encoder.canEncode('hello');    // false (minúsculas no soportadas)
 *
 * // Codificar texto
 * const bits = encoder.encode('AC-42');
 * // Pares: 'AC' → (10×45)+12 = 462 → 00111001110 (11 bits)
 * //        '-4' → (41×45)+4 = 1849 → 11100111001 (11 bits)
 * //        '2'  → 2 → 000010 (6 bits)
 * ```
 */
export class AlphanumericEncoder extends BaseEncoder {
	/**
	 * Modo de codificación.
	 */
	readonly mode: EncodingMode = "alphanumeric";

	/**
	 * Indicador de modo Alfanumérico: '0010'.
	 */
	readonly modeIndicator: string = MODE_INDICATORS.alphanumeric;

	/**
	 * Conjunto de caracteres alfanuméricos válidos.
	 * @internal
	 */
	private static readonly VALID_CHARS = new Set(
		Object.keys(ALPHANUMERIC_CHARS),
	);

	/**
	 * Codifica texto en modo Alfanumérico.
	 *
	 * @description Agrupa los caracteres en pares y los codifica:
	 * - Par de caracteres: valor1 × 45 + valor2 → 11 bits
	 * - Carácter suelto: valor → 6 bits
	 *
	 * @param text - Texto a codificar (mayúsculas, dígitos, símbolos permitidos)
	 * @returns Cadena de bits codificados
	 * @throws Error si el texto contiene caracteres no alfanuméricos
	 *
	 * @example
	 * ```typescript
	 * const encoder = new AlphanumericEncoder();
	 * encoder.encode('AB');      // (10×45)+11 = 461 → '00111001101' (11 bits)
	 * encoder.encode('A');       // 10 → '001010' (6 bits)
	 * encoder.encode('HELLO');   // 'HE' + 'LL' + 'O' → 11 + 11 + 6 = 28 bits
	 * ```
	 */
	encode(text: string): string {
		if (!this.canEncode(text)) {
			throw new Error(
				`AlphanumericEncoder: Cannot encode "${text}". Only uppercase letters, digits, and symbols (space $%*+-./:) are allowed.`,
			);
		}

		let result = "";

		// Procesar en pares de caracteres
		for (let i = 0; i < text.length; i += 2) {
			if (i + 1 < text.length) {
				// Par de caracteres: codificar como 11 bits
				const char1 = text[i];
				const char2 = text[i + 1];
				const value1 = ALPHANUMERIC_CHARS[char1];
				const value2 = ALPHANUMERIC_CHARS[char2];
				const combined = value1 * 45 + value2;
				result += combined.toString(2).padStart(11, "0");
			} else {
				// Carácter suelto: codificar como 6 bits
				const char = text[i];
				const value = ALPHANUMERIC_CHARS[char];
				result += value.toString(2).padStart(6, "0");
			}
		}

		return result;
	}

	/**
	 * Obtiene el número de bits para el Character Count Indicator.
	 *
	 * @description Para modo Alfanumérico:
	 * - Versiones 1-9: 9 bits (hasta 511 caracteres)
	 * - Versiones 10-26: 11 bits (hasta 2047 caracteres)
	 * - Versiones 27-40: 13 bits (hasta 8191 caracteres)
	 *
	 * @param version - Versión del QR (1-40)
	 * @returns Número de bits para el CCI
	 *
	 * @example
	 * ```typescript
	 * const encoder = new AlphanumericEncoder();
	 * encoder.getCharacterCountBits(1);  // 9
	 * encoder.getCharacterCountBits(9);  // 9
	 * encoder.getCharacterCountBits(10); // 11
	 * encoder.getCharacterCountBits(26); // 11
	 * encoder.getCharacterCountBits(27); // 13
	 * encoder.getCharacterCountBits(40); // 13
	 * ```
	 */
	getCharacterCountBits(version: QRVersion): number {
		if (version <= 9) {
			return 9;
		}
		if (version <= 26) {
			return 11;
		}
		return 13;
	}

	/**
	 * Verifica si el texto puede ser codificado en modo Alfanumérico.
	 *
	 * @description Solo acepta los 45 caracteres del conjunto alfanumérico:
	 * 0-9, A-Z, espacio, $, %, *, +, -, ., /, :
	 *
	 * @param text - Texto a verificar
	 * @returns true si todos los caracteres son alfanuméricos válidos
	 *
	 * @example
	 * ```typescript
	 * const encoder = new AlphanumericEncoder();
	 * encoder.canEncode('HELLO');       // true
	 * encoder.canEncode('HELLO WORLD'); // true
	 * encoder.canEncode('AC-42');       // true
	 * encoder.canEncode('50%');         // true
	 * encoder.canEncode('hello');       // false (minúsculas)
	 * encoder.canEncode('Hi!');         // false (minúsculas y !)
	 * encoder.canEncode('');            // false (vacío)
	 * ```
	 */
	canEncode(text: string): boolean {
		if (text.length === 0) {
			return false;
		}
		for (const char of text) {
			if (!AlphanumericEncoder.VALID_CHARS.has(char)) {
				return false;
			}
		}
		return true;
	}
}
