/**
 * @fileoverview Clase de error personalizada para QR Code Generator
 * @module errors
 */

import type { QRErrorCode } from "./types";

/**
 * Error personalizado para la librería QR Code Generator.
 *
 * @description Extiende Error nativo con código de error tipado
 * para facilitar el manejo de errores específicos.
 *
 * @example
 * ```typescript
 * try {
 *   const qr = new QRCode({ content: '' });
 * } catch (error) {
 *   if (error instanceof QRCodeError) {
 *     console.log(error.code); // 'EMPTY_CONTENT'
 *   }
 * }
 * ```
 */
export class QRCodeError extends Error {
	/**
	 * Código de error para identificación programática.
	 */
	public readonly code: QRErrorCode;

	/**
	 * Crea una nueva instancia de QRCodeError.
	 *
	 * @param message - Mensaje descriptivo del error
	 * @param code - Código de error tipado
	 *
	 * @example
	 * ```typescript
	 * throw new QRCodeError('Content cannot be empty', 'EMPTY_CONTENT');
	 * ```
	 */
	constructor(message: string, code: QRErrorCode) {
		super(message);
		this.name = "QRCodeError";
		this.code = code;

		// Mantiene el stack trace correcto en V8
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, QRCodeError);
		}
	}
}
