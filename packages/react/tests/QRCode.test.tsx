/**
 * @fileoverview Tests for QRCode SVG component
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock @qr-plus/core — vi.hoisted ensures variables are available in factory
// ---------------------------------------------------------------------------

const { mockGenerate, mockSVGRender, mockSVGToDataURL } = vi.hoisted(
  () => ({
    mockGenerate: vi.fn(),
    mockSVGRender: vi.fn(),
    mockSVGToDataURL: vi.fn(),
  }),
);

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
      render(<QRCode value="https://example.com" />);

      const el = screen.getByRole("img");
      expect(el).toBeInTheDocument();
    });

    it("injects SVG string via dangerouslySetInnerHTML", () => {
      render(<QRCode value="test" />);

      const el = screen.getByRole("img");
      // jsdom normalizes self-closing <rect/> to <rect></rect>
      expect(el.innerHTML).toContain("http://www.w3.org/2000/svg");
      expect(el.innerHTML).toContain("<rect");
    });

    it("renders a div element as the wrapper", () => {
      render(<QRCode value="test" />);

      const el = screen.getByRole("img");
      expect(el.tagName).toBe("DIV");
    });
  });

  describe("accessibility", () => {
    it('has default aria-label of "QR Code"', () => {
      render(<QRCode value="test" />);

      const el = screen.getByRole("img");
      expect(el).toHaveAttribute("aria-label", "QR Code");
    });

    it("uses title prop as aria-label when provided", () => {
      render(<QRCode value="test" title="Scan to visit example.com" />);

      const el = screen.getByRole("img");
      expect(el).toHaveAttribute(
        "aria-label",
        "Scan to visit example.com",
      );
    });
  });

  describe("className", () => {
    it("applies className to the wrapper div", () => {
      render(<QRCode value="test" className="my-qr shadow-lg" />);

      const el = screen.getByRole("img");
      expect(el).toHaveClass("my-qr", "shadow-lg");
    });

    it("renders without className when not provided", () => {
      render(<QRCode value="test" />);

      const el = screen.getByRole("img");
      expect(el.className).toBe("");
    });
  });

  describe("error handling", () => {
    it("returns null when generation fails", () => {
      mockGenerate.mockImplementation(() => {
        throw new Error("Generation failed");
      });

      const { container } = render(<QRCode value="bad-input" />);

      expect(container.innerHTML).toBe("");
    });

    it("returns null when svgString is empty", () => {
      mockSVGRender.mockReturnValue("");

      const { container } = render(<QRCode value="test" />);

      expect(container.innerHTML).toBe("");
    });
  });

  describe("options forwarding", () => {
    it("passes all rendering options to useQRCode", () => {
      render(
        <QRCode
          value="test"
          size={300}
          margin={2}
          errorCorrectionLevel="H"
          darkColor="#111"
          lightColor="#fff"
          moduleShape="dot"
          cornerRadius={0.5}
        />,
      );

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
