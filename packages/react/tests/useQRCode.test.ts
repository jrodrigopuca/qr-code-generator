/**
 * @fileoverview Tests for useQRCode hook
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

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
    constructor(...args: unknown[]) {
      // Store constructor call for assertions
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
      const { result } = renderHook(() => useQRCode("hello"));

      expect(result.current.svgString).toBe(
        '<svg><rect fill="#000"/></svg>',
      );
    });

    it("returns svgDataURL from SVGRenderer.toDataURL", () => {
      const { result } = renderHook(() => useQRCode("hello"));

      expect(result.current.svgDataURL).toBe(
        "data:image/svg+xml;base64,AAAA",
      );
    });

    it("has no error state on success", () => {
      const { result } = renderHook(() => useQRCode("hello"));

      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("returns a download function", () => {
      const { result } = renderHook(() => useQRCode("hello"));

      expect(typeof result.current.download).toBe("function");
    });
  });

  describe("options forwarding", () => {
    it("passes errorCorrectionLevel to QRCode constructor", () => {
      renderHook(() =>
        useQRCode("test", { errorCorrectionLevel: "H" }),
      );

      const calls = (
        MockQRCodeClass as unknown as { _calls: unknown[][] }
      )._calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0]).toEqual([
        "test",
        { errorCorrectionLevel: "H" },
      ]);
    });

    it("computes scale from size, matrixSize and margin", () => {
      setupMocks({ size: 21 });

      renderHook(() =>
        useQRCode("test", { size: 290, margin: 4 }),
      );

      // scale = 290 / (21 + 4*2) = 290 / 29 = 10
      expect(mockSVGRender).toHaveBeenCalledWith(
        FAKE_MATRIX,
        expect.objectContaining({ scale: 10, margin: 4 }),
      );
    });

    it("uses default size=200 and margin=4 when not specified", () => {
      setupMocks({ size: 21 });

      renderHook(() => useQRCode("test"));

      // scale = 200 / (21 + 4*2) = 200/29 ≈ 6.896...
      const call = mockSVGRender.mock.calls[0];
      expect(call[1].scale).toBeCloseTo(200 / 29, 5);
      expect(call[1].margin).toBe(4);
    });

    it("forwards darkColor, lightColor, moduleShape, cornerRadius to SVGRenderer", () => {
      renderHook(() =>
        useQRCode("test", {
          darkColor: "#111",
          lightColor: "#eee",
          moduleShape: "rounded",
          cornerRadius: 0.3,
        }),
      );

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

  describe("memoization / caching", () => {
    it("does not regenerate when value and options are the same", () => {
      const { rerender } = renderHook(
        ({ value }) => useQRCode(value),
        { initialProps: { value: "same" } },
      );

      expect(mockGenerate).toHaveBeenCalledTimes(1);

      rerender({ value: "same" });
      expect(mockGenerate).toHaveBeenCalledTimes(1);
    });

    it("regenerates when value changes", () => {
      const { rerender } = renderHook(
        ({ value }) => useQRCode(value),
        { initialProps: { value: "first" } },
      );

      expect(mockGenerate).toHaveBeenCalledTimes(1);

      rerender({ value: "second" });
      expect(mockGenerate).toHaveBeenCalledTimes(2);
    });

    it("regenerates when options change", () => {
      const { rerender } = renderHook(
        ({ ecl }) =>
          useQRCode("same", { errorCorrectionLevel: ecl }),
        {
          initialProps: {
            ecl: "L" as const,
          },
        },
      );

      expect(mockGenerate).toHaveBeenCalledTimes(1);

      rerender({ ecl: "H" as const });
      expect(mockGenerate).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("catches generation errors and returns error state", () => {
      mockGenerate.mockImplementation(() => {
        throw new Error("Content too long");
      });

      const { result } = renderHook(() => useQRCode("x".repeat(5000)));

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Content too long");
      expect(result.current.svgString).toBe("");
      expect(result.current.svgDataURL).toBe("");
    });

    it("handles non-Error throw values", () => {
      mockGenerate.mockImplementation(() => {
        throw "string error";
      });

      const { result } = renderHook(() => useQRCode("test"));

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe("string error");
    });
  });

  describe("download", () => {
    it("does nothing if there was a generation error", () => {
      mockGenerate.mockImplementation(() => {
        throw new Error("fail");
      });

      const createObjectURL = vi.fn();
      globalThis.URL.createObjectURL = createObjectURL;

      const { result } = renderHook(() => useQRCode("test"));

      act(() => {
        result.current.download("my-qr");
      });

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

      const { result } = renderHook(() => useQRCode("test"));

      act(() => {
        result.current.download("my-qr", "svg");
      });

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
