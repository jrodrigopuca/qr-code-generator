/**
 * @fileoverview useQRCode hook
 * @description Hook for QR code generation with SVG output, data URL, and download support.
 * @module @qr-plus/react/useQRCode
 */

"use client";

import { useState, useRef } from "react";
import {
  QRCode as QRCodeGenerator,
  SVGRenderer,
} from "@qr-plus/core";
import type { QRMatrix, SVGRenderOptions } from "@qr-plus/core";
import type {
  UseQRCodeOptions,
  UseQRCodeResult,
  DownloadFormat,
} from "./types";

const DEFAULT_SIZE = 200;
const DEFAULT_MARGIN = 4;

/**
 * Computes the SVG render options from user-facing options and the generated matrix.
 * When `size` is provided, we calculate `scale` so the final SVG matches that size.
 */
function buildSVGOptions(
  options: UseQRCodeOptions,
  matrixSize: number,
): SVGRenderOptions {
  const margin = options.margin ?? DEFAULT_MARGIN;
  const size = options.size ?? DEFAULT_SIZE;
  const scale = size / (matrixSize + margin * 2);

  return {
    scale,
    margin,
    darkColor: options.darkColor,
    lightColor: options.lightColor,
    moduleShape: options.moduleShape,
    cornerRadius: options.cornerRadius,
  };
}

/**
 * Triggers a browser file download from a Blob.
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Creates a PNG blob from an SVG string at the given pixel size.
 */
function svgToPngBlob(
  svgString: string,
  size: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Could not get 2D context from canvas"));
        return;
      }

      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create PNG blob"));
        }
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG for PNG conversion"));
    };

    img.src = url;
  });
}

/**
 * Hook for generating QR codes with SVG output, data URL, and download helpers.
 *
 * @param value - Text or URL to encode into a QR code
 * @param options - Generation and rendering options
 * @returns Object with svgString, svgDataURL, download function, and error state
 *
 * @example
 * ```tsx
 * const { svgString, svgDataURL, download, isError, error } = useQRCode(
 *   "https://example.com",
 *   { errorCorrectionLevel: "H", moduleShape: "rounded" }
 * );
 *
 * // Use as inline SVG
 * <div dangerouslySetInnerHTML={{ __html: svgString }} />
 *
 * // Use as image
 * <img src={svgDataURL} alt="QR Code" />
 *
 * // Download
 * <button onClick={() => download("my-qr.svg")}>Download SVG</button>
 * <button onClick={() => download("my-qr.png", "png")}>Download PNG</button>
 * ```
 */
function useQRCode(
  value: string,
  options: UseQRCodeOptions = {},
): UseQRCodeResult {
  const [pngError, setPngError] = useState<Error | null>(null);
  const lastResultRef = useRef<{
    value: string;
    optionsKey: string;
    svgString: string;
    svgDataURL: string;
    matrix: QRMatrix;
    svgOptions: SVGRenderOptions;
    error: Error | null;
  } | null>(null);

  // Serialize options for comparison (stable key)
  const optionsKey = JSON.stringify({
    ecl: options.errorCorrectionLevel,
    size: options.size,
    margin: options.margin,
    dark: options.darkColor,
    light: options.lightColor,
    shape: options.moduleShape,
    radius: options.cornerRadius,
  });

  // Compute during render (no useEffect needed) — memoize manually
  let svgString = "";
  let svgDataURL = "";
  let matrix: QRMatrix = [];
  let svgOptions: SVGRenderOptions = {};
  let generationError: Error | null = null;

  const cached = lastResultRef.current;
  if (cached && cached.value === value && cached.optionsKey === optionsKey) {
    svgString = cached.svgString;
    svgDataURL = cached.svgDataURL;
    matrix = cached.matrix;
    svgOptions = cached.svgOptions;
    generationError = cached.error;
  } else {
    try {
      const qr = new QRCodeGenerator(value, {
        errorCorrectionLevel: options.errorCorrectionLevel,
      });
      const result = qr.generate();
      matrix = result.matrix;
      svgOptions = buildSVGOptions(options, result.size);
      svgString = SVGRenderer.render(matrix, svgOptions);
      svgDataURL = SVGRenderer.toDataURL(matrix, svgOptions);
      generationError = null;
    } catch (err) {
      generationError =
        err instanceof Error ? err : new Error(String(err));
      svgString = "";
      svgDataURL = "";
    }

    lastResultRef.current = {
      value,
      optionsKey,
      svgString,
      svgDataURL,
      matrix,
      svgOptions,
      error: generationError,
    };
  }

  const error = generationError ?? pngError;
  const isError = error !== null;

  const download = (
    fileName: string = "qrcode",
    format: DownloadFormat = "svg",
  ): void => {
    if (generationError || !svgString) return;

    if (format === "png") {
      const size = options.size ?? DEFAULT_SIZE;
      svgToPngBlob(svgString, size)
        .then((blob) => {
          downloadBlob(blob, `${fileName}.png`);
          setPngError(null);
        })
        .catch((err) => {
          setPngError(
            err instanceof Error ? err : new Error(String(err)),
          );
        });
    } else {
      const svgWithDeclaration = SVGRenderer.render(matrix, {
        ...svgOptions,
        xmlDeclaration: true,
      });
      const blob = new Blob([svgWithDeclaration], {
        type: "image/svg+xml",
      });
      downloadBlob(blob, `${fileName}.svg`);
    }
  };

  return {
    svgString,
    svgDataURL,
    download,
    isError,
    error,
  };
}

export { useQRCode };
