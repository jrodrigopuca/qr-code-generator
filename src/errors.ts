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
 *     console.log(error.code); // 'DATA_EMPTY'
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
	 * @param code - Código de error tipado
	 * @param message - Mensaje descriptivo del error
	 *
	 * @example
	 * ```typescript
	 * throw new QRCodeError('DATA_EMPTY', 'Content cannot be empty');
	 * ```
	 */
	constructor(code: QRErrorCode, message: string) {
		super(message);
		this.name = "QRCodeError";
		this.code = code;

		// Mantiene el stack trace correcto en V8 (Node.js)
		const ErrorWithCapture = Error as typeof Error & {
			captureStackTrace?: (target: object, constructor: Function) => void;
		};
		if (ErrorWithCapture.captureStackTrace) {
			ErrorWithCapture.captureStackTrace(this, QRCodeError);
		}
	}
}
