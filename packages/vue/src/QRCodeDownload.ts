/**
 * @fileoverview QRCodeDownload component
 * @description Button component that downloads a QR code as SVG or PNG.
 * @module @qr-plus/vue/QRCodeDownload
 */

import type { ErrorCorrectionLevel, ModuleShape } from "@qr-plus/core";
import type { PropType } from "vue";
import { defineComponent, h } from "vue";
import type { DownloadFormat } from "./types";
import { useQRCode } from "./useQRCode";

/**
 * Button component that triggers a QR code download.
 *
 * Renders a native `<button>` element. Does NOT render the QR visually —
 * it only handles the download action. Pair it with `<QRCode />` to
 * show the QR alongside the download button.
 *
 * @example Basic usage
 * ```vue
 * <QRCodeDownload value="https://example.com">
 *   Download QR
 * </QRCodeDownload>
 * ```
 *
 * @example PNG download with custom options
 * ```vue
 * <QRCodeDownload
 *   value="https://example.com"
 *   file-name="ticket-qr"
 *   format="png"
 *   error-correction-level="H"
 *   class="bg-blue-600 text-white px-4 py-2 rounded"
 * >
 *   Download PNG
 * </QRCodeDownload>
 * ```
 */
const QRCodeDownload = defineComponent({
	name: "QRCodeDownload",
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
		fileName: { type: String, default: "qrcode" },
		format: {
			type: String as PropType<DownloadFormat>,
			default: "svg",
		},
		class: { type: String, default: undefined },
		disabled: { type: Boolean, default: undefined },
	},
	setup(props, { slots }) {
		const { download, isError } = useQRCode(
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

		const handleClick = () => {
			download(props.fileName, props.format);
		};

		return () =>
			h(
				"button",
				{
					type: "button",
					onClick: handleClick,
					class: props.class,
					disabled: props.disabled ?? isError.value,
				},
				slots.default?.(),
			);
	},
});

export { QRCodeDownload };
