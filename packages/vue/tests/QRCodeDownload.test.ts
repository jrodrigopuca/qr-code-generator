/**
 * @fileoverview Tests for QRCodeDownload button component
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock @qr-plus/core — vi.hoisted ensures variables are available in factory
// ---------------------------------------------------------------------------

const { mockGenerate, mockSVGRender, mockSVGToDataURL, constructorCalls } =
	vi.hoisted(() => ({
		mockGenerate: vi.fn(),
		mockSVGRender: vi.fn(),
		mockSVGToDataURL: vi.fn(),
		constructorCalls: [] as unknown[][],
	}));

vi.mock("@qr-plus/core", () => ({
	QRCode: class MockQRCode {
		constructor(...args: unknown[]) {
			constructorCalls.push(args);
		}
		generate() {
			return mockGenerate();
		}
	},
	SVGRenderer: {
		render: mockSVGRender,
		toDataURL: mockSVGToDataURL,
	},
}));

import { QRCodeDownload } from "../src/QRCodeDownload";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupMocks() {
	mockGenerate.mockReturnValue({
		matrix: [
			[1, 0],
			[0, 1],
		],
		version: 1,
		size: 21,
	});
	mockSVGRender.mockReturnValue("<svg></svg>");
	mockSVGToDataURL.mockReturnValue("data:image/svg+xml;base64,AAAA");
}

function setupBlobMocks() {
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

	return { mockCreateObjectURL, mockRevokeObjectURL, mockClick, spy };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("QRCodeDownload", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
		constructorCalls.length = 0;
		setupMocks();
	});

	describe("rendering", () => {
		it("renders a button element", () => {
			const wrapper = mount(QRCodeDownload, {
				props: { value: "test" },
				slots: { default: "Download" },
			});

			const button = wrapper.find("button");
			expect(button.exists()).toBe(true);
			expect(button.element.tagName).toBe("BUTTON");
		});

		it("renders slot content inside the button", () => {
			const wrapper = mount(QRCodeDownload, {
				props: { value: "test" },
				slots: { default: "<span>Download QR</span>" },
			});

			expect(wrapper.text()).toContain("Download QR");
		});

		it("has type=button (not submit)", () => {
			const wrapper = mount(QRCodeDownload, {
				props: { value: "test" },
				slots: { default: "Download" },
			});

			const button = wrapper.find("button");
			expect(button.attributes("type")).toBe("button");
		});

		it("applies class to the button", () => {
			const wrapper = mount(QRCodeDownload, {
				props: { value: "test", class: "bg-blue-600 px-4" },
				slots: { default: "Download" },
			});

			const button = wrapper.find("button");
			expect(button.classes()).toContain("bg-blue-600");
			expect(button.classes()).toContain("px-4");
		});
	});

	describe("disabled state", () => {
		it("is enabled when generation succeeds and disabled is not set", () => {
			const wrapper = mount(QRCodeDownload, {
				props: { value: "test" },
				slots: { default: "Download" },
			});

			const button = wrapper.find("button");
			expect(button.attributes("disabled")).toBeUndefined();
		});

		it("is disabled when generation fails (isError=true)", () => {
			mockGenerate.mockImplementation(() => {
				throw new Error("fail");
			});

			const wrapper = mount(QRCodeDownload, {
				props: { value: "bad" },
				slots: { default: "Download" },
			});

			const button = wrapper.find("button");
			expect(button.attributes("disabled")).toBeDefined();
		});

		it("respects explicit disabled prop (overrides isError)", () => {
			const wrapper = mount(QRCodeDownload, {
				props: { value: "test", disabled: true },
				slots: { default: "Download" },
			});

			const button = wrapper.find("button");
			expect(button.attributes("disabled")).toBeDefined();
		});

		it("can be explicitly enabled even though disabled defaults to isError", () => {
			const wrapper = mount(QRCodeDownload, {
				props: { value: "test", disabled: false },
				slots: { default: "Download" },
			});

			const button = wrapper.find("button");
			expect(button.attributes("disabled")).toBeUndefined();
		});
	});

	describe("click behavior", () => {
		it("triggers SVG download on click", async () => {
			const { mockClick, spy } = setupBlobMocks();

			const wrapper = mount(QRCodeDownload, {
				props: {
					value: "test",
					fileName: "my-qr",
					format: "svg",
				},
				slots: { default: "Download SVG" },
			});

			await wrapper.find("button").trigger("click");

			// SVGRenderer.render is called again with xmlDeclaration: true
			expect(mockSVGRender).toHaveBeenCalledWith(
				expect.any(Array),
				expect.objectContaining({ xmlDeclaration: true }),
			);
			expect(mockClick).toHaveBeenCalled();

			spy.mockRestore();
		});

		it("uses default fileName='qrcode' and format='svg'", async () => {
			const { mockClick, spy } = setupBlobMocks();

			const wrapper = mount(QRCodeDownload, {
				props: { value: "test" },
				slots: { default: "Download" },
			});

			await wrapper.find("button").trigger("click");

			expect(mockClick).toHaveBeenCalled();

			spy.mockRestore();
		});
	});

	describe("options forwarding", () => {
		it("passes all QR options to useQRCode internally", () => {
			mount(QRCodeDownload, {
				props: {
					value: "https://example.com",
					errorCorrectionLevel: "H",
					size: 400,
					margin: 2,
					darkColor: "#333",
					lightColor: "#ccc",
					moduleShape: "circle",
					cornerRadius: 0.5,
				},
				slots: { default: "Download" },
			});

			// Check constructor was called with correct QR options
			expect(constructorCalls.length).toBeGreaterThan(0);
			expect(constructorCalls[0]).toEqual([
				"https://example.com",
				{ errorCorrectionLevel: "H" },
			]);

			expect(mockSVGRender).toHaveBeenCalledWith(
				expect.any(Array),
				expect.objectContaining({
					margin: 2,
					darkColor: "#333",
					lightColor: "#ccc",
					moduleShape: "circle",
					cornerRadius: 0.5,
				}),
			);
		});
	});
});
