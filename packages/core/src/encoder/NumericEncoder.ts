/**
 * @fileoverview Codificador de modo Numérico para códigos QR
 * @description Implementa la codificación de dígitos en modo Numérico.
 * @module encoder/NumericEncoder
 * @see {@link https://www.thonky.com/qr-code-tutorial/numeric-mode-encoding}
 */

import type { EncodingMode, QRVersion } from "../types";
import { MODE_INDICATORS } from "../constants";
import { BaseEncoder } from "./BaseEncoder";

/**
 * Codificador de modo Numérico para códigos QR.
 *
 * @description El modo Numérico codifica solo dígitos (0-9) de forma
 * muy eficiente: aproximadamente 3.33 bits por carácter.
 *
 * Los dígitos se agrupan en bloques de 3 y cada grupo se codifica
 * como un número de 10 bits. Grupos de 2 usan 7 bits, y dígitos
 * sueltos usan 4 bits.
 *
 * Comparación de eficiencia:
 * - Numérico: 3.33 bits/carácter (óptimo para dígitos)
 * - Alfanumérico: 5.5 bits/carácter
 * - Byte: 8 bits/carácter
 *
 * @example
 * ```typescript
 * const encoder = new NumericEncoder();
 *
 * // Verificar si puede codificar
 * encoder.canEncode('12345'); // true
 * encoder.canEncode('123A');  // false
 *
 * // Codificar dígitos
 * const bits = encoder.encode('8675309');
 * // Grupos: '867' → 1101100011 (10 bits)
 * //         '530' → 1000010010 (10 bits)
 * //         '9'   → 1001       (4 bits)
 *
 * // Segmento completo
 * const segment = encoder.encodeSegment('123', 1);
 * // '0001' + '0000001111' + '0001111011'
 * ```
 */
export class NumericEncoder extends BaseEncoder {
	/**
	 * Modo de codificación.
	 */
	readonly mode: EncodingMode = "numeric";

	/**
	 * Indicador de modo Numérico: '0001'.
	 */
	readonly modeIndicator: string = MODE_INDICATORS.numeric;

	/**
	 * Patrón de validación para modo numérico.
	 */
	private static readonly NUMERIC_PATTERN = /^\d+$/;

	/**
	 * Codifica dígitos en modo Numérico.
	 *
	 * @description Agrupa los dígitos en bloques de 3 y los codifica:
	 * - 3 dígitos → 10 bits (0-999)
	 * - 2 dígitos → 7 bits (0-99)
	 * - 1 dígito → 4 bits (0-9)
	 *
	 * @param text - Cadena de dígitos a codificar
	 * @returns Cadena de bits codificados
	 * @throws Error si el texto contiene caracteres no numéricos
	 *
	 * @example
	 * ```typescript
	 * const encoder = new NumericEncoder();
	 * encoder.encode('123');     // '0001111011' (123 en 10 bits)
	 * encoder.encode('12');      // '0001100' (12 en 7 bits)
	 * encoder.encode('1');       // '0001' (1 en 4 bits)
	 * encoder.encode('12345');   // '0001111011' + '0101101' (123, 45)
	 * encoder.encode('1234567'); // '0001111011' + '1000101100' + '0111' (123, 456, 7)
	 * ```
	 */
	encode(text: string): string {
		if (!this.canEncode(text)) {
			throw new Error(
				`NumericEncoder: Cannot encode "${text}". Only digits 0-9 are allowed.`,
			);
		}

		let result = "";

		// Procesar en grupos de 3 dígitos
		for (let i = 0; i < text.length; i += 3) {
			const group = text.slice(i, Math.min(i + 3, text.length));
			const value = parseInt(group, 10);

			// Determinar número de bits según tamaño del grupo
			let bits: number;
			if (group.length === 3) {
				bits = 10; // 0-999 necesita 10 bits
			} else if (group.length === 2) {
				bits = 7; // 0-99 necesita 7 bits
			} else {
				bits = 4; // 0-9 necesita 4 bits
			}

			result += value.toString(2).padStart(bits, "0");
		}

		return result;
	}

	/**
	 * Obtiene el número de bits para el Character Count Indicator.
	 *
	 * @description Para modo Numérico:
	 * - Versiones 1-9: 10 bits (hasta 1023 caracteres)
	 * - Versiones 10-26: 12 bits (hasta 4095 caracteres)
	 * - Versiones 27-40: 14 bits (hasta 16383 caracteres)
	 *
	 * @param version - Versión del QR (1-40)
	 * @returns Número de bits para el CCI
	 *
	 * @example
	 * ```typescript
	 * const encoder = new NumericEncoder();
	 * encoder.getCharacterCountBits(1);  // 10
	 * encoder.getCharacterCountBits(9);  // 10
	 * encoder.getCharacterCountBits(10); // 12
	 * encoder.getCharacterCountBits(26); // 12
	 * encoder.getCharacterCountBits(27); // 14
	 * encoder.getCharacterCountBits(40); // 14
	 * ```
	 */
	getCharacterCountBits(version: QRVersion): number {
		if (version <= 9) {
			return 10;
		}
		if (version <= 26) {
			return 12;
		}
		return 14;
	}

	/**
	 * Verifica si el texto puede ser codificado en modo Numérico.
	 *
	 * @description Solo acepta dígitos del 0 al 9.
	 *
	 * @param text - Texto a verificar
	 * @returns true si el texto solo contiene dígitos
	 *
	 * @example
	 * ```typescript
	 * const encoder = new NumericEncoder();
	 * encoder.canEncode('12345');   // true
	 * encoder.canEncode('0');       // true
	 * encoder.canEncode('123.45');  // false (contiene punto)
	 * encoder.canEncode('12 34');   // false (contiene espacio)
	 * encoder.canEncode('12A34');   // false (contiene letra)
	 * encoder.canEncode('');        // false (vacío)
	 * ```
	 */
	canEncode(text: string): boolean {
		if (text.length === 0) {
			return false;
		}
		return NumericEncoder.NUMERIC_PATTERN.test(text);
	}
}
