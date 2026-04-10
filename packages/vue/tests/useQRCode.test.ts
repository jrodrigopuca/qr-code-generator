/**
 * @fileoverview Tests for useQRCode composable
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed, nextTick, ref } from "vue";

// ---------------------------------------------------------------------------
// Mock @qr-plus/core — vi.hoisted ensures variables are available in factory
// ---------------------------------------------------------------------------

const { mockGenerate, mockSVGRender, mockSVGToDataURL } = vi.hoisted(() => ({
	mockGenerate: vi.fn(),
	mockSVGRender: vi.fn(),
	mockSVGToDataURL: vi.fn(),
}));

vi.mock("@qr-plus/core", () => ({
	QRCode: class MockQRCode {
		constructor(...args: unknown[]) {
			MockQRCode._lastArgs = args;
			MockQRCode._calls.push(args);
		}
		generate() {
			return mockGenerate();
		}
		static _lastArgs: unknown[] = [];
		static _calls: unknown[][] = [];
	},
	SVGRenderer: {
		render: mockSVGRender,
		toDataURL: mockSVGToDataURL,
	},
}));

import { QRCode as MockQRCodeClass } from "@qr-plus/core";
import { useQRCode } from "../src/useQRCode";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_MATRIX = [
	[1, 0, 1],
	[0, 1, 0],
	[1, 0, 1],
];

function setupMocks(overrides?: { matrix?: number[][]; size?: number }) {
	const matrix = overrides?.matrix ?? FAKE_MATRIX;
	const size = overrides?.size ?? 3;

	mockGenerate.mockReturnValue({ matrix, version: 1, size });
	mockSVGRender.mockReturnValue('<svg><rect fill="#000"/></svg>');
	mockSVGToDataURL.mockReturnValue("data:image/svg+xml;base64,AAAA");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useQRCode", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(MockQRCodeClass as unknown as { _calls: unknown[][] })._calls = [];
		setupMocks();
	});

	describe("successful generation", () => {
		it("returns svgString from SVGRenderer.render", () => {
			const { svgString } = useQRCode("hello");

			expect(svgString.value).toBe('<svg><rect fill="#000"/></svg>');
		});

		it("returns svgDataURL from SVGRenderer.toDataURL", () => {
			const { svgDataURL } = useQRCode("hello");

			expect(svgDataURL.value).toBe("data:image/svg+xml;base64,AAAA");
		});

		it("has no error state on success", () => {
			const { isError, error } = useQRCode("hello");

			expect(isError.value).toBe(false);
			expect(error.value).toBeNull();
		});

		it("returns a download function", () => {
			const { download } = useQRCode("hello");

			expect(typeof download).toBe("function");
		});
	});

	describe("options forwarding", () => {
		it("passes errorCorrectionLevel to QRCode constructor", () => {
			const { svgString } = useQRCode("test", {
				errorCorrectionLevel: "H",
			});

			// Trigger computed evaluation
			svgString.value;

			const calls = (MockQRCodeClass as unknown as { _calls: unknown[][] })
				._calls;
			expect(calls.length).toBeGreaterThan(0);
			expect(calls[0]).toEqual(["test", { errorCorrectionLevel: "H" }]);
		});

		it("computes scale from size, matrixSize and margin", () => {
			setupMocks({ size: 21 });

			const { svgString } = useQRCode("test", {
				size: 290,
				margin: 4,
			});

			// Trigger computed evaluation
			svgString.value;

			// scale = 290 / (21 + 4*2) = 290 / 29 = 10
			expect(mockSVGRender).toHaveBeenCalledWith(
				FAKE_MATRIX,
				expect.objectContaining({ scale: 10, margin: 4 }),
			);
		});

		it("uses default size=200 and margin=4 when not specified", () => {
			setupMocks({ size: 21 });

			const { svgString } = useQRCode("test");

			// Trigger computed evaluation
			svgString.value;

			// scale = 200 / (21 + 4*2) = 200/29 ≈ 6.896...
			const call = mockSVGRender.mock.calls[0];
			expect(call[1].scale).toBeCloseTo(200 / 29, 5);
			expect(call[1].margin).toBe(4);
		});

		it("forwards darkColor, lightColor, moduleShape, cornerRadius to SVGRenderer", () => {
			const { svgString } = useQRCode("test", {
				darkColor: "#111",
				lightColor: "#eee",
				moduleShape: "rounded",
				cornerRadius: 0.3,
			});

			// Trigger computed evaluation
			svgString.value;

			expect(mockSVGRender).toHaveBeenCalledWith(
				FAKE_MATRIX,
				expect.objectContaining({
					darkColor: "#111",
					lightColor: "#eee",
					moduleShape: "rounded",
					cornerRadius: 0.3,
				}),
			);
		});
	});

	describe("reactivity", () => {
		it("recomputes when value ref changes", async () => {
			const value = ref("first");
			const { svgString } = useQRCode(value);

			// Access to trigger initial evaluation
			svgString.value;
			expect(mockGenerate).toHaveBeenCalledTimes(1);

			value.value = "second";
			await nextTick();

			// Access again to trigger recomputation
			svgString.value;
			expect(mockGenerate).toHaveBeenCalledTimes(2);
		});

		it("recomputes when options ref changes", async () => {
			const value = ref("test");
			const options = ref({ errorCorrectionLevel: "L" as const });
			const { svgString } = useQRCode(value, options);

			// Access to trigger initial computation
			svgString.value;
			expect(mockGenerate).toHaveBeenCalledTimes(1);

			options.value = { errorCorrectionLevel: "H" };
			await nextTick();

			// Access again to trigger recomputation
			svgString.value;
			expect(mockGenerate).toHaveBeenCalledTimes(2);
		});

		it("works with getter function as value", () => {
			const state = ref("from-getter");
			const { svgString } = useQRCode(() => state.value);

			expect(svgString.value).toBe('<svg><rect fill="#000"/></svg>');
		});

		it("works with computed as value", () => {
			const base = ref("base");
			const derivedValue = computed(() => `qr-${base.value}`);
			const { svgString } = useQRCode(derivedValue);

			expect(svgString.value).toBe('<svg><rect fill="#000"/></svg>');

			const calls = (MockQRCodeClass as unknown as { _calls: unknown[][] })
				._calls;
			expect(calls[0][0]).toBe("qr-base");
		});
	});

	describe("memoization / caching", () => {
		it("does not regenerate when accessed multiple times with same inputs", () => {
			const { svgString, svgDataURL } = useQRCode("same");

			// Access multiple times
			svgString.value;
			svgDataURL.value;
			svgString.value;

			// Vue's computed() memoizes — only 1 call
			expect(mockGenerate).toHaveBeenCalledTimes(1);
		});
	});

	describe("error handling", () => {
		it("catches generation errors and returns error state", () => {
			mockGenerate.mockImplementation(() => {
				throw new Error("Content too long");
			});

			const { isError, error, svgString, svgDataURL } = useQRCode(
				"x".repeat(5000),
			);

			expect(isError.value).toBe(true);
			expect(error.value).toBeInstanceOf(Error);
			expect(error.value?.message).toBe("Content too long");
			expect(svgString.value).toBe("");
			expect(svgDataURL.value).toBe("");
		});

		it("handles non-Error throw values", () => {
			mockGenerate.mockImplementation(() => {
				throw "string error";
			});

			const { isError, error } = useQRCode("test");

			expect(isError.value).toBe(true);
			expect(error.value?.message).toBe("string error");
		});
	});

	describe("download", () => {
		it("does nothing if there was a generation error", () => {
			mockGenerate.mockImplementation(() => {
				throw new Error("fail");
			});

			const createObjectURL = vi.fn();
			globalThis.URL.createObjectURL = createObjectURL;

			const { download } = useQRCode("test");

			download("my-qr");

			expect(createObjectURL).not.toHaveBeenCalled();
		});

		it("downloads SVG with xml declaration by default", () => {
			const mockRevokeObjectURL = vi.fn();
			const mockCreateObjectURL = vi
				.fn()
				.mockReturnValue("blob:http://localhost/fake");
			globalThis.URL.createObjectURL = mockCreateObjectURL;
			globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

			const mockClick = vi.fn();
			const originalCreateElement = document.createElement.bind(document);
			const spy = vi
				.spyOn(document, "createElement")
				.mockImplementation((tag: string, options?: ElementCreationOptions) => {
					if (tag === "a") {
						return {
							href: "",
							download: "",
							click: mockClick,
						} as unknown as HTMLAnchorElement;
					}
					return originalCreateElement(tag, options);
				});

			const { download } = useQRCode("test");

			download("my-qr", "svg");

			// Should have called SVGRenderer.render again with xmlDeclaration
			expect(mockSVGRender).toHaveBeenCalledWith(
				FAKE_MATRIX,
				expect.objectContaining({ xmlDeclaration: true }),
			);
			expect(mockClick).toHaveBeenCalled();
			expect(mockRevokeObjectURL).toHaveBeenCalled();

			spy.mockRestore();
		});
	});
});
