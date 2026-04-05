/**
 * @fileoverview QRCodeDownload component
 * @description Button component that downloads a QR code as SVG or PNG.
 * @module @qr-plus/react/QRCodeDownload
 */

"use client";

import type { QRCodeDownloadProps } from "./types";
import { useQRCode } from "./useQRCode";

/**
 * Button component that triggers a QR code download.
 *
 * Renders a native `<button>` element. Does NOT render the QR visually —
 * it only handles the download action. Pair it with `<QRCode />` to
 * show the QR alongside the download button.
 *
 * @example Basic usage
 * ```tsx
 * <QRCodeDownload value="https://example.com">
 *   Download QR
 * </QRCodeDownload>
 * ```
 *
 * @example PNG download with custom options
 * ```tsx
 * <QRCodeDownload
 *   value="https://example.com"
 *   fileName="ticket-qr"
 *   format="png"
 *   errorCorrectionLevel="H"
 *   className="bg-blue-600 text-white px-4 py-2 rounded"
 * >
 *   Download PNG
 * </QRCodeDownload>
 * ```
 *
 * @example Paired with QRCode
 * ```tsx
 * const qrProps = {
 *   value: "https://example.com",
 *   errorCorrectionLevel: "H" as const,
 *   moduleShape: "rounded" as const,
 * };
 *
 * <div>
 *   <QRCode {...qrProps} size={240} />
 *   <QRCodeDownload {...qrProps} fileName="my-qr">
 *     Download SVG
 *   </QRCodeDownload>
 * </div>
 * ```
 */
function QRCodeDownload({
  value,
  size,
  margin,
  errorCorrectionLevel,
  darkColor,
  lightColor,
  moduleShape,
  cornerRadius,
  fileName = "qrcode",
  format = "svg",
  children,
  className,
  disabled,
}: QRCodeDownloadProps) {
  const { download, isError } = useQRCode(value, {
    size,
    margin,
    errorCorrectionLevel,
    darkColor,
    lightColor,
    moduleShape,
    cornerRadius,
  });

  const handleClick = () => {
    download(fileName, format);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      disabled={disabled ?? isError}
    >
      {children}
    </button>
  );
}

export { QRCodeDownload };
