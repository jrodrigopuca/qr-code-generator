/**
 * @fileoverview @qr-plus/react — Entry Point
 * @description React components and hooks for QR code generation.
 * SVG-first, zero-config, fully typed.
 *
 * @packageDocumentation
 * @module @qr-plus/react
 * @license MIT
 *
 * @example Quick start
 * ```tsx
 * import { QRCode } from "@qr-plus/react";
 *
 * <QRCode value="https://example.com" />
 * ```
 *
 * @example With hook
 * ```tsx
 * import { useQRCode } from "@qr-plus/react";
 *
 * const { svgString, download } = useQRCode("https://example.com");
 * ```
 */

// Components
export { QRCode } from "./QRCode";
export { QRCodeCanvas } from "./QRCodeCanvas";
export { QRCodeDownload } from "./QRCodeDownload";

// Hook
export { useQRCode } from "./useQRCode";

// Types
export type {
  QRCodeProps,
  QRCodeCanvasProps,
  QRCodeDownloadProps,
  UseQRCodeOptions,
  UseQRCodeResult,
  DownloadFormat,
  QROptions,
  QRRenderOptions,
} from "./types";
