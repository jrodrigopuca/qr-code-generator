/**
 * @fileoverview QR Code Generator - Entry Point
 * @description Zero-dependency QR code generator library written in TypeScript.
 * Implements ISO/IEC 18004 standard for QR code generation.
 *
 * @packageDocumentation
 * @module qr-pure
 * @license MIT
 *
 * @example Basic Usage
 * ```typescript
 * import { QRCode, generateQR } from 'qr-pure';
 *
 * // Simple usage with helper function
 * const result = generateQR('Hello World');
 * console.log(result.matrix);
 *
 * // Full control with class
 * const qr = new QRCode('Hello World', {
 *   errorCorrectionLevel: 'H',
 *   version: 'auto',
 * });
 * const { matrix, version, size } = qr.generate();
 * ```
 *
 * @example Canvas Rendering
 * ```typescript
 * import { renderToCanvas } from 'qr-pure';
 *
 * const canvas = document.getElementById('qr-canvas');
 * renderToCanvas(canvas, 'Hello World', {
 *   scale: 10,
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
	CapacityInfo,
	BlockInfo,
	BlocksConfig,
} from "./types";

// Export error class
export { QRCodeError } from "./errors";

// Export constants (useful for advanced users)
export * as constants from "./constants";

// Export utilities
export { toBinary, fromBinary, chunkString } from "./utils";

// Export main class
export { QRCode } from "./QRCode";

// Export renderers
export { CanvasRenderer, SVGRenderer, TerminalRenderer } from "./renderer";
export type { SVGRenderOptions, ModuleShape } from "./renderer";
export type { TerminalRenderOptions, TerminalStyle } from "./renderer";

// Export internal modules for advanced usage
export {
	ByteEncoder,
	NumericEncoder,
	AlphanumericEncoder,
	ModeDetector,
} from "./encoder";
export { GaloisField, ReedSolomon } from "./correction";
export {
	FinderPattern,
	AlignmentPattern,
	TimingPattern,
	FormatInfo,
} from "./patterns";
export { MaskEvaluator } from "./mask";

// Import for helper functions
import { QRCode } from "./QRCode";
import { CanvasRenderer, SVGRenderer, TerminalRenderer } from "./renderer";
import type { TerminalRenderOptions } from "./renderer";
import type { QRCodeOptions, RenderOptions, QRCodeResult } from "./types";

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
 *   errorCorrectionLevel: 'H',
 *   version: 2,
 * });
 * ```
 *
 * @throws {QRCodeError} Si el contenido está vacío o excede la capacidad
 */
export function generateQR(
	content: string,
	options?: QRCodeOptions,
): QRCodeResult {
	const qr = new QRCode(content, options);
	return qr.generate();
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
 *   scale: 10,
 *   margin: 4,
 *   darkColor: '#1a1a1a',
 * });
 * ```
 *
 * @throws {QRCodeError} Si el canvas es inválido o el contenido excede la capacidad
 */
export function renderToCanvas(
	canvas: HTMLCanvasElement,
	content: string,
	options?: QRCodeOptions & RenderOptions,
): void {
	const qrOptions: QRCodeOptions = {
		errorCorrectionLevel: options?.errorCorrectionLevel,
		version: options?.version,
		mask: options?.mask,
	};

	const renderOptions: RenderOptions = {
		scale: options?.scale,
		margin: options?.margin,
		darkColor: options?.darkColor,
		lightColor: options?.lightColor,
	};

	const qr = new QRCode(content, qrOptions);
	const result = qr.generate();
	CanvasRenderer.render(canvas, result.matrix, renderOptions);
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
 * const svg = renderToSVG('Hello World', { scale: 10 });
 * document.body.innerHTML = svg;
 * ```
 *
 * @throws {QRCodeError} Si el contenido excede la capacidad
 */
export function renderToSVG(
	content: string,
	options?: QRCodeOptions & RenderOptions,
): string {
	const qrOptions: QRCodeOptions = {
		errorCorrectionLevel: options?.errorCorrectionLevel,
		version: options?.version,
		mask: options?.mask,
	};

	const renderOptions: RenderOptions = {
		scale: options?.scale,
		margin: options?.margin,
		darkColor: options?.darkColor,
		lightColor: options?.lightColor,
	};

	const qr = new QRCode(content, qrOptions);
	const result = qr.generate();
	return SVGRenderer.render(result.matrix, renderOptions);
}

/**
 * Genera un código QR como texto para terminal.
 *
 * @description Función helper para obtener el QR como texto ASCII/Unicode
 * para imprimir en la consola. Ideal para herramientas CLI y debugging.
 *
 * @param content - Texto o datos a codificar
 * @param options - Opciones de generación y renderizado terminal
 * @returns Cadena con el QR representado en texto
 *
 * @example
 * ```typescript
 * import { renderToTerminal } from 'qr-pure';
 *
 * console.log(renderToTerminal('Hello World'));
 *
 * // Modo compacto
 * console.log(renderToTerminal('Hello', { style: 'compact' }));
 * ```
 *
 * @throws {QRCodeError} Si el contenido excede la capacidad
 */
export function renderToTerminal(
	content: string,
	options?: QRCodeOptions & TerminalRenderOptions,
): string {
	const qrOptions: QRCodeOptions = {
		errorCorrectionLevel: options?.errorCorrectionLevel,
		version: options?.version,
		mask: options?.mask,
	};

	const terminalOptions: TerminalRenderOptions = {
		style: options?.style,
		margin: options?.margin,
		invert: options?.invert,
	};

	const qr = new QRCode(content, qrOptions);
	const result = qr.generate();
	return TerminalRenderer.render(result.matrix, terminalOptions);
}

// Version info
export const VERSION = "2.0.5";
