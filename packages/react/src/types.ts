/**
 * @fileoverview Shared types for @qr-plus/react
 * @description Type definitions for components and hooks.
 * @module @qr-plus/react/types
 */

import type {
  ErrorCorrectionLevel,
  ModuleShape,
  QRCodeOptions,
  SVGRenderOptions,
  RenderOptions,
} from "@qr-plus/core";

/**
 * Download format options for QR export.
 */
const DOWNLOAD_FORMAT = {
  SVG: "svg",
  PNG: "png",
} as const;

type DownloadFormat = (typeof DOWNLOAD_FORMAT)[keyof typeof DOWNLOAD_FORMAT];

/**
 * Core QR generation options exposed to the user.
 * Simplified from the full QRCodeOptions — hides advanced internals
 * like version, mask, and mode (always auto).
 */
interface QROptions {
  /** Error correction level. @default "M" */
  errorCorrectionLevel?: ErrorCorrectionLevel;
}

/**
 * Visual rendering options shared across SVG components and the hook.
 */
interface QRRenderOptions {
  /** QR code size in pixels. @default 200 */
  size?: number;
  /** Quiet zone margin in modules. @default 4 */
  margin?: number;
  /** Dark module color (hex). @default "#000000" */
  darkColor?: string;
  /** Light module color (hex). @default "#ffffff" */
  lightColor?: string;
  /**
   * Shape of individual modules.
   * Only applies to SVG renderer.
   * @default "square"
   */
  moduleShape?: ModuleShape;
  /**
   * Corner radius for 'rounded' shape (0-1).
   * 0 = square, 1 = maximum rounding.
   * Only applies when moduleShape is 'rounded'.
   * @default 0.5
   */
  cornerRadius?: number;
}

/**
 * Combined QR options — generation + rendering.
 * Used by components and the hook.
 */
interface QRCodeBaseProps extends QROptions, QRRenderOptions {
  /** Text or URL to encode. */
  value: string;
}

/**
 * Props for the <QRCode /> SVG component.
 */
interface QRCodeProps extends QRCodeBaseProps {
  /** CSS class name for the wrapping element. */
  className?: string;
  /** Accessible title for the SVG. */
  title?: string;
}

/**
 * Props for the <QRCodeCanvas /> component.
 */
interface QRCodeCanvasProps extends QRCodeBaseProps {
  /** CSS class name for the canvas element. */
  className?: string;
}

/**
 * Props for the <QRCodeDownload /> button component.
 */
interface QRCodeDownloadProps extends QRCodeBaseProps {
  /** Download file name (without extension). @default "qrcode" */
  fileName?: string;
  /** Download format. @default "svg" */
  format?: DownloadFormat;
  /** Content inside the button. */
  children: React.ReactNode;
  /** CSS class name for the button element. */
  className?: string;
  /** Whether the button is disabled. */
  disabled?: boolean;
}

/**
 * Options for the useQRCode hook.
 */
interface UseQRCodeOptions extends QROptions, QRRenderOptions {}

/**
 * Return value of the useQRCode hook.
 */
interface UseQRCodeResult {
  /** Full SVG markup string. */
  svgString: string;
  /** Data URL (base64) for use as img src. */
  svgDataURL: string;
  /** Trigger a download of the QR code. */
  download: (fileName?: string, format?: DownloadFormat) => void;
  /** Whether an error occurred during generation. */
  isError: boolean;
  /** The error object if generation failed, null otherwise. */
  error: Error | null;
}

/**
 * Internal helper: converts user-facing props to core QRCodeOptions.
 */
function toQRCodeOptions(options: QROptions): QRCodeOptions {
  return {
    errorCorrectionLevel: options.errorCorrectionLevel,
  };
}

/**
 * Internal helper: converts user-facing props to core SVGRenderOptions.
 * Maps `size` to `scale` based on a reasonable default module count.
 */
function toSVGRenderOptions(options: QRRenderOptions): SVGRenderOptions {
  return {
    scale: options.size ? undefined : 10,
    margin: options.margin,
    darkColor: options.darkColor,
    lightColor: options.lightColor,
    moduleShape: options.moduleShape,
    cornerRadius: options.cornerRadius,
  };
}

/**
 * Internal helper: converts user-facing props to core RenderOptions (canvas).
 */
function toCanvasRenderOptions(options: QRRenderOptions): RenderOptions {
  return {
    scale: options.size ? undefined : 10,
    margin: options.margin,
    darkColor: options.darkColor,
    lightColor: options.lightColor,
  };
}

export {
  DOWNLOAD_FORMAT,
  toQRCodeOptions,
  toSVGRenderOptions,
  toCanvasRenderOptions,
};

export type {
  DownloadFormat,
  QROptions,
  QRRenderOptions,
  QRCodeBaseProps,
  QRCodeProps,
  QRCodeCanvasProps,
  QRCodeDownloadProps,
  UseQRCodeOptions,
  UseQRCodeResult,
};
