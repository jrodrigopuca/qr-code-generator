/**
 * @fileoverview QRCode SVG component
 * @description Drop-in Vue component for rendering QR codes as SVG.
 * @module @qr-plus/vue/QRCode
 */

import type { ErrorCorrectionLevel, ModuleShape } from "@qr-plus/core";
import type { PropType } from "vue";
import { defineComponent, h } from "vue";
import { useQRCode } from "./useQRCode";

/**
 * Renders a QR code as an inline SVG element.
 *
 * This is the primary component — SVG-first, scalable, and supports
 * all module shapes (square, rounded, circle, dot).
 *
 * @example Basic usage
 * ```vue
 * <QRCode value="https://example.com" />
 * ```
 *
 * @example Custom styling
 * ```vue
 * <QRCode
 *   value="https://example.com"
 *   :size="240"
 *   error-correction-level="H"
 *   module-shape="rounded"
 *   :corner-radius="0.3"
 *   dark-color="#111827"
 *   light-color="#ffffff"
 *   class="shadow-lg rounded-lg"
 * />
 * ```
 */
const QRCode = defineComponent({
	name: "QRCode",
	props: {
		value: { type: String, required: true },
		size: { type: Number, default: undefined },
		margin: { type: Number, default: undefined },
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
		title: { type: String, default: undefined },
	},
	setup(props) {
		const { svgString, isError } = useQRCode(
			() => props.value,
			() => ({
				size: props.size,
				margin: props.margin,
				errorCorrectionLevel: props.errorCorrectionLevel,
				darkColor: props.darkColor,
				lightColor: props.lightColor,
				moduleShape: props.moduleShape,
				cornerRadius: props.cornerRadius,
			}),
		);

		return () => {
			if (isError.value || !svgString.value) {
				return null;
			}

			return h("div", {
				class: props.class,
				role: "img",
				"aria-label": props.title ?? "QR Code",
				innerHTML: svgString.value,
			});
		};
	},
});

export { QRCode };
