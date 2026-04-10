/**
 * @fileoverview @qr-plus/vue — Entry Point
 * @description Vue 3 components and composables for QR code generation.
 * SVG-first, zero-config, fully typed.
 *
 * @packageDocumentation
 * @module @qr-plus/vue
 * @license MIT
 *
 * @example Quick start
 * ```vue
 * <script setup>
 * import { QRCode } from "@qr-plus/vue";
 * </script>
 *
 * <template>
 *   <QRCode value="https://example.com" />
 * </template>
 * ```
 *
 * @example With composable
 * ```vue
 * <script setup>
 * import { useQRCode } from "@qr-plus/vue";
 *
 * const { svgString, download } = useQRCode("https://example.com");
 * </script>
 * ```
 */

// Components
export { QRCode } from "./QRCode";
export { QRCodeCanvas } from "./QRCodeCanvas";
export { QRCodeDownload } from "./QRCodeDownload";
// Types
export type {
	DownloadFormat,
	QRCodeCanvasProps,
	QRCodeDownloadProps,
	QRCodeProps,
	QROptions,
	QRRenderOptions,
	UseQRCodeOptions,
	UseQRCodeResult,
} from "./types";
// Composable
export { useQRCode } from "./useQRCode";
