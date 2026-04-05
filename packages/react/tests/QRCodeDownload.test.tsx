/**
 * @fileoverview Tests for QRCodeDownload button component
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

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
      render(
        <QRCodeDownload value="test">Download</QRCodeDownload>,
      );

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
    });

    it("renders children inside the button", () => {
      render(
        <QRCodeDownload value="test">
          <span>Download QR</span>
        </QRCodeDownload>,
      );

      expect(screen.getByText("Download QR")).toBeInTheDocument();
    });

    it("has type=button (not submit)", () => {
      render(
        <QRCodeDownload value="test">Download</QRCodeDownload>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("applies className to the button", () => {
      render(
        <QRCodeDownload value="test" className="bg-blue-600 px-4">
          Download
        </QRCodeDownload>,
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-blue-600", "px-4");
    });
  });

  describe("disabled state", () => {
    it("is enabled when generation succeeds and disabled is not set", () => {
      render(
        <QRCodeDownload value="test">Download</QRCodeDownload>,
      );

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("is disabled when generation fails (isError=true)", () => {
      mockGenerate.mockImplementation(() => {
        throw new Error("fail");
      });

      render(
        <QRCodeDownload value="bad">Download</QRCodeDownload>,
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("respects explicit disabled prop (overrides isError)", () => {
      render(
        <QRCodeDownload value="test" disabled={true}>
          Download
        </QRCodeDownload>,
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("can be explicitly enabled even though disabled defaults to isError", () => {
      render(
        <QRCodeDownload value="test" disabled={false}>
          Download
        </QRCodeDownload>,
      );

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });
  });

  describe("click behavior", () => {
    it("triggers SVG download on click", () => {
      const { mockClick, spy } = setupBlobMocks();

      render(
        <QRCodeDownload value="test" fileName="my-qr" format="svg">
          Download SVG
        </QRCodeDownload>,
      );

      fireEvent.click(screen.getByRole("button"));

      // SVGRenderer.render is called again with xmlDeclaration: true
      expect(mockSVGRender).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ xmlDeclaration: true }),
      );
      expect(mockClick).toHaveBeenCalled();

      spy.mockRestore();
    });

    it("uses default fileName='qrcode' and format='svg'", () => {
      const { mockClick, spy } = setupBlobMocks();

      render(
        <QRCodeDownload value="test">Download</QRCodeDownload>,
      );

      fireEvent.click(screen.getByRole("button"));

      expect(mockClick).toHaveBeenCalled();

      spy.mockRestore();
    });
  });

  describe("options forwarding", () => {
    it("passes all QR options to useQRCode internally", () => {
      render(
        <QRCodeDownload
          value="https://example.com"
          errorCorrectionLevel="H"
          size={400}
          margin={2}
          darkColor="#333"
          lightColor="#ccc"
          moduleShape="circle"
          cornerRadius={0.5}
        >
          Download
        </QRCodeDownload>,
      );

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
