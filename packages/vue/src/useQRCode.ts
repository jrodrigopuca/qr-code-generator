/**
 * @fileoverview useQRCode composable
 * @description Composable for QR code generation with SVG output, data URL, and download support.
 * @module @qr-plus/vue/useQRCode
 */

import type { QRMatrix, SVGRenderOptions } from "@qr-plus/core";
import { QRCode as QRCodeGenerator, SVGRenderer } from "@qr-plus/core";
import type { MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import type {
	DownloadFormat,
	UseQRCodeOptions,
	UseQRCodeResult,
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
function svgToPngBlob(svgString: string, size: number): Promise<Blob> {
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
 * Composable for generating QR codes with SVG output, data URL, and download helpers.
 *
 * @param value - Text or URL to encode into a QR code (accepts ref, getter, or plain string)
 * @param options - Generation and rendering options (accepts ref, getter, or plain object)
 * @returns Object with reactive svgString, svgDataURL, download function, and error state
 *
 * @example
 * ```vue
 * <script setup>
 * import { useQRCode } from "@qr-plus/vue";
 *
 * const { svgString, svgDataURL, download, isError, error } = useQRCode(
 *   "https://example.com",
 *   { errorCorrectionLevel: "H", moduleShape: "rounded" }
 * );
 * </script>
 *
 * <template>
 *   <div v-html="svgString" />
 *   <img :src="svgDataURL" alt="QR Code" />
 *   <button @click="download('my-qr', 'svg')">Download SVG</button>
 * </template>
 * ```
 */
function useQRCode(
	value: MaybeRefOrGetter<string>,
	options: MaybeRefOrGetter<UseQRCodeOptions> = {},
): UseQRCodeResult {
	/**
	 * Core computed: generates QR code and produces all derived values.
	 * Vue's computed() provides built-in memoization — only re-evaluates
	 * when reactive dependencies (value, options) change.
	 */
	const result = computed(() => {
		const rawValue = toValue(value);
		const rawOptions = toValue(options);

		try {
			const qr = new QRCodeGenerator(rawValue, {
				errorCorrectionLevel: rawOptions.errorCorrectionLevel,
			});
			const generated = qr.generate();
			const svgOptions = buildSVGOptions(rawOptions, generated.size);
			const svgString = SVGRenderer.render(generated.matrix, svgOptions);
			const svgDataURL = SVGRenderer.toDataURL(generated.matrix, svgOptions);

			return {
				svgString,
				svgDataURL,
				matrix: generated.matrix,
				svgOptions,
				error: null as Error | null,
			};
		} catch (err) {
			return {
				svgString: "",
				svgDataURL: "",
				matrix: [] as QRMatrix,
				svgOptions: {} as SVGRenderOptions,
				error: err instanceof Error ? err : new Error(String(err)),
			};
		}
	});

	const svgString = computed(() => result.value.svgString);
	const svgDataURL = computed(() => result.value.svgDataURL);
	const error = computed(() => result.value.error);
	const isError = computed(() => result.value.error !== null);

	const download = (
		fileName: string = "qrcode",
		format: DownloadFormat = "svg",
	): void => {
		const current = result.value;
		if (current.error || !current.svgString) return;

		if (format === "png") {
			const rawOptions = toValue(options);
			const size = rawOptions.size ?? DEFAULT_SIZE;
			svgToPngBlob(current.svgString, size)
				.then((blob) => {
					downloadBlob(blob, `${fileName}.png`);
				})
				.catch(() => {
					// PNG conversion failure — silent (no reactive error state like React's useState)
				});
		} else {
			const svgWithDeclaration = SVGRenderer.render(current.matrix, {
				...current.svgOptions,
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

export { buildSVGOptions, downloadBlob, svgToPngBlob, useQRCode };
