/**
 * @fileoverview Codificación Reed-Solomon para corrección de errores
 * @description Implementa el algoritmo Reed-Solomon utilizado en códigos QR
 * para generar codewords de corrección de errores.
 * @module correction/ReedSolomon
 * @see {@link https://www.thonky.com/qr-code-tutorial/error-correction-coding}
 */

import { GaloisField } from "./GaloisField";

/**
 * Implementación del codificador Reed-Solomon para códigos QR.
 *
 * @description Reed-Solomon es un código de corrección de errores que
 * puede detectar y corregir múltiples errores. Para códigos QR, se usa
 * sobre GF(2^8) con el polinomio primitivo x^8 + x^4 + x^3 + x^2 + 1.
 *
 * El número de errores corregibles es floor(eccCount / 2).
 *
 * @example
 * ```typescript
 * // Crear codificador con 10 codewords de corrección
 * const rs = new ReedSolomon(10);
 *
 * // Codificar datos
 * const data = [32, 91, 11, 120, 209, 114, 220, 77];
 * const ecc = rs.encode(data);
 * console.log(ecc); // Array de 10 codewords de corrección
 * ```
 */
export class ReedSolomon {
	/**
	 * Número de codewords de corrección de errores a generar.
	 */
	private readonly eccCount: number;

	/**
	 * Polinomio generador pre-calculado.
	 * @internal
	 */
	private readonly generatorPoly: number[];

	/**
	 * Crea una nueva instancia del codificador Reed-Solomon.
	 *
	 * @param eccCount - Número de codewords de corrección de errores
	 *
	 * @example
	 * ```typescript
	 * const rs = new ReedSolomon(17); // Para corrección H en v1
	 * ```
	 *
	 * @throws {Error} Si eccCount es menor a 1
	 */
	constructor(eccCount: number) {
		if (eccCount < 1) {
			throw new Error("ECC count must be at least 1");
		}
		this.eccCount = eccCount;
		this.generatorPoly = this.createGeneratorPolynomial(eccCount);
	}

	/**
	 * Genera los codewords de corrección de errores para los datos.
	 *
	 * @description Realiza la división polinomial del mensaje por el
	 * polinomio generador. El resto de esta división son los codewords
	 * de corrección de errores.
	 *
	 * @param data - Array de codewords de datos (cada uno 0-255)
	 * @returns Array de codewords de corrección de errores
	 *
	 * @example
	 * ```typescript
	 * const rs = new ReedSolomon(10);
	 * const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
	 * const ecc = rs.encode(data);
	 * // ecc contiene 10 codewords de corrección
	 * ```
	 */
	encode(data: number[]): number[] {
		// Inicializa el registro con los datos seguidos de ceros
		const register = [...data, ...new Array(this.eccCount).fill(0)];

		// División polinomial
		for (let i = 0; i < data.length; i++) {
			const coef = register[i];
			if (coef !== 0) {
				for (let j = 0; j < this.generatorPoly.length; j++) {
					register[i + j] = GaloisField.add(
						register[i + j],
						GaloisField.multiply(this.generatorPoly[j], coef),
					);
				}
			}
		}

		// El resto (últimos eccCount elementos) son los codewords de corrección
		return register.slice(data.length);
	}

	/**
	 * Crea el polinomio generador de grado n.
	 *
	 * @description El polinomio generador para Reed-Solomon es:
	 * g(x) = (x - α^0)(x - α^1)...(x - α^(n-1))
	 *
	 * Los coeficientes se almacenan en notación de exponentes α.
	 *
	 * @param degree - Grado del polinomio (= número de ECC codewords)
	 * @returns Coeficientes del polinomio generador
	 *
	 * @example
	 * ```typescript
	 * // Polinomio generador de grado 2: (x - α^0)(x - α^1)
	 * // = x^2 - (α^0 + α^1)x + α^0 * α^1
	 * // = x^2 + α^25 * x + α^1 (en GF(2^8), - = +)
	 * const poly = rs.getGeneratorPolynomial();
	 * ```
	 *
	 * @internal
	 */
	private createGeneratorPolynomial(degree: number): number[] {
		// Empezar con (x - α^0) = [1, 1] en forma de coeficientes
		let poly = [1];

		for (let i = 0; i < degree; i++) {
			// Multiplicar por (x - α^i) = (x + α^i) en GF(2^8)
			const factor = [1, GaloisField.antilog(i)];
			poly = this.multiplyPolynomials(poly, factor);
		}

		return poly;
	}

	/**
	 * Multiplica dos polinomios en GF(2^8).
	 *
	 * @param poly1 - Primer polinomio (coeficientes de mayor a menor grado)
	 * @param poly2 - Segundo polinomio
	 * @returns Producto de los polinomios
	 *
	 * @internal
	 */
	private multiplyPolynomials(poly1: number[], poly2: number[]): number[] {
		const result = new Array(poly1.length + poly2.length - 1).fill(0);

		for (let i = 0; i < poly1.length; i++) {
			for (let j = 0; j < poly2.length; j++) {
				result[i + j] = GaloisField.add(
					result[i + j],
					GaloisField.multiply(poly1[i], poly2[j]),
				);
			}
		}

		return result;
	}

	/**
	 * Obtiene el polinomio generador calculado.
	 *
	 * @description Útil para depuración y verificación.
	 *
	 * @returns Copia del polinomio generador
	 *
	 * @example
	 * ```typescript
	 * const rs = new ReedSolomon(7);
	 * console.log(rs.getGeneratorPolynomial());
	 * // [1, 127, 122, 154, 164, 11, 68, 117]
	 * ```
	 */
	getGeneratorPolynomial(): number[] {
		return [...this.generatorPoly];
	}

	/**
	 * Obtiene el número de codewords de corrección.
	 *
	 * @returns Número de codewords ECC
	 */
	getEccCount(): number {
		return this.eccCount;
	}
}
