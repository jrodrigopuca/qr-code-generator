/**
 * @fileoverview QRCodeCanvas component
 * @description Vue component for rendering QR codes on an HTML canvas.
 * @module @qr-plus/vue/QRCodeCanvas
 */

import type { ErrorCorrectionLevel, ModuleShape } from "@qr-plus/core";
import { CanvasRenderer, QRCode as QRCodeGenerator } from "@qr-plus/core";
import type { PropType } from "vue";
import { defineComponent, h, onMounted, ref, watch } from "vue";

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
 * ```vue
 * <QRCodeCanvas value="https://example.com" />
 * ```
 *
 * @example Custom styling
 * ```vue
 * <QRCodeCanvas
 *   value="https://example.com"
 *   :size="300"
 *   error-correction-level="H"
 *   dark-color="#1a1a1a"
 *   class="border rounded"
 * />
 * ```
 */
const QRCodeCanvas = defineComponent({
	name: "QRCodeCanvas",
	props: {
		value: { type: String, required: true },
		size: { type: Number, default: DEFAULT_SIZE },
		margin: { type: Number, default: DEFAULT_MARGIN },
		errorCorrectionLevel: {
			type: String as PropType<ErrorCorrectionLevel>,
			default: undefined,
		},
		darkColor: { type: String, default: undefined },
		lightColor: { type: String, default: undefined },
		moduleShape: {
			type: String as PropType<ModuleShape>,
			default: undefined,
		},
		cornerRadius: { type: Number, default: undefined },
		class: { type: String, default: undefined },
	},
	setup(props) {
		const canvasRef = ref<HTMLCanvasElement | null>(null);
		let isMounted = false;

		function renderCanvas() {
			const canvas = canvasRef.value;
			if (!canvas) return;

			try {
				const qr = new QRCodeGenerator(props.value, {
					errorCorrectionLevel: props.errorCorrectionLevel,
				});
				const result = qr.generate();
				const scale = props.size / (result.size + props.margin * 2);

				const renderOptions = {
					scale,
					margin: props.margin,
					darkColor: props.darkColor,
					lightColor: props.lightColor,
				};

				if (props.moduleShape === "rounded") {
					CanvasRenderer.renderRounded(
						canvas,
						result.matrix,
						renderOptions,
						props.cornerRadius ?? 0.4,
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
		}

		onMounted(() => {
			isMounted = true;
			renderCanvas();
		});

		watch(
			() => [
				props.value,
				props.size,
				props.margin,
				props.errorCorrectionLevel,
				props.darkColor,
				props.lightColor,
				props.moduleShape,
				props.cornerRadius,
			],
			() => {
				if (isMounted) {
					renderCanvas();
				}
			},
		);

		return () =>
			h("canvas", {
				ref: canvasRef,
				class: props.class,
				role: "img",
				"aria-label": "QR Code",
			});
	},
});

export { QRCodeCanvas };
