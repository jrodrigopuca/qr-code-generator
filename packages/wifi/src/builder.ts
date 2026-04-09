/**
 * @fileoverview WiFi QR string builder
 * @description Builds WiFi network configuration strings following
 * the WIFI: URI scheme (ZXing standard).
 *
 * Format: WIFI:T:<encryption>;S:<ssid>;P:<password>;H:<hidden>;;
 *
 * Special characters in SSID and password are escaped with backslash:
 * \, ;, ,, ", and :
 *
 * @module @qr-plus/wifi/builder
 * @see https://github.com/zxing/zxing/wiki/Barcode-Contents#wi-fi-network-config-android-ios-11
 */

import { WIFI_ERROR_CODE, WifiError } from "./errors";
import type { WifiConfig, WifiEncryption } from "./types";
import { WIFI_ENCRYPTION } from "./types";

/**
 * Characters that must be escaped in WiFi QR strings.
 * Per the ZXing specification: backslash, semicolon, comma, double-quote, colon.
 */
const SPECIAL_CHARS = /([\\;,":])/;

/**
 * Escapes special characters in a WiFi field value.
 * @param value - Raw string value
 * @returns Escaped string safe for WiFi QR format
 */
function escapeValue(value: string): string {
	return value.replace(new RegExp(SPECIAL_CHARS.source, "g"), "\\$1");
}

/**
 * Validates that the given encryption type is one of the supported values.
 */
function isValidEncryption(value: string): value is WifiEncryption {
	const valid: readonly string[] = Object.values(WIFI_ENCRYPTION);
	return valid.includes(value);
}

/**
 * Validates a WiFi configuration object.
 * @throws {WifiError} If the configuration is invalid.
 */
function validateConfig(config: WifiConfig): void {
	if (!config.ssid || config.ssid.trim().length === 0) {
		throw new WifiError(
			WIFI_ERROR_CODE.EMPTY_SSID,
			"SSID must be a non-empty string.",
		);
	}

	const encryption = config.encryption ?? WIFI_ENCRYPTION.WPA;

	if (!isValidEncryption(encryption)) {
		throw new WifiError(
			WIFI_ERROR_CODE.INVALID_ENCRYPTION,
			`Invalid encryption type: "${encryption}". Expected one of: WPA, WEP, nopass.`,
		);
	}

	if (
		encryption !== WIFI_ENCRYPTION.NONE &&
		(!config.password || config.password.length === 0)
	) {
		throw new WifiError(
			WIFI_ERROR_CODE.PASSWORD_REQUIRED,
			`Password is required for encryption type "${encryption}".`,
		);
	}
}

/**
 * Builds a WiFi QR code content string from a configuration object.
 *
 * @param config - WiFi network configuration
 * @returns Formatted WiFi QR string following ZXing standard
 *
 * @throws {WifiError} If SSID is empty, password is missing for WPA/WEP,
 *   or encryption type is invalid.
 *
 * @example
 * ```typescript
 * const content = buildWifiString({
 *   ssid: "MyNetwork",
 *   password: "super-secret",
 *   encryption: "WPA",
 * });
 * // => "WIFI:T:WPA;S:MyNetwork;P:super-secret;;"
 * ```
 *
 * @example Hidden network
 * ```typescript
 * const content = buildWifiString({
 *   ssid: "HiddenNet",
 *   password: "pass123",
 *   hidden: true,
 * });
 * // => "WIFI:T:WPA;S:HiddenNet;P:pass123;H:true;;"
 * ```
 *
 * @example Open network (no password)
 * ```typescript
 * const content = buildWifiString({
 *   ssid: "FreeWiFi",
 *   encryption: "nopass",
 * });
 * // => "WIFI:T:nopass;S:FreeWiFi;;"
 * ```
 */
function buildWifiString(config: WifiConfig): string {
	validateConfig(config);

	const encryption = config.encryption ?? WIFI_ENCRYPTION.WPA;
	const ssid = escapeValue(config.ssid);

	let result = `WIFI:T:${encryption};S:${ssid};`;

	if (encryption !== WIFI_ENCRYPTION.NONE && config.password) {
		result += `P:${escapeValue(config.password)};`;
	}

	if (config.hidden) {
		result += "H:true;";
	}

	result += ";";

	return result;
}

export { buildWifiString, escapeValue, validateConfig };
