/**
 * @fileoverview QR Code Generator - Entry Point
 * @description Zero-dependency QR code generator library written in TypeScript.
 * Implements ISO/IEC 18004 standard for QR code generation.
 *
 * @packageDocumentation
 * @module qr-generator
 * @license MIT
 *
 * @example Basic Usage
 * ```typescript
 * import { QRCode, generateQR } from 'qr-generator';
 *
 * // Simple usage with helper function
 * const result = generateQR('Hello World');
 * console.log(result.matrix);
 *
 * // Full control with class
 * const qr = new QRCode({
 *   content: 'Hello World',
 *   errorCorrection: 'H',
 *   version: 'auto',
 * });
 * const { matrix, version, size } = qr.generate();
 * ```
 *
 * @example Canvas Rendering
 * ```typescript
 * import { renderToCanvas } from 'qr-generator';
 *
 * const canvas = document.getElementById('qr-canvas');
 * renderToCanvas(canvas, 'Hello World', {
 *   size: 256,
 *   darkColor: '#000000',
 * });
 * ```
 */

// Re-export types
export type {
	ErrorCorrectionLevel,
	QRVersion,
	MaskPattern,
	EncodingMode,
	QRCodeOptions,
	RenderOptions,
	QRMatrix,
	QRCodeResult,
	QRErrorCode,
} from "./types";

// Export error class
export { QRCodeError } from "./errors";

// Export constants (useful for advanced users)
export * as constants from "./constants";

// Export utilities
export { toBinary, fromBinary, chunkString } from "./utils";

// TODO: Fase 2 - Export main class
// export { QRCode } from './QRCode';

// TODO: Fase 2/5 - Export renderers
// export { CanvasRenderer, SVGRenderer, MatrixRenderer } from './renderer';

/**
 * Genera un código QR a partir de texto.
 *
 * @description Función helper para generar códigos QR de forma simple.
 * Selecciona automáticamente la mejor versión y máscara si no se especifican.
 *
 * @param content - Texto o datos a codificar
 * @param options - Opciones de configuración opcionales
 * @returns Resultado con la matriz del QR y metadatos
 *
 * @example
 * ```typescript
 * // Uso simple
 * const qr = generateQR('https://example.com');
 *
 * // Con opciones
 * const qr = generateQR('Hello', {
 *   errorCorrection: 'H',
 *   version: 2,
 * });
 * ```
 *
 * @throws {QRCodeError} Si el contenido está vacío o excede la capacidad
 */
export function generateQR(
	content: string,
	_options?: Partial<Omit<import("./types").QRCodeOptions, "content">>,
): import("./types").QRCodeResult {
	// TODO: Fase 2 - Implementar usando nueva clase QRCode
	// const qr = new QRCode({ content, ...options });
	// return qr.generate();

	// Placeholder temporal usando código legacy
	throw new Error("Not implemented yet. Use legacy QR class from qr.legacy.ts");
}

/**
 * Renderiza un código QR en un elemento canvas.
 *
 * @description Función helper para renderizar QR directamente en canvas HTML5.
 *
 * @param canvas - Elemento canvas HTML donde renderizar
 * @param content - Texto o datos a codificar
 * @param options - Opciones de generación y renderizado
 *
 * @example
 * ```typescript
 * const canvas = document.getElementById('qr') as HTMLCanvasElement;
 * renderToCanvas(canvas, 'Hello World', {
 *   size: 300,
 *   margin: 4,
 *   darkColor: '#1a1a1a',
 * });
 * ```
 *
 * @throws {QRCodeError} Si el canvas es inválido o el contenido excede la capacidad
 */
export function renderToCanvas(
	_canvas: HTMLCanvasElement,
	_content: string,
	_options?: Partial<
		import("./types").QRCodeOptions & import("./types").RenderOptions
	>,
): void {
	// TODO: Fase 2/5 - Implementar
	throw new Error("Not implemented yet");
}

/**
 * Genera un código QR como cadena SVG.
 *
 * @description Función helper para obtener el QR como markup SVG.
 * Útil para renderizado server-side o inserción directa en HTML.
 *
 * @param content - Texto o datos a codificar
 * @param options - Opciones de generación y renderizado
 * @returns Cadena con el markup SVG completo
 *
 * @example
 * ```typescript
 * const svg = renderToSVG('Hello World', { size: 200 });
 * document.body.innerHTML = svg;
 * ```
 *
 * @throws {QRCodeError} Si el contenido excede la capacidad
 */
export function renderToSVG(
	_content: string,
	_options?: Partial<
		import("./types").QRCodeOptions & import("./types").RenderOptions
	>,
): string {
	// TODO: Fase 5 - Implementar
	throw new Error("Not implemented yet");
}

// Version info
export const VERSION = "1.0.0-alpha";
