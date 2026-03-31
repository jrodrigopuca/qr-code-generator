/**
 * @fileoverview Tests unitarios para CanvasRenderer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CanvasRenderer } from "../../src/renderer/CanvasRenderer";
import type { QRMatrix } from "../../src/types";

// ---------------------------------------------------------------------------
// Matrices de prueba
// ---------------------------------------------------------------------------

const MATRIX_5X5: QRMatrix = [
	[1, 0, 1, 0, 1],
	[0, 1, 0, 1, 0],
	[1, 0, 1, 0, 1],
	[0, 1, 0, 1, 0],
	[1, 0, 1, 0, 1],
];

const MATRIX_ALL_DARK: QRMatrix = [
	[1, 1, 1],
	[1, 1, 1],
	[1, 1, 1],
];

// ---------------------------------------------------------------------------
// Helpers para crear mocks del canvas y el contexto
// ---------------------------------------------------------------------------

function createMockCtx() {
	return {
		fillStyle: "" as string,
		fillRect: vi.fn(),
		beginPath: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		quadraticCurveTo: vi.fn(),
		closePath: vi.fn(),
		fill: vi.fn(),
	};
}

function createMockCanvas(ctx: ReturnType<typeof createMockCtx>) {
	const canvas = {
		width: 0,
		height: 0,
		getContext: vi.fn().mockReturnValue(ctx),
		toDataURL: vi.fn().mockReturnValue("data:image/png;base64,AAAA"),
		toBlob: vi.fn().mockImplementation((cb: (b: Blob) => void) => {
			cb(new Blob(["fake-png"], { type: "image/png" }));
		}),
	} as unknown as HTMLCanvasElement;
	return canvas;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CanvasRenderer", () => {
	describe("calculateSize()", () => {
		it("calcula con valores por defecto (scale=10, margin=4)", () => {
			// (21 + 4*2) * 10 = 290
			expect(CanvasRenderer.calculateSize(21)).toBe(290);
		});

		it("calcula con escala personalizada", () => {
			// (21 + 4*2) * 5 = 145
			expect(CanvasRenderer.calculateSize(21, { scale: 5 })).toBe(145);
		});

		it("calcula con margen personalizado", () => {
			// (21 + 2*2) * 10 = 250
			expect(CanvasRenderer.calculateSize(21, { margin: 2 })).toBe(250);
		});

		it("calcula con margen=0", () => {
			// (10 + 0) * 10 = 100
			expect(CanvasRenderer.calculateSize(10, { margin: 0 })).toBe(100);
		});

		it("calcula con scale y margin combinados", () => {
			// (5 + 1*2) * 4 = 28
			expect(CanvasRenderer.calculateSize(5, { scale: 4, margin: 1 })).toBe(28);
		});
	});

	describe("render()", () => {
		let ctx: ReturnType<typeof createMockCtx>;
		let canvas: HTMLCanvasElement;

		beforeEach(() => {
			ctx = createMockCtx();
			canvas = createMockCanvas(ctx);
		});

		it("solicita el contexto 2D al canvas", () => {
			CanvasRenderer.render(canvas, MATRIX_5X5);
			expect(canvas.getContext).toHaveBeenCalledWith("2d");
		});

		it("configura el ancho y alto del canvas", () => {
			// (5 + 4*2) * 10 = 130
			CanvasRenderer.render(canvas, MATRIX_5X5);
			expect(canvas.width).toBe(130);
			expect(canvas.height).toBe(130);
		});

		it("rellena el fondo con el color claro", () => {
			CanvasRenderer.render(canvas, MATRIX_5X5, { lightColor: "#ffffff" });
			// El primer fillRect cubre todo el canvas (fondo)
			const calls = ctx.fillRect.mock.calls;
			expect(calls[0]).toEqual([0, 0, 130, 130]);
		});

		it("asigna lightColor como fillStyle para el fondo", () => {
			// Captura los valores de fillStyle en cada llamada a fillRect
			const fillStyles: string[] = [];
			ctx.fillRect.mockImplementation(() => {
				fillStyles.push(ctx.fillStyle);
			});
			CanvasRenderer.render(canvas, MATRIX_5X5, { lightColor: "#fafafa" });
			// Primera llamada = fondo
			expect(fillStyles[0]).toBe("#fafafa");
		});

		it("asigna darkColor como fillStyle para los módulos", () => {
			const fillStyles: string[] = [];
			ctx.fillRect.mockImplementation(() => {
				fillStyles.push(ctx.fillStyle);
			});
			CanvasRenderer.render(canvas, MATRIX_5X5, { darkColor: "#0a0a0a" });
			// Todas las llamadas después de la primera (fondo) usan darkColor
			const moduleStyles = fillStyles.slice(1);
			for (const style of moduleStyles) {
				expect(style).toBe("#0a0a0a");
			}
		});

		it("llama a fillRect al menos una vez por módulo oscuro", () => {
			CanvasRenderer.render(canvas, MATRIX_5X5);
			// MATRIX_5X5 tiene 13 módulos oscuros (diagonal de tablero 5×5)
			// + 1 llamada para el fondo = 14 total
			const darkModules = MATRIX_5X5.flat().filter((v) => v === 1).length;
			expect(ctx.fillRect.mock.calls.length).toBe(1 + darkModules);
		});

		it("posiciona el primer módulo oscuro respetando el margen", () => {
			const single: QRMatrix = [[1]];
			CanvasRenderer.render(canvas, single, {
				margin: 0,
				scale: 10,
			});
			// Las llamadas: [0] fondo, [1] primer módulo oscuro en x=0, y=0
			expect(ctx.fillRect.mock.calls[1]).toEqual([0, 0, 10, 10]);
		});

		it("desplaza módulos con el margen configurado", () => {
			const single: QRMatrix = [[1]];
			CanvasRenderer.render(canvas, single, {
				margin: 2,
				scale: 10,
			});
			// x = (0 + 2)*10 = 20, y = (0 + 2)*10 = 20
			expect(ctx.fillRect.mock.calls[1]).toEqual([20, 20, 10, 10]);
		});

		it("lanza error si no se puede obtener contexto 2D", () => {
			(canvas.getContext as ReturnType<typeof vi.fn>).mockReturnValue(null);
			expect(() => CanvasRenderer.render(canvas, MATRIX_5X5)).toThrow();
		});

		it("respeta scale personalizado al calcular posición de módulos", () => {
			const single: QRMatrix = [[1]];
			CanvasRenderer.render(canvas, single, {
				margin: 0,
				scale: 5,
			});
			expect(ctx.fillRect.mock.calls[1]).toEqual([0, 0, 5, 5]);
		});
	});

	describe("createCanvas()", () => {
		let fakeCtx: ReturnType<typeof createMockCtx>;
		let fakeCanvas: HTMLCanvasElement;
		let mockCreateElement: ReturnType<typeof vi.fn>;

		beforeEach(() => {
			fakeCtx = createMockCtx();
			fakeCanvas = createMockCanvas(fakeCtx);
			mockCreateElement = vi.fn().mockReturnValue(fakeCanvas);
			vi.stubGlobal("document", { createElement: mockCreateElement });
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it("llama a document.createElement('canvas')", () => {
			CanvasRenderer.createCanvas(MATRIX_5X5);
			expect(mockCreateElement).toHaveBeenCalledWith("canvas");
		});

		it("retorna el canvas con las dimensiones correctas", () => {
			const result = CanvasRenderer.createCanvas(MATRIX_5X5);
			// (5 + 4*2) * 10 = 130
			expect(result.width).toBe(130);
			expect(result.height).toBe(130);
		});
	});

	describe("toDataURL()", () => {
		let fakeCtx: ReturnType<typeof createMockCtx>;
		let fakeCanvas: HTMLCanvasElement;

		beforeEach(() => {
			fakeCtx = createMockCtx();
			fakeCanvas = createMockCanvas(fakeCtx);
			vi.stubGlobal("document", {
				createElement: vi.fn().mockReturnValue(fakeCanvas),
			});
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it("retorna un string de Data URL", () => {
			const result = CanvasRenderer.toDataURL(MATRIX_5X5);
			expect(typeof result).toBe("string");
			expect(result).toContain("data:image/png");
		});

		it("llama a canvas.toDataURL con 'image/png'", () => {
			CanvasRenderer.toDataURL(MATRIX_5X5);
			expect(fakeCanvas.toDataURL).toHaveBeenCalledWith("image/png");
		});
	});

	describe("toBlob()", () => {
		beforeEach(() => {
			const fakeCtx = createMockCtx();
			const fakeCanvas = createMockCanvas(fakeCtx);
			vi.stubGlobal("document", {
				createElement: vi.fn().mockReturnValue(fakeCanvas),
			});
		});

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it("retorna una Promise", () => {
			const result = CanvasRenderer.toBlob(MATRIX_5X5);
			expect(result).toBeInstanceOf(Promise);
		});

		it("resuelve con un Blob", async () => {
			const blob = await CanvasRenderer.toBlob(MATRIX_5X5);
			expect(blob).toBeInstanceOf(Blob);
		});

		it("llama a canvas.toBlob con 'image/png'", async () => {
			const fakeCtx = createMockCtx();
			const fakeCanvas = createMockCanvas(fakeCtx);
			vi.stubGlobal("document", {
				createElement: vi.fn().mockReturnValue(fakeCanvas),
			});
			await CanvasRenderer.toBlob(MATRIX_5X5);
			expect(fakeCanvas.toBlob).toHaveBeenCalledWith(
				expect.any(Function),
				"image/png",
			);
		});

		it("rechaza si el canvas no genera blob", async () => {
			const fakeCtx = createMockCtx();
			const fakeCanvas = {
				...createMockCanvas(fakeCtx),
				toBlob: vi
					.fn()
					.mockImplementation((cb: (b: Blob | null) => void) => cb(null)),
			} as unknown as HTMLCanvasElement;
			vi.stubGlobal("document", {
				createElement: vi.fn().mockReturnValue(fakeCanvas),
			});
			await expect(CanvasRenderer.toBlob(MATRIX_5X5)).rejects.toThrow();
		});
	});

	describe("renderRounded()", () => {
		let ctx: ReturnType<typeof createMockCtx>;
		let canvas: HTMLCanvasElement;

		beforeEach(() => {
			ctx = createMockCtx();
			canvas = createMockCanvas(ctx);
		});

		it("configura las dimensiones del canvas igual que render()", () => {
			CanvasRenderer.renderRounded(canvas, MATRIX_5X5);
			expect(canvas.width).toBe(130);
			expect(canvas.height).toBe(130);
		});

		it("rellena el fondo completo", () => {
			CanvasRenderer.renderRounded(canvas, MATRIX_5X5);
			expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 130, 130);
		});

		it("usa beginPath y fill para cada módulo oscuro (esquinas redondeadas)", () => {
			CanvasRenderer.renderRounded(canvas, MATRIX_ALL_DARK);
			// 9 módulos oscuros → 9 llamadas beginPath
			expect(ctx.beginPath).toHaveBeenCalledTimes(9);
			expect(ctx.fill).toHaveBeenCalledTimes(9);
		});

		it("lanza error si no se puede obtener contexto 2D", () => {
			(canvas.getContext as ReturnType<typeof vi.fn>).mockReturnValue(null);
			expect(() => CanvasRenderer.renderRounded(canvas, MATRIX_5X5)).toThrow();
		});

		it("acepta cornerRadius personalizado (0–0.5)", () => {
			// No debe lanzar error con valores válidos
			expect(() =>
				CanvasRenderer.renderRounded(canvas, MATRIX_5X5, {}, 0.2),
			).not.toThrow();
		});

		it("clampea cornerRadius a 0.5 si se pasa un valor mayor", () => {
			// Con radius > 0.5 el método lo clampea internamente y no lanza error
			expect(() =>
				CanvasRenderer.renderRounded(canvas, MATRIX_5X5, {}, 1.0),
			).not.toThrow();
		});

		it("llama quadraticCurveTo 4 veces por módulo (4 esquinas)", () => {
			const single: QRMatrix = [[1]];
			CanvasRenderer.renderRounded(canvas, single);
			expect(ctx.quadraticCurveTo).toHaveBeenCalledTimes(4);
		});

		it("funciona con cornerRadius=0 sin error", () => {
			expect(() =>
				CanvasRenderer.renderRounded(canvas, MATRIX_5X5, {}, 0),
			).not.toThrow();
		});
	});
});
