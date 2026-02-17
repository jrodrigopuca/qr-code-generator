/**
 * @fileoverview Renderizador de códigos QR para SVG
 * @description Implementa el renderizado de QR codes como elementos SVG.
 * @module renderer/SVGRenderer
 */

import type { QRMatrix, RenderOptions } from "../types";

/** Opciones por defecto de renderizado SVG */
const DEFAULT_OPTIONS: Required<RenderOptions> = {
	scale: 10,
	margin: 4,
	darkColor: "#000000",
	lightColor: "#ffffff",
};

/**
 * Opciones adicionales específicas para SVG.
 */
export interface SVGRenderOptions extends RenderOptions {
	/**
	 * Incluir declaración XML en la salida.
	 * @default false
	 */
	xmlDeclaration?: boolean;

	/**
	 * Usar optimización de paths para módulos adyacentes.
	 * @default true
	 */
	optimizePaths?: boolean;
}

/**
 * Renderizador de códigos QR como SVG.
 *
 * @description Convierte una matriz QR en markup SVG. Ideal para
 * renderizado server-side, escalado sin pérdida de calidad,
 * y manipulación CSS/JavaScript.
 *
 * @example
 * ```typescript
 * const qr = new QRCode('Hello');
 * const result = qr.generate();
 *
 * const svg = SVGRenderer.render(result.matrix, {
 *   scale: 10,
 *   darkColor: '#1a1a1a'
 * });
 *
 * document.body.innerHTML = svg;
 * ```
 */
export class SVGRenderer {
	/**
	 * Renderiza una matriz QR como cadena SVG.
	 *
	 * @param matrix - Matriz del código QR (0 = claro, 1 = oscuro)
	 * @param options - Opciones de renderizado
	 * @returns Cadena con el markup SVG completo
	 *
	 * @example
	 * ```typescript
	 * const svg = SVGRenderer.render(matrix, {
	 *   scale: 5,
	 *   margin: 2,
	 *   darkColor: '#000080'
	 * });
	 * ```
	 */
	static render(matrix: QRMatrix, options: SVGRenderOptions = {}): string {
		const opts = { ...DEFAULT_OPTIONS, ...options };
		const size = matrix.length;
		const totalSize = (size + opts.margin * 2) * opts.scale;

		const parts: string[] = [];

		// XML declaration opcional
		if (options.xmlDeclaration) {
			parts.push('<?xml version="1.0" encoding="UTF-8"?>');
		}

		// SVG opening tag
		parts.push(
			`<svg xmlns="http://www.w3.org/2000/svg" ` +
				`viewBox="0 0 ${totalSize} ${totalSize}" ` +
				`width="${totalSize}" height="${totalSize}">`,
		);

		// Background
		parts.push(
			`<rect width="${totalSize}" height="${totalSize}" fill="${opts.lightColor}"/>`,
		);

		// Dibujar módulos
		if (options.optimizePaths !== false) {
			parts.push(this.renderOptimizedPath(matrix, opts));
		} else {
			parts.push(this.renderIndividualRects(matrix, opts));
		}

		// SVG closing tag
		parts.push("</svg>");

		return parts.join("");
	}

	/**
	 * Renderiza módulos como rectángulos individuales.
	 *
	 * @param matrix - Matriz del código QR
	 * @param opts - Opciones normalizadas
	 * @returns Cadena con los elementos rect
	 *
	 * @internal
	 */
	private static renderIndividualRects(
		matrix: QRMatrix,
		opts: Required<RenderOptions>,
	): string {
		const rects: string[] = [];
		const size = matrix.length;

		for (let row = 0; row < size; row++) {
			for (let col = 0; col < size; col++) {
				if (matrix[row][col] === 1) {
					const x = (col + opts.margin) * opts.scale;
					const y = (row + opts.margin) * opts.scale;
					rects.push(
						`<rect x="${x}" y="${y}" width="${opts.scale}" height="${opts.scale}" fill="${opts.darkColor}"/>`,
					);
				}
			}
		}

		return rects.join("");
	}

	/**
	 * Renderiza módulos como un único path optimizado.
	 *
	 * @description Agrupa módulos horizontales adyacentes en rectángulos
	 * más grandes, reduciendo el tamaño del SVG resultante.
	 *
	 * @param matrix - Matriz del código QR
	 * @param opts - Opciones normalizadas
	 * @returns Cadena con el elemento path
	 *
	 * @internal
	 */
	private static renderOptimizedPath(
		matrix: QRMatrix,
		opts: Required<RenderOptions>,
	): string {
		const pathParts: string[] = [];
		const size = matrix.length;

		for (let row = 0; row < size; row++) {
			let col = 0;
			while (col < size) {
				if (matrix[row][col] === 1) {
					// Encontrar extensión horizontal del módulo
					let endCol = col;
					while (endCol < size && matrix[row][endCol] === 1) {
						endCol++;
					}

					const x = (col + opts.margin) * opts.scale;
					const y = (row + opts.margin) * opts.scale;
					const width = (endCol - col) * opts.scale;
					const height = opts.scale;

					// Añadir rectángulo al path usando comandos M (move) y h/v (line)
					pathParts.push(`M${x} ${y}h${width}v${height}h${-width}z`);

					col = endCol;
				} else {
					col++;
				}
			}
		}

		if (pathParts.length === 0) {
			return "";
		}

		return `<path fill="${opts.darkColor}" d="${pathParts.join("")}"/>`;
	}

	/**
	 * Crea un elemento SVG DOM a partir de la matriz.
	 *
	 * @description Útil cuando se necesita manipular el SVG como DOM
	 * en lugar de insertarlo como HTML string.
	 *
	 * @param matrix - Matriz del código QR
	 * @param options - Opciones de renderizado
	 * @returns Elemento SVGSVGElement
	 *
	 * @example
	 * ```typescript
	 * const svgElement = SVGRenderer.createSVGElement(matrix);
	 * document.body.appendChild(svgElement);
	 *
	 * // Manipular después
	 * svgElement.querySelector('rect')?.setAttribute('fill', 'blue');
	 * ```
	 */
	static createSVGElement(
		matrix: QRMatrix,
		options: SVGRenderOptions = {},
	): SVGSVGElement {
		const svgString = this.render(matrix, options);
		const parser = new DOMParser();
		const doc = parser.parseFromString(svgString, "image/svg+xml");
		return doc.documentElement as unknown as SVGSVGElement;
	}

	/**
	 * Genera un Data URL del SVG.
	 *
	 * @description Convierte el SVG a un Data URL que puede usarse
	 * como src de una imagen. El SVG se codifica en Base64.
	 *
	 * @param matrix - Matriz del código QR
	 * @param options - Opciones de renderizado
	 * @returns Data URL en formato SVG
	 *
	 * @example
	 * ```typescript
	 * const dataUrl = SVGRenderer.toDataURL(matrix);
	 * const img = document.createElement('img');
	 * img.src = dataUrl;
	 * ```
	 */
	static toDataURL(matrix: QRMatrix, options: SVGRenderOptions = {}): string {
		const svg = this.render(matrix, options);
		const encoded = btoa(unescape(encodeURIComponent(svg)));
		return `data:image/svg+xml;base64,${encoded}`;
	}

	/**
	 * Genera el SVG como Blob.
	 *
	 * @description Útil para crear URLs de objeto o para subir
	 * el SVG a un servidor.
	 *
	 * @param matrix - Matriz del código QR
	 * @param options - Opciones de renderizado
	 * @returns Blob con el contenido SVG
	 *
	 * @example
	 * ```typescript
	 * const blob = SVGRenderer.toBlob(matrix);
	 * const url = URL.createObjectURL(blob);
	 * ```
	 */
	static toBlob(matrix: QRMatrix, options: SVGRenderOptions = {}): Blob {
		const svg = this.render(matrix, options);
		return new Blob([svg], { type: "image/svg+xml" });
	}

	/**
	 * Descarga el QR como archivo SVG.
	 *
	 * @description Crea y dispara automáticamente la descarga del
	 * código QR como archivo SVG.
	 *
	 * @param matrix - Matriz del código QR
	 * @param filename - Nombre del archivo (sin extensión)
	 * @param options - Opciones de renderizado
	 *
	 * @example
	 * ```typescript
	 * SVGRenderer.download(matrix, 'my-qr-code', { scale: 20 });
	 * // Descarga "my-qr-code.svg"
	 * ```
	 */
	static download(
		matrix: QRMatrix,
		filename: string = "qrcode",
		options: SVGRenderOptions = {},
	): void {
		const blob = this.toBlob(matrix, { ...options, xmlDeclaration: true });
		const url = URL.createObjectURL(blob);

		const link = document.createElement("a");
		link.href = url;
		link.download = `${filename}.svg`;
		link.click();

		URL.revokeObjectURL(url);
	}
}
