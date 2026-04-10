/**
 * @fileoverview Tests for QRCode SVG component
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
		generate() {
			return mockGenerate();
		}
	},
	SVGRenderer: {
		render: mockSVGRender,
		toDataURL: mockSVGToDataURL,
	},
}));

import { QRCode } from "../src/QRCode";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_SVG = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';

function setupMocks() {
	mockGenerate.mockReturnValue({
		matrix: [
			[1, 0],
			[0, 1],
		],
		version: 1,
		size: 21,
	});
	mockSVGRender.mockReturnValue(FAKE_SVG);
	mockSVGToDataURL.mockReturnValue("data:image/svg+xml;base64,AAAA");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("QRCode", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setupMocks();
	});

	describe("rendering", () => {
		it("renders an element with role=img", () => {
			const wrapper = mount(QRCode, {
				props: { value: "https://example.com" },
			});

			const el = wrapper.find('[role="img"]');
			expect(el.exists()).toBe(true);
		});

		it("injects SVG string via innerHTML (v-html equivalent)", () => {
			const wrapper = mount(QRCode, {
				props: { value: "test" },
			});

			const el = wrapper.find('[role="img"]');
			expect(el.html()).toContain("http://www.w3.org/2000/svg");
			expect(el.html()).toContain("<rect");
		});

		it("renders a div element as the wrapper", () => {
			const wrapper = mount(QRCode, {
				props: { value: "test" },
			});

			const el = wrapper.find('[role="img"]');
			expect(el.element.tagName).toBe("DIV");
		});
	});

	describe("accessibility", () => {
		it('has default aria-label of "QR Code"', () => {
			const wrapper = mount(QRCode, {
				props: { value: "test" },
			});

			const el = wrapper.find('[role="img"]');
			expect(el.attributes("aria-label")).toBe("QR Code");
		});

		it("uses title prop as aria-label when provided", () => {
			const wrapper = mount(QRCode, {
				props: {
					value: "test",
					title: "Scan to visit example.com",
				},
			});

			const el = wrapper.find('[role="img"]');
			expect(el.attributes("aria-label")).toBe("Scan to visit example.com");
		});
	});

	describe("class binding", () => {
		it("applies class to the wrapper div", () => {
			const wrapper = mount(QRCode, {
				props: { value: "test", class: "my-qr shadow-lg" },
			});

			const el = wrapper.find('[role="img"]');
			expect(el.classes()).toContain("my-qr");
			expect(el.classes()).toContain("shadow-lg");
		});

		it("renders without class when not provided", () => {
			const wrapper = mount(QRCode, {
				props: { value: "test" },
			});

			const el = wrapper.find('[role="img"]');
			expect(el.attributes("class")).toBeUndefined();
		});
	});

	describe("error handling", () => {
		it("renders nothing when generation fails", () => {
			mockGenerate.mockImplementation(() => {
				throw new Error("Generation failed");
			});

			const wrapper = mount(QRCode, {
				props: { value: "bad-input" },
			});

			expect(wrapper.find('[role="img"]').exists()).toBe(false);
		});

		it("renders nothing when svgString is empty", () => {
			mockSVGRender.mockReturnValue("");

			const wrapper = mount(QRCode, {
				props: { value: "test" },
			});

			expect(wrapper.find('[role="img"]').exists()).toBe(false);
		});
	});

	describe("options forwarding", () => {
		it("passes all rendering options to useQRCode", () => {
			mount(QRCode, {
				props: {
					value: "test",
					size: 300,
					margin: 2,
					errorCorrectionLevel: "H",
					darkColor: "#111",
					lightColor: "#fff",
					moduleShape: "dot",
					cornerRadius: 0.5,
				},
			});

			// Verify SVGRenderer was called with correct derived options
			expect(mockSVGRender).toHaveBeenCalledWith(
				expect.any(Array),
				expect.objectContaining({
					margin: 2,
					darkColor: "#111",
					lightColor: "#fff",
					moduleShape: "dot",
					cornerRadius: 0.5,
				}),
			);
		});
	});
});
