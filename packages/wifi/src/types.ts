/**
 * @fileoverview Shared types for @qr-plus/wifi
 * @description Type definitions for WiFi QR code generation.
 * @module @qr-plus/wifi/types
 */

/**
 * WiFi encryption types supported by the QR standard.
 */
const WIFI_ENCRYPTION = {
	WPA: "WPA",
	WEP: "WEP",
	NONE: "nopass",
} as const;

type WifiEncryption = (typeof WIFI_ENCRYPTION)[keyof typeof WIFI_ENCRYPTION];

/**
 * Configuration for WiFi QR code string generation.
 */
interface WifiConfig {
	/** Network name (SSID). Must be non-empty. */
	ssid: string;
	/** Network password. Required for WPA and WEP. */
	password?: string;
	/** Encryption type. @default "WPA" */
	encryption?: WifiEncryption;
	/** Whether the network is hidden. @default false */
	hidden?: boolean;
}

export type { WifiConfig, WifiEncryption };
export { WIFI_ENCRYPTION };
