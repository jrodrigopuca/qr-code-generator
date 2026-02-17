/**
 * @fileoverview Utilidades para operaciones binarias
 * @module utils/binary
 */

/**
 * Convierte un número a su representación binaria con padding.
 *
 * @description Convierte un valor numérico a una cadena de bits
 * con la longitud especificada, añadiendo ceros a la izquierda.
 *
 * @param value - Valor numérico a convertir
 * @param length - Longitud deseada de la cadena binaria
 * @returns Cadena binaria con padding de ceros
 *
 * @example
 * ```typescript
 * toBinary(5, 8);  // '00000101'
 * toBinary(255, 8); // '11111111'
 * toBinary(1, 4);   // '0001'
 * ```
 *
 * @throws {RangeError} Si el valor es negativo
 */
export function toBinary(value: number, length: number): string {
	if (value < 0) {
		throw new RangeError("Value must be non-negative");
	}
	return value.toString(2).padStart(length, "0");
}

/**
 * Convierte una cadena binaria a número.
 *
 * @param binary - Cadena de caracteres '0' y '1'
 * @returns Valor numérico equivalente
 *
 * @example
 * ```typescript
 * fromBinary('00000101'); // 5
 * fromBinary('11111111'); // 255
 * ```
 */
export function fromBinary(binary: string): number {
	return parseInt(binary, 2);
}

/**
 * Divide una cadena en grupos de tamaño fijo.
 *
 * @param str - Cadena a dividir
 * @param size - Tamaño de cada grupo
 * @returns Array de subcadenas
 *
 * @example
 * ```typescript
 * chunkString('12345678', 2); // ['12', '34', '56', '78']
 * chunkString('123456789', 3); // ['123', '456', '789']
 * ```
 */
export function chunkString(str: string, size: number): string[] {
	const chunks: string[] = [];
	for (let i = 0; i < str.length; i += size) {
		chunks.push(str.slice(i, i + size));
	}
	return chunks;
}
