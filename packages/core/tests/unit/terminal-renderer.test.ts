/**
 * @fileoverview Tests unitarios para TerminalRenderer
 */

import { describe, it, expect } from "vitest";
import { TerminalRenderer } from "../../src/renderer/TerminalRenderer";
import type { QRMatrix } from "../../src/types";

// Matrices de prueba
const MATRIX_3X3: QRMatrix = [
	[1, 0, 1],
	[0, 1, 0],
	[1, 0, 1],
];

const MATRIX_ALL_DARK: QRMatrix = [
	[1, 1, 1],
	[1, 1, 1],
	[1, 1, 1],
];

const MATRIX_ALL_LIGHT: QRMatrix = [
	[0, 0, 0],
	[0, 0, 0],
	[0, 0, 0],
];

const MATRIX_2X2: QRMatrix = [
	[1, 0],
	[0, 1],
];

// Caracteres esperados
const U_DARK = "██";
const U_LIGHT = "  ";
const A_DARK = "##";
const A_LIGHT = "  ";

describe("TerminalRenderer", () => {
	describe("render() — modo unicode (por defecto)", () => {
		it("debe retornar una cadena no vacía", () => {
			const result = TerminalRenderer.render(MATRIX_3X3);
			expect(result).toBeTruthy();
			expect(typeof result).toBe("string");
		});

		it("debe usar margen por defecto de 2", () => {
			const result = TerminalRenderer.render(MATRIX_3X3);
			const lines = result.split("\n");
			// 3 filas de datos + 2*2 margen = 7 filas
			expect(lines).toHaveLength(7);
		});

		it("debe respetar un margen personalizado", () => {
			const result = TerminalRenderer.render(MATRIX_3X3, { margin: 0 });
			const lines = result.split("\n");
			// Sin margen: solo 3 filas de datos
			expect(lines).toHaveLength(3);
		});

		it("debe representar módulos oscuros con ██", () => {
			const result = TerminalRenderer.render(MATRIX_ALL_DARK, { margin: 0 });
			const lines = result.split("\n");
			for (const line of lines) {
				expect(line).toBe(U_DARK.repeat(3));
			}
		});

		it("debe representar módulos claros con espacios", () => {
			const result = TerminalRenderer.render(MATRIX_ALL_LIGHT, { margin: 0 });
			const lines = result.split("\n");
			for (const line of lines) {
				expect(line).toBe(U_LIGHT.repeat(3));
			}
		});

		it("debe representar el patrón diagonal correctamente", () => {
			const result = TerminalRenderer.render(MATRIX_3X3, { margin: 0 });
			const lines = result.split("\n");
			expect(lines[0]).toBe(`${U_DARK}${U_LIGHT}${U_DARK}`);
			expect(lines[1]).toBe(`${U_LIGHT}${U_DARK}${U_LIGHT}`);
			expect(lines[2]).toBe(`${U_DARK}${U_LIGHT}${U_DARK}`);
		});

		it("debe incluir márgenes como espacios", () => {
			const result = TerminalRenderer.render(MATRIX_2X2, { margin: 1 });
			const lines = result.split("\n");
			// 2 filas datos + 2*1 margen = 4 filas
			expect(lines).toHaveLength(4);
			// Primera y última fila = margen (todo claro)
			expect(lines[0]).toBe(U_LIGHT.repeat(4)); // 2+1*2 = 4 módulos de ancho
			expect(lines[3]).toBe(U_LIGHT.repeat(4));
		});

		it("debe usar margin 0 sin agregar filas extra", () => {
			const result = TerminalRenderer.render(MATRIX_3X3, { margin: 0 });
			const lines = result.split("\n");
			expect(lines).toHaveLength(3);
		});
	});

	describe("render() — modo ascii", () => {
		it("debe usar caracteres ASCII ##", () => {
			const result = TerminalRenderer.render(MATRIX_ALL_DARK, {
				style: "ascii",
				margin: 0,
			});
			const lines = result.split("\n");
			for (const line of lines) {
				expect(line).toBe(A_DARK.repeat(3));
			}
		});

		it("debe representar módulos claros con espacios", () => {
			const result = TerminalRenderer.render(MATRIX_ALL_LIGHT, {
				style: "ascii",
				margin: 0,
			});
			const lines = result.split("\n");
			for (const line of lines) {
				expect(line).toBe(A_LIGHT.repeat(3));
			}
		});

		it("debe representar el patrón correctamente", () => {
			const result = TerminalRenderer.render(MATRIX_3X3, {
				style: "ascii",
				margin: 0,
			});
			const lines = result.split("\n");
			expect(lines[0]).toBe(`${A_DARK}${A_LIGHT}${A_DARK}`);
			expect(lines[1]).toBe(`${A_LIGHT}${A_DARK}${A_LIGHT}`);
			expect(lines[2]).toBe(`${A_DARK}${A_LIGHT}${A_DARK}`);
		});
	});

	describe("render() — modo compact", () => {
		it("debe retornar menos filas que el modo unicode", () => {
			const compactResult = TerminalRenderer.render(MATRIX_3X3, {
				style: "compact",
				margin: 0,
			});
			const unicodeResult = TerminalRenderer.render(MATRIX_3X3, {
				style: "unicode",
				margin: 0,
			});
			const compactLines = compactResult.split("\n");
			const unicodeLines = unicodeResult.split("\n");
			expect(compactLines.length).toBeLessThan(unicodeLines.length);
		});

		it("debe combinar dos filas en una con matriz par", () => {
			const result = TerminalRenderer.render(MATRIX_2X2, {
				style: "compact",
				margin: 0,
			});
			const lines = result.split("\n");
			// 2 filas → 1 línea compacta
			expect(lines).toHaveLength(1);
		});

		it("debe manejar matriz con filas impares", () => {
			const result = TerminalRenderer.render(MATRIX_3X3, {
				style: "compact",
				margin: 0,
			});
			const lines = result.split("\n");
			// 3 filas → ceil(3/2) = 2 líneas compactas
			expect(lines).toHaveLength(2);
		});

		it("debe usar █ cuando ambas filas son oscuras", () => {
			// Usar matriz con filas pares para que todas las parejas sean completas
			const matrixEven: QRMatrix = [
				[1, 1],
				[1, 1],
			];
			const result = TerminalRenderer.render(matrixEven, {
				style: "compact",
				margin: 0,
			});
			const lines = result.split("\n");
			expect(lines).toHaveLength(1);
			// Todas las posiciones deben ser █
			for (const char of lines[0]) {
				expect(char).toBe("█");
			}
		});

		it("debe usar espacio cuando ambas filas son claras", () => {
			const result = TerminalRenderer.render(MATRIX_ALL_LIGHT, {
				style: "compact",
				margin: 0,
			});
			const lines = result.split("\n");
			for (const line of lines) {
				for (const char of line) {
					expect(char).toBe(" ");
				}
			}
		});

		it("debe usar ▀ para fila superior oscura y fila inferior clara", () => {
			// Fila 0: [1,1], Fila 1: [0,0]
			const matrix: QRMatrix = [
				[1, 1],
				[0, 0],
			];
			const result = TerminalRenderer.render(matrix, {
				style: "compact",
				margin: 0,
			});
			expect(result).toBe("▀▀");
		});

		it("debe usar ▄ para fila superior clara y fila inferior oscura", () => {
			const matrix: QRMatrix = [
				[0, 0],
				[1, 1],
			];
			const result = TerminalRenderer.render(matrix, {
				style: "compact",
				margin: 0,
			});
			expect(result).toBe("▄▄");
		});

		it("debe incluir márgenes correctamente en modo compacto", () => {
			const result = TerminalRenderer.render(MATRIX_2X2, {
				style: "compact",
				margin: 2,
			});
			const lines = result.split("\n");
			// totalRows = 2 + 4 = 6 → ceil(6/2) = 3 líneas
			expect(lines).toHaveLength(3);
			// Cada línea tiene totalCols = 2 + 4 = 6 caracteres
			for (const line of lines) {
				expect(line).toHaveLength(6);
			}
		});
	});

	describe("render() — inversión de colores", () => {
		it("debe invertir módulos en modo unicode", () => {
			const normal = TerminalRenderer.render(MATRIX_3X3, { margin: 0 });
			const inverted = TerminalRenderer.render(MATRIX_3X3, {
				margin: 0,
				invert: true,
			});
			expect(normal).not.toBe(inverted);

			const normalLines = normal.split("\n");
			const invertedLines = inverted.split("\n");

			// Donde normal tiene dark, inverted tiene light y viceversa
			// Fila 0 normal: ██  ██ → inverted:   ██
			expect(normalLines[0]).toBe(`${U_DARK}${U_LIGHT}${U_DARK}`);
			expect(invertedLines[0]).toBe(`${U_LIGHT}${U_DARK}${U_LIGHT}`);
		});

		it("debe invertir módulos en modo ascii", () => {
			const normal = TerminalRenderer.render(MATRIX_ALL_DARK, {
				style: "ascii",
				margin: 0,
			});
			const inverted = TerminalRenderer.render(MATRIX_ALL_DARK, {
				style: "ascii",
				margin: 0,
				invert: true,
			});

			// Normal: todos ## → Inverted: todos espacios
			const normalLines = normal.split("\n");
			const invertedLines = inverted.split("\n");
			expect(normalLines[0]).toBe(A_DARK.repeat(3));
			expect(invertedLines[0]).toBe(A_LIGHT.repeat(3));
		});

		it("debe invertir caracteres en modo compact", () => {
			const matrix: QRMatrix = [
				[1, 1],
				[0, 0],
			];
			const normal = TerminalRenderer.render(matrix, {
				style: "compact",
				margin: 0,
			});
			const inverted = TerminalRenderer.render(matrix, {
				style: "compact",
				margin: 0,
				invert: true,
			});

			// Normal: ▀▀ (top dark, bottom light)
			// Inverted: ▄▄ (top light becomes dark visually → bottom dark char)
			expect(normal).toBe("▀▀");
			expect(inverted).toBe("▄▄");
		});

		it("debe invertir margen (margen se vuelve oscuro)", () => {
			const result = TerminalRenderer.render(MATRIX_ALL_LIGHT, {
				margin: 1,
				invert: true,
			});
			const lines = result.split("\n");
			// Cuando está invertido, los módulos claros→oscuros (██), incluido margen
			// Margen invertido = dark
			expect(lines[0]).toBe(U_DARK.repeat(5)); // 3 + 1*2 = 5
		});
	});

	describe("render() — opciones por defecto", () => {
		it("debe usar estilo unicode por defecto", () => {
			const result = TerminalRenderer.render(MATRIX_ALL_DARK, { margin: 0 });
			const lines = result.split("\n");
			expect(lines[0]).toBe(U_DARK.repeat(3));
		});

		it("debe usar invert: false por defecto", () => {
			const result = TerminalRenderer.render(MATRIX_ALL_DARK, { margin: 0 });
			const inverted = TerminalRenderer.render(MATRIX_ALL_DARK, {
				margin: 0,
				invert: false,
			});
			expect(result).toBe(inverted);
		});

		it("debe aceptar opciones parciales", () => {
			// Solo especificar margin, el resto usa defaults
			const result = TerminalRenderer.render(MATRIX_3X3, { margin: 1 });
			expect(result).toBeTruthy();
		});

		it("debe funcionar sin opciones", () => {
			const result = TerminalRenderer.render(MATRIX_3X3);
			expect(result).toBeTruthy();
		});
	});

	describe("render() — casos borde", () => {
		it("debe manejar una matriz 1x1", () => {
			const matrix: QRMatrix = [[1]];
			const result = TerminalRenderer.render(matrix, { margin: 0 });
			expect(result).toBe(U_DARK);
		});

		it("debe manejar una matriz 1x1 clara", () => {
			const matrix: QRMatrix = [[0]];
			const result = TerminalRenderer.render(matrix, { margin: 0 });
			expect(result).toBe(U_LIGHT);
		});

		it("debe manejar margen grande", () => {
			const matrix: QRMatrix = [[1]];
			const result = TerminalRenderer.render(matrix, { margin: 5 });
			const lines = result.split("\n");
			// 1 + 5*2 = 11 filas
			expect(lines).toHaveLength(11);
		});

		it("debe producir líneas de ancho consistente", () => {
			const result = TerminalRenderer.render(MATRIX_3X3, { margin: 2 });
			const lines = result.split("\n");
			const width = lines[0].length;
			for (const line of lines) {
				expect(line.length).toBe(width);
			}
		});

		it("debe producir ancho consistente en modo compacto", () => {
			const result = TerminalRenderer.render(MATRIX_3X3, {
				style: "compact",
				margin: 2,
			});
			const lines = result.split("\n");
			const width = lines[0].length;
			for (const line of lines) {
				expect(line.length).toBe(width);
			}
		});

		it("debe manejar una matriz 1x1 en modo compacto con margen 0", () => {
			const matrix: QRMatrix = [[1]];
			const result = TerminalRenderer.render(matrix, {
				style: "compact",
				margin: 0,
			});
			const lines = result.split("\n");
			expect(lines).toHaveLength(1);
			expect(lines[0]).toBe("▀");
		});
	});
});
