/**
 * @fileoverview Type definitions for QR Code Generator
 * @module types
 */

/**
 * Nivel de corrección de errores según ISO/IEC 18004.
 * - L: ~7% de recuperación
 * - M: ~15% de recuperación
 * - Q: ~25% de recuperación
 * - H: ~30% de recuperación
 */
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

/**
 * Versión del código QR (1-40).
 * Cada versión incrementa el tamaño en 4 módulos por lado.
 * - Versión 1: 21x21 módulos
 * - Versión 40: 177x177 módulos
 */
export type QRVersion =
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15
	| 16
	| 17
	| 18
	| 19
	| 20
	| 21
	| 22
	| 23
	| 24
	| 25
	| 26
	| 27
	| 28
	| 29
	| 30
	| 31
	| 32
	| 33
	| 34
	| 35
	| 36
	| 37
	| 38
	| 39
	| 40;

/**
 * Patrón de máscara para datos (0-7).
 * Cada patrón tiene una fórmula diferente para determinar
 * qué módulos invertir.
 */
export type MaskPattern = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Modo de codificación de datos.
 * - numeric: Solo dígitos 0-9 (más eficiente)
 * - alphanumeric: 0-9, A-Z, espacio, $%*+-./:
 * - byte: Cualquier byte (ISO-8859-1 o UTF-8)
 * - kanji: Caracteres Kanji (Shift JIS)
 */
export type EncodingMode = "numeric" | "alphanumeric" | "byte" | "kanji";

/**
 * Opciones de configuración para generar un código QR.
 *
 * @example
 * ```typescript
 * const options: QRCodeOptions = {
 *   errorCorrectionLevel: 'M',
 *   version: 'auto',
 * };
 * ```
 */
export interface QRCodeOptions {
	/**
	 * Versión específica (1-40) o 'auto' para selección automática.
	 * @default 'auto'
	 */
	version?: QRVersion | "auto";

	/**
	 * Nivel de corrección de errores.
	 * @default 'M'
	 */
	errorCorrectionLevel?: ErrorCorrectionLevel;

	/**
	 * Patrón de máscara específico (0-7) o 'auto' para selección óptima.
	 * @default 'auto'
	 */
	mask?: MaskPattern | "auto";

	/**
	 * Modo de codificación o 'auto' para detección automática.
	 * @default 'auto'
	 */
	mode?: EncodingMode | "auto";
}

/**
 * Opciones de renderizado para la salida visual del QR.
 *
 * @example
 * ```typescript
 * const renderOptions: RenderOptions = {
 *   scale: 10,
 *   margin: 4,
 *   darkColor: '#000000',
 *   lightColor: '#ffffff',
 * };
 * ```
 */
export interface RenderOptions {
	/**
	 * Escala en píxeles por módulo.
	 * @default 10
	 */
	scale?: number;

	/**
	 * Margen en módulos (quiet zone).
	 * El estándar recomienda mínimo 4 módulos.
	 * @default 4
	 */
	margin?: number;

	/**
	 * Color de los módulos oscuros (datos).
	 * @default '#000000'
	 */
	darkColor?: string;

	/**
	 * Color de los módulos claros.
	 * @default '#ffffff'
	 */
	lightColor?: string;
}

/**
 * Matriz binaria del código QR.
 * - 0: Módulo claro
 * - 1: Módulo oscuro
 */
export type QRMatrix = (0 | 1)[][];

/**
 * Resultado de la generación de un código QR.
 * Contiene la matriz binaria y metadatos del QR generado.
 */
export interface QRCodeResult {
	/** Versión utilizada (1-40) */
	version: QRVersion;

	/** Nivel de corrección de errores aplicado */
	errorCorrectionLevel: ErrorCorrectionLevel;

	/** Patrón de máscara aplicado (0-7) */
	maskPattern: MaskPattern;

	/** Dimensión de la matriz (módulos por lado) */
	size: number;

	/** Matriz binaria del código QR */
	matrix: QRMatrix;
}

/**
 * Información de capacidad para una versión y nivel de corrección.
 */
export interface CapacityInfo {
	L: number;
	M: number;
	Q: number;
	H: number;
}

/**
 * Información de bloques para interleaving.
 * [bloques grupo 1, codewords por bloque g1, bloques grupo 2, codewords por bloque g2]
 */
export type BlockInfo = [number, number, number, number];

/**
 * Configuración de bloques por nivel de corrección.
 */
export interface BlocksConfig {
	L: BlockInfo;
	M: BlockInfo;
	Q: BlockInfo;
	H: BlockInfo;
}

/**
 * Posición en la matriz del QR.
 */
export interface Position {
	row: number;
	col: number;
}

/**
 * Códigos de error personalizados para la librería.
 */
export type QRErrorCode =
	| "DATA_EMPTY"
	| "DATA_TOO_LONG"
	| "VERSION_TOO_SMALL"
	| "INVALID_VERSION"
	| "INVALID_CHARACTER"
	| "INVALID_MASK"
	| "INVALID_MODE";
