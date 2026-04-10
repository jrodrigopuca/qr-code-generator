/**
 * @fileoverview Shared types for @qr-plus/vue
 * @description Type definitions for components and composables.
 * @module @qr-plus/vue/types
 */

import type {
	ErrorCorrectionLevel,
	ModuleShape,
	QRCodeOptions,
	RenderOptions,
	SVGRenderOptions,
} from "@qr-plus/core";
import type { ComputedRef } from "vue";

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
 * Visual rendering options shared across SVG components and the composable.
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
 * Used by components and the composable.
 */
interface QRCodeBaseProps extends QROptions, QRRenderOptions {
	/** Text or URL to encode. */
	value: string;
}

/**
 * Props for the <QRCode /> SVG component.
 */
interface QRCodeProps extends QRCodeBaseProps {
	/** CSS class for the wrapping element. */
	class?: string;
	/** Accessible title for the SVG. */
	title?: string;
}

/**
 * Props for the <QRCodeCanvas /> component.
 */
interface QRCodeCanvasProps extends QRCodeBaseProps {
	/** CSS class for the canvas element. */
	class?: string;
}

/**
 * Props for the <QRCodeDownload /> button component.
 * Content is passed via the default slot (Vue convention).
 */
interface QRCodeDownloadProps extends QRCodeBaseProps {
	/** Download file name (without extension). @default "qrcode" */
	fileName?: string;
	/** Download format. @default "svg" */
	format?: DownloadFormat;
	/** CSS class for the button element. */
	class?: string;
	/** Whether the button is disabled. */
	disabled?: boolean;
}

/**
 * Options for the useQRCode composable.
 */
interface UseQRCodeOptions extends QROptions, QRRenderOptions {}

/**
 * Return value of the useQRCode composable.
 * All values are reactive (ComputedRef).
 */
interface UseQRCodeResult {
	/** Full SVG markup string. */
	svgString: ComputedRef<string>;
	/** Data URL (base64) for use as img src. */
	svgDataURL: ComputedRef<string>;
	/** Trigger a download of the QR code. */
	download: (fileName?: string, format?: DownloadFormat) => void;
	/** Whether an error occurred during generation. */
	isError: ComputedRef<boolean>;
	/** The error object if generation failed, null otherwise. */
	error: ComputedRef<Error | null>;
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

export type {
	DownloadFormat,
	QRCodeBaseProps,
	QRCodeCanvasProps,
	QRCodeDownloadProps,
	QRCodeProps,
	QROptions,
	QRRenderOptions,
	UseQRCodeOptions,
	UseQRCodeResult,
};
export {
	DOWNLOAD_FORMAT,
	toCanvasRenderOptions,
	toQRCodeOptions,
	toSVGRenderOptions,
};
