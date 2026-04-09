/**
 * @fileoverview Custom errors for @qr-plus/wifi
 * @module @qr-plus/wifi/errors
 */

const WIFI_ERROR_CODE = {
	EMPTY_SSID: "EMPTY_SSID",
	PASSWORD_REQUIRED: "PASSWORD_REQUIRED",
	INVALID_ENCRYPTION: "INVALID_ENCRYPTION",
} as const;

type WifiErrorCode = (typeof WIFI_ERROR_CODE)[keyof typeof WIFI_ERROR_CODE];

class WifiError extends Error {
	readonly code: WifiErrorCode;

	constructor(code: WifiErrorCode, message: string) {
		super(message);
		this.name = "WifiError";
		this.code = code;
	}
}

export type { WifiErrorCode };
export { WIFI_ERROR_CODE, WifiError };
