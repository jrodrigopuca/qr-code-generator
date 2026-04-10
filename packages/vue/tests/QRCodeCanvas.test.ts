/**
 * @fileoverview Tests for QRCodeCanvas component
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock @qr-plus/core — vi.hoisted ensures variables are available in factory
// ---------------------------------------------------------------------------

const { mockGenerate, mockCanvasRender, mockCanvasRenderRounded } = vi.hoisted(
	() => ({
		mockGenerate: vi.fn(),
		mockCanvasRender: vi.fn(),
		mockCanvasRenderRounded: vi.fn(),
	}),
);

vi.mock("@qr-plus/core", () => ({
	QRCode: class MockQRCode {
		generate() {
			return mockGenerate();
		}
	},
	CanvasRenderer: {
		render: mockCanvasRender,
		renderRounded: mockCanvasRenderRounded,
	},
}));

import { QRCodeCanvas } from "../src/QRCodeCanvas";

// ---------------------------------------------------------------------------
// Mock canvas context
// ---------------------------------------------------------------------------

const mockCtx = {
	fillStyle: "",
	fillRect: vi.fn(),
	clearRect: vi.fn(),
	beginPath: vi.fn(),
	moveTo: vi.fn(),
	lineTo: vi.fn(),
	quadraticCurveTo: vi.fn(),
	closePath: vi.fn(),
	fill: vi.fn(),
};

beforeEach(() => {
	HTMLCanvasElement.prototype.getContext = vi
		.fn()
		.mockReturnValue(
			mockCtx,
		) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_MATRIX = [
	[1, 0, 1],
	[0, 1, 0],
	[1, 0, 1],
];

function setupMocks(overrides?: { size?: number }) {
	mockGenerate.mockReturnValue({
		matrix: FAKE_MATRIX,
		version: 1,
		size: overrides?.size ?? 21,
	});
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("QRCodeCanvas", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setupMocks();
	});

	describe("rendering", () => {
		it("renders a canvas element", () => {
			const wrapper = mount(QRCodeCanvas, {
				props: { value: "test" },
			});

			const canvas = wrapper.find("canvas");
			expect(canvas.exists()).toBe(true);
			expect(canvas.element.tagName).toBe("CANVAS");
		});

		it("has role=img and aria-label", () => {
			const wrapper = mount(QRCodeCanvas, {
				props: { value: "test" },
			});

			const canvas = wrapper.find("canvas");
			expect(canvas.attributes("role")).toBe("img");
			expect(canvas.attributes("aria-label")).toBe("QR Code");
		});

		it("applies class to canvas element", () => {
			const wrapper = mount(QRCodeCanvas, {
				props: { value: "test", class: "border rounded" },
			});

			const canvas = wrapper.find("canvas");
			expect(canvas.classes()).toContain("border");
			expect(canvas.classes()).toContain("rounded");
		});
	});

	describe("CanvasRenderer.render (square mode)", () => {
		it("calls CanvasRenderer.render for default (square) shape", () => {
			mount(QRCodeCanvas, {
				props: { value: "test" },
			});

			expect(mockCanvasRender).toHaveBeenCalledTimes(1);
			expect(mockCanvasRender).toHaveBeenCalledWith(
				expect.any(HTMLCanvasElement),
				FAKE_MATRIX,
				expect.objectContaining({
					margin: 4,
				}),
			);
		});

		it("computes scale from size, matrixSize and margin", () => {
			setupMocks({ size: 21 });

			mount(QRCodeCanvas, {
				props: { value: "test", size: 290, margin: 4 },
			});

			// scale = 290 / (21 + 4*2) = 10
			expect(mockCanvasRender).toHaveBeenCalledWith(
				expect.any(HTMLCanvasElement),
				FAKE_MATRIX,
				expect.objectContaining({ scale: 10 }),
			);
		});

		it("forwards darkColor and lightColor", () => {
			mount(QRCodeCanvas, {
				props: {
					value: "test",
					darkColor: "#1a1a1a",
					lightColor: "#f5f5f5",
				},
			});

			expect(mockCanvasRender).toHaveBeenCalledWith(
				expect.any(HTMLCanvasElement),
				FAKE_MATRIX,
				expect.objectContaining({
					darkColor: "#1a1a1a",
					lightColor: "#f5f5f5",
				}),
			);
		});
	});

	describe("CanvasRenderer.renderRounded (rounded mode)", () => {
		it("calls renderRounded when moduleShape is 'rounded'", () => {
			mount(QRCodeCanvas, {
				props: { value: "test", moduleShape: "rounded" },
			});

			expect(mockCanvasRenderRounded).toHaveBeenCalledTimes(1);
			expect(mockCanvasRender).not.toHaveBeenCalled();
		});

		it("passes cornerRadius to renderRounded (default 0.4)", () => {
			mount(QRCodeCanvas, {
				props: { value: "test", moduleShape: "rounded" },
			});

			expect(mockCanvasRenderRounded).toHaveBeenCalledWith(
				expect.any(HTMLCanvasElement),
				FAKE_MATRIX,
				expect.any(Object),
				0.4,
			);
		});

		it("passes custom cornerRadius to renderRounded", () => {
			mount(QRCodeCanvas, {
				props: {
					value: "test",
					moduleShape: "rounded",
					cornerRadius: 0.7,
				},
			});

			expect(mockCanvasRenderRounded).toHaveBeenCalledWith(
				expect.any(HTMLCanvasElement),
				FAKE_MATRIX,
				expect.any(Object),
				0.7,
			);
		});
	});

	describe("error handling", () => {
		it("clears canvas when generation throws", () => {
			mockGenerate.mockImplementation(() => {
				throw new Error("Encode error");
			});

			const wrapper = mount(QRCodeCanvas, {
				props: { value: "bad" },
			});

			// Should still render the canvas (no crash)
			const canvas = wrapper.find("canvas");
			expect(canvas.exists()).toBe(true);

			// Should have cleared via ctx.clearRect
			expect(mockCtx.clearRect).toHaveBeenCalled();
		});
	});

	describe("re-rendering", () => {
		it("re-renders when value changes", async () => {
			const wrapper = mount(QRCodeCanvas, {
				props: { value: "first" },
			});

			expect(mockCanvasRender).toHaveBeenCalledTimes(1);

			await wrapper.setProps({ value: "second" });

			expect(mockCanvasRender).toHaveBeenCalledTimes(2);
		});

		it("re-renders when size changes", async () => {
			const wrapper = mount(QRCodeCanvas, {
				props: { value: "test", size: 200 },
			});

			expect(mockCanvasRender).toHaveBeenCalledTimes(1);

			await wrapper.setProps({ size: 300 });

			expect(mockCanvasRender).toHaveBeenCalledTimes(2);
		});
	});
});
