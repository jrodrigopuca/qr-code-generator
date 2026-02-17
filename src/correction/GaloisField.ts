/**
 * @fileoverview Aritmética de campos de Galois GF(2^8)
 * @description Implementa operaciones matemáticas sobre el campo finito GF(2^8)
 * utilizado en la corrección de errores Reed-Solomon para códigos QR.
 * @module correction/GaloisField
 * @see {@link https://www.thonky.com/qr-code-tutorial/error-correction-coding}
 */

import { GF_ANTILOG, GF_LOG } from "../constants";

/**
 * Clase estática para aritmética de campos de Galois GF(2^8).
 *
 * @description El campo GF(2^8) se usa para los cálculos de Reed-Solomon
 * en códigos QR. Utiliza el polinomio primitivo x^8 + x^4 + x^3 + x^2 + 1.
 *
 * En este campo:
 * - La suma es XOR
 * - La multiplicación usa tablas de logaritmos
 * - Hay 256 elementos (0-255)
 *
 * @example
 * ```typescript
 * // Multiplicación en GF(2^8)
 * const result = GaloisField.multiply(17, 42); // 198
 *
 * // Potencia
 * const power = GaloisField.power(2, 8); // 29 (overflow)
 * ```
 */
export class GaloisField {
	/**
	 * Tabla antilogarítmica: antilog[i] = α^i
	 * @internal
	 */
	private static readonly ANTILOG = GF_ANTILOG;

	/**
	 * Tabla logarítmica: log[x] = i donde α^i = x
	 * @internal
	 */
	private static readonly LOG = GF_LOG;

	/**
	 * Obtiene el antilogaritmo (exponenciación de α).
	 *
	 * @description Calcula α^exponent en GF(2^8).
	 * El resultado se normaliza al rango [0, 254] usando módulo 255.
	 *
	 * @param exponent - Exponente (puede ser >= 255, se normaliza)
	 * @returns α^exponent en GF(2^8)
	 *
	 * @example
	 * ```typescript
	 * GaloisField.antilog(0);  // 1 (α^0 = 1)
	 * GaloisField.antilog(1);  // 2 (α^1 = 2)
	 * GaloisField.antilog(8);  // 29 (α^8 = 29 con el polinomio primitivo)
	 * GaloisField.antilog(255); // 1 (α^255 = α^0 = 1)
	 * ```
	 */
	static antilog(exponent: number): number {
		// Normaliza exponentes >= 255
		const normalizedExp = exponent % 255;
		return this.ANTILOG[normalizedExp];
	}

	/**
	 * Obtiene el logaritmo en base α.
	 *
	 * @description Encuentra i tal que α^i = value en GF(2^8).
	 *
	 * @param value - Valor en GF(2^8) (1-255, 0 es caso especial)
	 * @returns Logaritmo en base α
	 *
	 * @example
	 * ```typescript
	 * GaloisField.log(1);  // 0 (α^0 = 1)
	 * GaloisField.log(2);  // 1 (α^1 = 2)
	 * GaloisField.log(29); // 8 (α^8 = 29)
	 * ```
	 *
	 * @throws {Error} Si value es 0 (log(0) indefinido)
	 */
	static log(value: number): number {
		if (value === 0) {
			throw new Error("Logarithm of 0 is undefined in GF(2^8)");
		}
		return this.LOG[value];
	}

	/**
	 * Suma dos valores en GF(2^8).
	 *
	 * @description En campos de característica 2, la suma es XOR.
	 * Nota: En GF(2^8), a + a = 0, por lo que resta = suma.
	 *
	 * @param a - Primer operando
	 * @param b - Segundo operando
	 * @returns a XOR b
	 *
	 * @example
	 * ```typescript
	 * GaloisField.add(5, 3);   // 6 (0101 XOR 0011 = 0110)
	 * GaloisField.add(10, 10); // 0 (a + a = 0)
	 * ```
	 */
	static add(a: number, b: number): number {
		return a ^ b;
	}

	/**
	 * Resta dos valores en GF(2^8).
	 *
	 * @description En GF(2^8), resta es igual a suma (XOR).
	 *
	 * @param a - Minuendo
	 * @param b - Sustraendo
	 * @returns a XOR b
	 *
	 * @example
	 * ```typescript
	 * GaloisField.subtract(5, 3); // 6 (igual que add)
	 * ```
	 */
	static subtract(a: number, b: number): number {
		return a ^ b;
	}

	/**
	 * Multiplica dos valores en GF(2^8).
	 *
	 * @description Usa la identidad: a * b = antilog(log(a) + log(b)).
	 * Caso especial: Si alguno es 0, el resultado es 0.
	 *
	 * @param a - Primer factor
	 * @param b - Segundo factor
	 * @returns Producto en GF(2^8)
	 *
	 * @example
	 * ```typescript
	 * GaloisField.multiply(2, 4);  // 8
	 * GaloisField.multiply(128, 2); // 29 (overflow)
	 * GaloisField.multiply(17, 0);  // 0
	 * ```
	 */
	static multiply(a: number, b: number): number {
		if (a === 0 || b === 0) {
			return 0;
		}
		const logSum = this.LOG[a] + this.LOG[b];
		return this.antilog(logSum);
	}

	/**
	 * Divide dos valores en GF(2^8).
	 *
	 * @description Usa la identidad: a / b = antilog(log(a) - log(b)).
	 *
	 * @param a - Dividendo
	 * @param b - Divisor
	 * @returns Cociente en GF(2^8)
	 *
	 * @example
	 * ```typescript
	 * GaloisField.divide(8, 4);  // 2
	 * GaloisField.divide(6, 2);  // 3
	 * ```
	 *
	 * @throws {Error} Si b es 0 (división por cero)
	 */
	static divide(a: number, b: number): number {
		if (b === 0) {
			throw new Error("Division by zero in GF(2^8)");
		}
		if (a === 0) {
			return 0;
		}
		let logDiff = this.LOG[a] - this.LOG[b];
		if (logDiff < 0) {
			logDiff += 255;
		}
		return this.antilog(logDiff);
	}

	/**
	 * Calcula la potencia en GF(2^8).
	 *
	 * @description Calcula base^exponent en GF(2^8).
	 *
	 * @param base - Base
	 * @param exponent - Exponente (entero no negativo)
	 * @returns base^exponent en GF(2^8)
	 *
	 * @example
	 * ```typescript
	 * GaloisField.power(2, 8);  // 29
	 * GaloisField.power(3, 0);  // 1
	 * GaloisField.power(0, 5);  // 0
	 * ```
	 */
	static power(base: number, exponent: number): number {
		if (exponent === 0) {
			return 1;
		}
		if (base === 0) {
			return 0;
		}
		const logResult = (this.LOG[base] * exponent) % 255;
		return this.antilog(logResult);
	}

	/**
	 * Calcula el inverso multiplicativo en GF(2^8).
	 *
	 * @description Encuentra x tal que a * x = 1.
	 * Usa la identidad: a^(-1) = antilog(255 - log(a)).
	 *
	 * @param a - Valor a invertir
	 * @returns Inverso multiplicativo
	 *
	 * @example
	 * ```typescript
	 * const inv = GaloisField.inverse(2);
	 * GaloisField.multiply(2, inv); // 1
	 * ```
	 *
	 * @throws {Error} Si a es 0 (no tiene inverso)
	 */
	static inverse(a: number): number {
		if (a === 0) {
			throw new Error("Zero has no multiplicative inverse in GF(2^8)");
		}
		return this.antilog(255 - this.LOG[a]);
	}
}
