/**
 * @fileoverview Detector automático de modo de codificación QR
 * @description Determina el modo de codificación más eficiente para los datos dados.
 * @module encoder/ModeDetector
 */

import type { EncodingMode, ErrorCorrectionLevel, QRVersion } from "../types";
import type { CapacityInfo } from "../types";
import {
	NUMERIC_CAPACITY,
	ALPHANUMERIC_CAPACITY,
	BYTE_CAPACITY,
	ALPHANUMERIC_CHARS,
} from "../constants";

/**
 * Patrón para detectar contenido numérico.
 */
const NUMERIC_PATTERN = /^\d+$/;

/**
 * Conjunto de caracteres alfanuméricos válidos.
 */
const ALPHANUMERIC_SET = new Set(Object.keys(ALPHANUMERIC_CHARS));

/**
 * Detector y selector de modo de codificación QR.
 *
 * @description Proporciona utilidades para:
 * - Detectar el modo más eficiente para encodear datos
 * - Verificar si datos pueden ser codificados en un modo específico
 * - Encontrar la versión mínima para datos y modo dado
 *
 * @example
 * ```typescript
 * // Detectar mejor modo
 * const mode = ModeDetector.detectMode('12345'); // 'numeric'
 * const mode2 = ModeDetector.detectMode('HELLO 123'); // 'alphanumeric'
 * const mode3 = ModeDetector.detectMode('hello'); // 'byte'
 *
 * // Encontrar versión mínima
 * const version = ModeDetector.findMinVersion('12345', 'numeric', 'M'); // 1
 * ```
 */
export class ModeDetector {
	/**
	 * Detecta el modo de codificación más eficiente para los datos.
	 *
	 * @description Evalúa los datos y retorna el modo más eficiente:
	 * 1. Numérico (solo dígitos 0-9) - más eficiente
	 * 2. Alfanumérico (A-Z, 0-9, símbolos limitados) - intermedio
	 * 3. Byte (cualquier dato) - menos eficiente pero universal
	 *
	 * @param data - Datos a evaluar
	 * @returns Modo de codificación más eficiente
	 *
	 * @example
	 * ```typescript
	 * ModeDetector.detectMode('12345');     // 'numeric'
	 * ModeDetector.detectMode('123.45');    // 'byte' (el punto no es numérico)
	 * ModeDetector.detectMode('ABC123');    // 'alphanumeric'
	 * ModeDetector.detectMode('Hello');     // 'byte' (minúsculas)
	 * ModeDetector.detectMode('HELLO-123'); // 'alphanumeric'
	 * ```
	 */
	static detectMode(data: string): EncodingMode {
		if (data.length === 0) {
			return "byte";
		}

		// Verificar si es numérico
		if (NUMERIC_PATTERN.test(data)) {
			return "numeric";
		}

		// Verificar si es alfanumérico
		if (ModeDetector.isAlphanumeric(data)) {
			return "alphanumeric";
		}

		// Default: byte mode
		return "byte";
	}

	/**
	 * Verifica si todos los caracteres son alfanuméricos válidos.
	 *
	 * @param data - Datos a verificar
	 * @returns true si todos los caracteres son alfanuméricos
	 */
	static isAlphanumeric(data: string): boolean {
		for (const char of data) {
			if (!ALPHANUMERIC_SET.has(char)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Verifica si los datos son puramente numéricos.
	 *
	 * @param data - Datos a verificar
	 * @returns true si los datos solo contienen dígitos
	 */
	static isNumeric(data: string): boolean {
		return NUMERIC_PATTERN.test(data);
	}

	/**
	 * Obtiene la tabla de capacidad para un modo dado.
	 *
	 * @param mode - Modo de codificación
	 * @returns Tabla de capacidad indexada por versión-1
	 */
	static getCapacityTable(mode: EncodingMode): readonly CapacityInfo[] {
		switch (mode) {
			case "numeric":
				return NUMERIC_CAPACITY;
			case "alphanumeric":
				return ALPHANUMERIC_CAPACITY;
			case "byte":
			default:
				return BYTE_CAPACITY;
		}
	}

	/**
	 * Obtiene la capacidad para una versión, modo y nivel de corrección dados.
	 *
	 * @param version - Versión QR (1-40)
	 * @param mode - Modo de codificación
	 * @param errorLevel - Nivel de corrección de errores
	 * @returns Número máximo de caracteres
	 *
	 * @example
	 * ```typescript
	 * ModeDetector.getCapacity(1, 'numeric', 'M'); // 34
	 * ModeDetector.getCapacity(1, 'alphanumeric', 'M'); // 20
	 * ModeDetector.getCapacity(1, 'byte', 'M'); // 14
	 * ```
	 */
	static getCapacity(
		version: QRVersion,
		mode: EncodingMode,
		errorLevel: ErrorCorrectionLevel,
	): number {
		const table = ModeDetector.getCapacityTable(mode);
		return table[version - 1][errorLevel];
	}

	/**
	 * Encuentra la versión mínima que puede contener los datos.
	 *
	 * @param data - Datos a codificar
	 * @param mode - Modo de codificación
	 * @param errorLevel - Nivel de corrección de errores
	 * @returns Versión mínima necesaria, o null si los datos son muy largos
	 *
	 * @example
	 * ```typescript
	 * ModeDetector.findMinVersion('12345', 'numeric', 'M'); // 1
	 * ModeDetector.findMinVersion('HELLO', 'alphanumeric', 'H'); // 1
	 * ```
	 */
	static findMinVersion(
		data: string,
		mode: EncodingMode,
		errorLevel: ErrorCorrectionLevel,
	): QRVersion | null {
		const dataLength = data.length;
		const table = ModeDetector.getCapacityTable(mode);

		for (let v = 1; v <= 40; v++) {
			const capacity = table[v - 1][errorLevel];
			if (capacity >= dataLength) {
				return v as QRVersion;
			}
		}

		return null;
	}

	/**
	 * Encuentra la combinación óptima de modo y versión para los datos.
	 *
	 * @description Automáticamente selecciona el modo más eficiente
	 * y encuentra la versión mínima.
	 *
	 * @param data - Datos a codificar
	 * @param errorLevel - Nivel de corrección de errores
	 * @returns Objeto con modo y versión óptimos, o null si los datos son muy largos
	 *
	 * @example
	 * ```typescript
	 * ModeDetector.findOptimal('12345', 'M');
	 * // { mode: 'numeric', version: 1 }
	 *
	 * ModeDetector.findOptimal('Hello World!', 'H');
	 * // { mode: 'byte', version: 2 }
	 * ```
	 */
	static findOptimal(
		data: string,
		errorLevel: ErrorCorrectionLevel,
	): { mode: EncodingMode; version: QRVersion } | null {
		const mode = ModeDetector.detectMode(data);
		const version = ModeDetector.findMinVersion(data, mode, errorLevel);

		if (version === null) {
			return null;
		}

		return { mode, version };
	}
}
