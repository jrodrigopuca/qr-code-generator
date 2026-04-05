/**
 * @fileoverview QRCodeCanvas component
 * @description React component for rendering QR codes on an HTML canvas.
 * @module @qr-plus/react/QRCodeCanvas
 */

"use client";

import { useRef, useEffect } from "react";
import {
  QRCode as QRCodeGenerator,
  CanvasRenderer,
} from "@qr-plus/core";
import type { QRCodeCanvasProps } from "./types";

const DEFAULT_SIZE = 200;
const DEFAULT_MARGIN = 4;

/**
 * Renders a QR code on an HTML5 canvas element.
 *
 * Use this when you need pixel-level control or plan to extract
 * the canvas as a raster image. For most use cases, prefer `<QRCode />`
 * which renders SVG.
 *
 * Note: Canvas renderer only supports square and rounded module shapes.
 * For circle/dot shapes, use `<QRCode />` (SVG).
 *
 * @example Basic usage
 * ```tsx
 * <QRCodeCanvas value="https://example.com" />
 * ```
 *
 * @example Custom styling
 * ```tsx
 * <QRCodeCanvas
 *   value="https://example.com"
 *   size={300}
 *   errorCorrectionLevel="H"
 *   darkColor="#1a1a1a"
 *   className="border rounded"
 * />
 * ```
 */
function QRCodeCanvas({
  value,
  size = DEFAULT_SIZE,
  margin = DEFAULT_MARGIN,
  errorCorrectionLevel,
  darkColor,
  lightColor,
  moduleShape,
  cornerRadius,
  className,
}: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const qr = new QRCodeGenerator(value, {
        errorCorrectionLevel,
      });
      const result = qr.generate();
      const scale = size / (result.size + margin * 2);

      const renderOptions = {
        scale,
        margin,
        darkColor,
        lightColor,
      };

      if (moduleShape === "rounded") {
        CanvasRenderer.renderRounded(
          canvas,
          result.matrix,
          renderOptions,
          cornerRadius ?? 0.4,
        );
      } else {
        CanvasRenderer.render(canvas, result.matrix, renderOptions);
      }
    } catch {
      // Generation error — clear canvas
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [
    value,
    size,
    margin,
    errorCorrectionLevel,
    darkColor,
    lightColor,
    moduleShape,
    cornerRadius,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="QR Code"
    />
  );
}

export { QRCodeCanvas };
