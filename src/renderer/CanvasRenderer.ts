/**
 * @fileoverview Renderizador de códigos QR para Canvas
 * @description Implementa el renderizado de QR codes en elementos HTML Canvas.
 * @module renderer/CanvasRenderer
 */

import type { QRMatrix, RenderOptions } from "../types";

/** Opciones por defecto de renderizado */
const DEFAULT_OPTIONS: Required<RenderOptions> = {
	scale: 10,
	margin: 4,
	darkColor: "#000000",
	lightColor: "#ffffff",
};

/**
 * Renderizador de códigos QR para elementos Canvas.
 *
 * @description Convierte una matriz QR en una imagen renderizada
 * en un elemento HTML Canvas. Soporta personalización de colores,
 * escala y margen.
 *
 * @example
 * ```typescript
 * const qr = new QRCode('Hello');
 * const result = qr.generate();
 *
 * const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
 * CanvasRenderer.render(canvas, result.matrix, {
 *   scale: 10,
 *   darkColor: '#000080'
 * });
 * ```
 */
export class CanvasRenderer {
	/**
	 * Renderiza una matriz QR en un canvas.
	 *
	 * @param canvas - Elemento canvas donde renderizar
	 * @param matrix - Matriz del código QR
	 * @param options - Opciones de renderizado
	 *
	 * @example
	 * ```typescript
	 * CanvasRenderer.render(canvas, matrix, { scale: 5 });
	 * ```
	 */
	static render(
		canvas: HTMLCanvasElement,
		matrix: QRMatrix,
		options: RenderOptions = {},
	): void {
		const opts = { ...DEFAULT_OPTIONS, ...options };
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			throw new Error("No se pudo obtener el contexto 2D del canvas");
		}

		const size = matrix.length;
		const totalSize = (size + opts.margin * 2) * opts.scale;

		// Configurar tamaño del canvas
		canvas.width = totalSize;
		canvas.height = totalSize;

		// Fondo (color claro)
		ctx.fillStyle = opts.lightColor;
		ctx.fillRect(0, 0, totalSize, totalSize);

		// Dibujar módulos oscuros
		ctx.fillStyle = opts.darkColor;

		for (let row = 0; row < size; row++) {
			for (let col = 0; col < size; col++) {
				if (matrix[row][col] === 1) {
					const x = (col + opts.margin) * opts.scale;
					const y = (row + opts.margin) * opts.scale;
					ctx.fillRect(x, y, opts.scale, opts.scale);
				}
			}
		}
	}

	/**
	 * Crea un canvas nuevo y renderiza el QR.
	 *
	 * @param matrix - Matriz del código QR
	 * @param options - Opciones de renderizado
	 * @returns Elemento canvas con el QR renderizado
	 *
	 * @example
	 * ```typescript
	 * const canvas = CanvasRenderer.createCanvas(matrix);
	 * document.body.appendChild(canvas);
	 * ```
	 */
	static createCanvas(
		matrix: QRMatrix,
		options: RenderOptions = {},
	): HTMLCanvasElement {
		const canvas = document.createElement("canvas");
		this.render(canvas, matrix, options);
		return canvas;
	}

	/**
	 * Obtiene el código QR como Data URL.
	 *
	 * @description Genera una URL de datos en formato PNG que puede
	 * usarse como src de una imagen o para descarga.
	 *
	 * @param matrix - Matriz del código QR
	 * @param options - Opciones de renderizado
	 * @returns Data URL en formato PNG
	 *
	 * @example
	 * ```typescript
	 * const dataUrl = CanvasRenderer.toDataURL(matrix);
	 * const img = document.createElement('img');
	 * img.src = dataUrl;
	 * ```
	 */
	static toDataURL(matrix: QRMatrix, options: RenderOptions = {}): string {
		const canvas = this.createCanvas(matrix, options);
		return canvas.toDataURL("image/png");
	}

	/**
	 * Obtiene el código QR como Blob.
	 *
	 * @description Genera un Blob PNG que puede usarse para
	 * descargas o subir a un servidor.
	 *
	 * @param matrix - Matriz del código QR
	 * @param options - Opciones de renderizado
	 * @returns Promise que resuelve con el Blob PNG
	 *
	 * @example
	 * ```typescript
	 * const blob = await CanvasRenderer.toBlob(matrix);
	 * const url = URL.createObjectURL(blob);
	 * ```
	 */
	static toBlob(matrix: QRMatrix, options: RenderOptions = {}): Promise<Blob> {
		return new Promise((resolve, reject) => {
			const canvas = this.createCanvas(matrix, options);
			canvas.toBlob((blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error("Error al generar el Blob"));
				}
			}, "image/png");
		});
	}

	/**
	 * Calcula el tamaño final del canvas.
	 *
	 * @param matrixSize - Tamaño de la matriz QR
	 * @param options - Opciones de renderizado
	 * @returns Tamaño en píxeles
	 *
	 * @example
	 * ```typescript
	 * const size = CanvasRenderer.calculateSize(21, { scale: 10 });
	 * // 290 (21 + 4*2 margin) * 10
	 * ```
	 */
	static calculateSize(
		matrixSize: number,
		options: RenderOptions = {},
	): number {
		const opts = { ...DEFAULT_OPTIONS, ...options };
		return (matrixSize + opts.margin * 2) * opts.scale;
	}

	/**
	 * Renderiza con módulos redondeados (estilo moderno).
	 *
	 * @param canvas - Elemento canvas donde renderizar
	 * @param matrix - Matriz del código QR
	 * @param options - Opciones de renderizado
	 * @param cornerRadius - Radio de las esquinas (0-0.5)
	 *
	 * @example
	 * ```typescript
	 * CanvasRenderer.renderRounded(canvas, matrix, { scale: 10 }, 0.3);
	 * ```
	 */
	static renderRounded(
		canvas: HTMLCanvasElement,
		matrix: QRMatrix,
		options: RenderOptions = {},
		cornerRadius: number = 0.4,
	): void {
		const opts = { ...DEFAULT_OPTIONS, ...options };
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			throw new Error("No se pudo obtener el contexto 2D del canvas");
		}

		const size = matrix.length;
		const totalSize = (size + opts.margin * 2) * opts.scale;
		const radius = opts.scale * Math.min(Math.max(cornerRadius, 0), 0.5);

		// Configurar tamaño del canvas
		canvas.width = totalSize;
		canvas.height = totalSize;

		// Fondo
		ctx.fillStyle = opts.lightColor;
		ctx.fillRect(0, 0, totalSize, totalSize);

		// Módulos
		ctx.fillStyle = opts.darkColor;

		for (let row = 0; row < size; row++) {
			for (let col = 0; col < size; col++) {
				if (matrix[row][col] === 1) {
					const x = (col + opts.margin) * opts.scale;
					const y = (row + opts.margin) * opts.scale;
					this.roundedRect(ctx, x, y, opts.scale, opts.scale, radius);
				}
			}
		}
	}

	/**
	 * Dibuja un rectángulo con esquinas redondeadas.
	 *
	 * @param ctx - Contexto 2D del canvas
	 * @param x - Posición X
	 * @param y - Posición Y
	 * @param width - Ancho
	 * @param height - Alto
	 * @param radius - Radio de las esquinas
	 *
	 * @internal
	 */
	private static roundedRect(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number,
	): void {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		ctx.fill();
	}
}
