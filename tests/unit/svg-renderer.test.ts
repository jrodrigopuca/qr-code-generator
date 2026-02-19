/**
 * @fileoverview Tests unitarios para SVGRenderer
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SVGRenderer } from "../../src/renderer/SVGRenderer";
import type { QRMatrix } from "../../src/types";

// 5×5 matriz de prueba con módulos oscuros en la diagonal y bordes
const MATRIX_5X5: QRMatrix = [
	[1, 0, 1, 0, 1],
	[0, 1, 0, 1, 0],
	[1, 0, 1, 0, 1],
	[0, 1, 0, 1, 0],
	[1, 0, 1, 0, 1],
];

// Matriz de 5×5 completamente oscura (todos los módulos activos)
const MATRIX_ALL_DARK: QRMatrix = [
	[1, 1, 1, 1, 1],
	[1, 1, 1, 1, 1],
	[1, 1, 1, 1, 1],
	[1, 1, 1, 1, 1],
	[1, 1, 1, 1, 1],
];

// Matriz completamente vacía
const MATRIX_EMPTY: QRMatrix = [
	[0, 0, 0],
	[0, 0, 0],
	[0, 0, 0],
];

describe("SVGRenderer", () => {
	describe("render() — estructura SVG", () => {
		it("debe retornar una cadena que empieza con <svg", () => {
			const result = SVGRenderer.render(MATRIX_5X5);
			expect(result).toMatch(/^<svg /);
		});

		it("debe cerrar el SVG con </svg>", () => {
			const result = SVGRenderer.render(MATRIX_5X5);
			expect(result).toMatch(/<\/svg>$/);
		});

		it("debe incluir el namespace SVG", () => {
			const result = SVGRenderer.render(MATRIX_5X5);
			expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
		});

		it("debe incluir atributos width, height y viewBox", () => {
			const result = SVGRenderer.render(MATRIX_5X5);
			expect(result).toMatch(/width="\d+"/);
			expect(result).toMatch(/height="\d+"/);
			expect(result).toMatch(/viewBox="0 0 \d+ \d+"/);
		});

		it("debe incluir un rect de fondo", () => {
			const result = SVGRenderer.render(MATRIX_5X5);
			expect(result).toContain("<rect width=");
		});
	});

	describe("render() — dimensiones", () => {
		it("calcula el tamaño usando escala y margen por defecto (scale=10, margin=4)", () => {
			// totalSize = (5 + 4*2) * 10 = 130
			const result = SVGRenderer.render(MATRIX_5X5);
			expect(result).toContain('width="130"');
			expect(result).toContain('height="130"');
			expect(result).toContain('viewBox="0 0 130 130"');
		});

		it("respeta scale personalizado", () => {
			// totalSize = (5 + 4*2) * 5 = 65
			const result = SVGRenderer.render(MATRIX_5X5, { scale: 5 });
			expect(result).toContain('width="65"');
			expect(result).toContain('height="65"');
		});

		it("respeta margin personalizado", () => {
			// totalSize = (5 + 2*2) * 10 = 90
			const result = SVGRenderer.render(MATRIX_5X5, { margin: 2 });
			expect(result).toContain('width="90"');
			expect(result).toContain('height="90"');
		});

		it("respeta margin=0", () => {
			// totalSize = (5 + 0) * 10 = 50
			const result = SVGRenderer.render(MATRIX_5X5, { margin: 0 });
			expect(result).toContain('width="50"');
			expect(result).toContain('height="50"');
		});
	});

	describe("render() — colores", () => {
		it("usa color oscuro negro por defecto", () => {
			const result = SVGRenderer.render(MATRIX_5X5);
			expect(result).toContain("#000000");
		});

		it("usa color claro blanco por defecto en el fondo", () => {
			const result = SVGRenderer.render(MATRIX_5X5);
			expect(result).toContain("#ffffff");
		});

		it("respeta darkColor personalizado", () => {
			const result = SVGRenderer.render(MATRIX_5X5, {
				darkColor: "#1a1a2e",
			});
			expect(result).toContain("#1a1a2e");
		});

		it("respeta lightColor personalizado en el fondo", () => {
			const result = SVGRenderer.render(MATRIX_5X5, {
				lightColor: "#f0f0f0",
			});
			expect(result).toContain('fill="#f0f0f0"');
		});
	});

	describe("render() — modo de renderizado (paths vs rects)", () => {
		it("usa paths optimizados por defecto", () => {
			const result = SVGRenderer.render(MATRIX_ALL_DARK);
			expect(result).toContain("<path ");
		});

		it("usa rects individuales cuando optimizePaths=false", () => {
			const result = SVGRenderer.render(MATRIX_ALL_DARK, {
				optimizePaths: false,
			});
			expect(result).toContain("<rect ");
			expect(result).not.toContain("<path ");
		});

		it("el path optimizado contiene comandos M (move)", () => {
			const result = SVGRenderer.render(MATRIX_5X5);
			// El formato del path es M{x} {y}h{w}v{h}h{-w}z
			expect(result).toMatch(/d="M\d+ \d+/);
		});

		it("no genera path si la matriz está vacía", () => {
			const result = SVGRenderer.render(MATRIX_EMPTY);
			expect(result).not.toContain("<path ");
		});

		it("rect individual incluye posición y dimensiones", () => {
			// Una sola celda oscura en (0,0)
			const single: QRMatrix = [[1]];
			const result = SVGRenderer.render(single, {
				optimizePaths: false,
				scale: 10,
				margin: 0,
			});
			expect(result).toContain('<rect x="0" y="0" width="10" height="10"');
		});
	});

	describe("render() — declaración XML", () => {
		it("no incluye declaración XML por defecto", () => {
			const result = SVGRenderer.render(MATRIX_5X5);
			expect(result).not.toContain("<?xml");
		});

		it("incluye declaración XML cuando xmlDeclaration=true", () => {
			const result = SVGRenderer.render(MATRIX_5X5, {
				xmlDeclaration: true,
			});
			expect(result).toMatch(/^<\?xml version="1\.0"/);
		});
	});

	describe("render() — posicionamiento de módulos", () => {
		it("el primer módulo oscuro respeta el margen", () => {
			// Con margin=0 y scale=10, el módulo (0,0) está en x=0, y=0
			const single: QRMatrix = [[1]];
			const result = SVGRenderer.render(single, {
				margin: 0,
				scale: 10,
				optimizePaths: false,
			});
			expect(result).toContain('x="0" y="0"');
		});

		it("el primer módulo oscuro se desplaza con el margen", () => {
			// Con margin=2 y scale=10, x = (0 + 2)*10 = 20
			const single: QRMatrix = [[1]];
			const result = SVGRenderer.render(single, {
				margin: 2,
				scale: 10,
				optimizePaths: false,
			});
			expect(result).toContain('x="20" y="20"');
		});

		it("módulos adyacentes se fusionan en paths optimizados", () => {
			// Matriz 3×3 con primera fila completamente oscura → path de ancho 30
			const matrix: QRMatrix = [
				[1, 1, 1],
				[0, 0, 0],
				[0, 0, 0],
			];
			const result = SVGRenderer.render(matrix, {
				margin: 0,
				scale: 10,
			});
			// h30 = ancho total de los 3 módulos fusionados
			expect(result).toContain("h30");
		});
	});

	describe("toDataURL()", () => {
		it("retorna un string con prefijo data:image/svg+xml;base64,", () => {
			const result = SVGRenderer.toDataURL(MATRIX_5X5);
			expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
		});

		it("el contenido base64 es decodificable y contiene <svg", () => {
			const dataUrl = SVGRenderer.toDataURL(MATRIX_5X5);
			const base64 = dataUrl.replace("data:image/svg+xml;base64,", "");
			const decoded = atob(base64);
			expect(decoded).toContain("<svg");
		});

		it("acepta opciones de renderizado", () => {
			const result = SVGRenderer.toDataURL(MATRIX_5X5, { scale: 5 });
			expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
		});
	});

	describe("render() — verificación de contenido", () => {
		it("genera un rect por cada módulo oscuro en modo rects individuales", () => {
			const result = SVGRenderer.render(MATRIX_5X5, {
				optimizePaths: false,
			});
			const darkModules = MATRIX_5X5.flat().filter((v) => v === 1).length;
			// Contar rects excluyendo el rect de fondo
			const allRects = result.match(/<rect /g) || [];
			// 1 fondo + N módulos oscuros
			expect(allRects.length).toBe(1 + darkModules);
		});

		it("el rect de fondo usa lightColor y los módulos usan darkColor", () => {
			const result = SVGRenderer.render(MATRIX_5X5, {
				optimizePaths: false,
				darkColor: "#111111",
				lightColor: "#eeeeee",
			});
			// El primer rect (fondo) usa el lightColor
			const firstRect = result.match(/<rect [^/]*\/>/)?.[0] || "";
			expect(firstRect).toContain('fill="#eeeeee"');
			// Los rects de módulos usan darkColor
			const moduleRects = (result.match(/<rect [^/]*\/>/g) || []).slice(1);
			for (const rect of moduleRects) {
				expect(rect).toContain('fill="#111111"');
			}
		});

		it("el path optimizado usa darkColor", () => {
			const result = SVGRenderer.render(MATRIX_5X5, {
				darkColor: "#222222",
			});
			expect(result).toContain('<path fill="#222222"');
		});
	});

	describe("toBlob()", () => {
		it("retorna una instancia de Blob", () => {
			const blob = SVGRenderer.toBlob(MATRIX_5X5);
			expect(blob).toBeInstanceOf(Blob);
		});

		it("el Blob tiene tipo image/svg+xml", () => {
			const blob = SVGRenderer.toBlob(MATRIX_5X5);
			expect(blob.type).toBe("image/svg+xml");
		});

		it("el Blob tiene contenido (tamaño > 0)", async () => {
			const blob = SVGRenderer.toBlob(MATRIX_5X5);
			expect(blob.size).toBeGreaterThan(0);
		});

		it("el contenido del Blob contiene el SVG", async () => {
			const blob = SVGRenderer.toBlob(MATRIX_5X5);
			const text = await blob.text();
			expect(text).toContain("<svg");
		});
	});
});
