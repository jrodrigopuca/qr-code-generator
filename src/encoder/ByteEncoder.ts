/**
 * @fileoverview Codificador de modo Byte para códigos QR
 * @description Implementa la codificación de texto en modo Byte (8 bits por carácter).
 * @module encoder/ByteEncoder
 * @see {@link https://www.thonky.com/qr-code-tutorial/byte-mode-encoding}
 */

import type { EncodingMode, QRVersion } from "../types";
import { MODE_INDICATORS } from "../constants";
import { BaseEncoder } from "./BaseEncoder";

/**
 * Codificador de modo Byte para códigos QR.
 *
 * @description El modo Byte codifica cada carácter como 8 bits.
 * Soporta cualquier byte (0-255), típicamente usando ISO-8859-1 o UTF-8.
 *
 * Es el modo más versátil pero menos eficiente en espacio:
 * - Numérico: 3.33 bits/carácter
 * - Alfanumérico: 5.5 bits/carácter
 * - Byte: 8 bits/carácter
 *
 * @example
 * ```typescript
 * const encoder = new ByteEncoder();
 *
 * // Codificar texto
 * const bits = encoder.encode('Hello');
 * // '0100100001100101011011000110110001101111'
 *
 * // Segmento completo con modo y CCI
 * const segment = encoder.encodeSegment('Hi', 1);
 * // '0100' + '00000010' + '0100100001101001'
 * ```
 */
export class ByteEncoder extends BaseEncoder {
	/**
	 * Modo de codificación.
	 */
	readonly mode: EncodingMode = "byte";

	/**
	 * Indicador de modo Byte: '0100'.
	 */
	readonly modeIndicator: string = MODE_INDICATORS.byte;

	/**
	 * Codifica texto en modo Byte.
	 *
	 * @description Convierte cada carácter a su código ASCII/ISO-8859-1
	 * representado en 8 bits.
	 *
	 * @param text - Texto a codificar
	 * @returns Cadena de bits (8 bits por carácter)
	 *
	 * @example
	 * ```typescript
	 * const encoder = new ByteEncoder();
	 * encoder.encode('A');    // '01000001' (65 en binario)
	 * encoder.encode('Hi');   // '0100100001101001'
	 * encoder.encode('123');  // '001100010011001000110011'
	 * ```
	 */
	encode(text: string): string {
		let result = "";
		for (let i = 0; i < text.length; i++) {
			const charCode = text.charCodeAt(i);
			result += charCode.toString(2).padStart(8, "0");
		}
		return result;
	}

	/**
	 * Obtiene el número de bits para el Character Count Indicator.
	 *
	 * @description Para modo Byte:
	 * - Versiones 1-9: 8 bits
	 * - Versiones 10-40: 16 bits
	 *
	 * @param version - Versión del QR (1-40)
	 * @returns Número de bits para el CCI
	 *
	 * @example
	 * ```typescript
	 * const encoder = new ByteEncoder();
	 * encoder.getCharacterCountBits(1);  // 8
	 * encoder.getCharacterCountBits(9);  // 8
	 * encoder.getCharacterCountBits(10); // 16
	 * encoder.getCharacterCountBits(40); // 16
	 * ```
	 */
	getCharacterCountBits(version: QRVersion): number {
		if (version <= 9) {
			return 8;
		}
		return 16;
	}

	/**
	 * Verifica si el texto puede ser codificado en modo Byte.
	 *
	 * @description El modo Byte acepta cualquier carácter con código 0-255.
	 * Para caracteres fuera de este rango (Unicode > 255), se necesitaría
	 * codificación UTF-8 que puede producir múltiples bytes.
	 *
	 * @param text - Texto a verificar
	 * @returns true si todos los caracteres están en el rango 0-255
	 *
	 * @example
	 * ```typescript
	 * const encoder = new ByteEncoder();
	 * encoder.canEncode('Hello');  // true
	 * encoder.canEncode('Héllo');  // true (é = 233)
	 * encoder.canEncode('你好');   // false (fuera del rango ISO-8859-1)
	 * ```
	 */
	canEncode(text: string): boolean {
		for (let i = 0; i < text.length; i++) {
			if (text.charCodeAt(i) > 255) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Codifica texto con soporte UTF-8.
	 *
	 * @description Convierte el texto a bytes UTF-8, permitiendo
	 * caracteres Unicode fuera del rango ISO-8859-1.
	 *
	 * @param text - Texto a codificar (puede incluir Unicode)
	 * @returns Array de bytes UTF-8
	 *
	 * @example
	 * ```typescript
	 * const encoder = new ByteEncoder();
	 * encoder.encodeUTF8('é');  // [195, 169] (2 bytes)
	 * encoder.encodeUTF8('你'); // [228, 189, 160] (3 bytes)
	 * ```
	 */
	encodeUTF8(text: string): number[] {
		const encoder = new TextEncoder();
		const bytes = encoder.encode(text);
		return Array.from(bytes);
	}

	/**
	 * Obtiene la longitud en bytes del texto codificado en UTF-8.
	 *
	 * @param text - Texto a medir
	 * @returns Número de bytes UTF-8
	 *
	 * @example
	 * ```typescript
	 * const encoder = new ByteEncoder();
	 * encoder.getUTF8ByteLength('Hi');  // 2
	 * encoder.getUTF8ByteLength('你好'); // 6
	 * ```
	 */
	getUTF8ByteLength(text: string): number {
		const encoder = new TextEncoder();
		return encoder.encode(text).length;
	}
}
