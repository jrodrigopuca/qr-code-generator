/**
 * @fileoverview @qr-plus/wifi — Entry Point
 * @description WiFi QR code string builder with validation.
 * Generates properly formatted WiFi configuration strings
 * following the ZXing standard.
 *
 * @packageDocumentation
 * @module @qr-plus/wifi
 * @license MIT
 *
 * @example Build a WiFi string for use with any QR generator
 * ```typescript
 * import { buildWifiString } from "@qr-plus/wifi";
 *
 * const content = buildWifiString({
 *   ssid: "MyNetwork",
 *   password: "super-secret",
 *   encryption: "WPA",
 * });
 * // => "WIFI:T:WPA;S:MyNetwork;P:super-secret;;"
 * ```
 *
 * @example Generate a complete WiFi QR code (with @qr-plus/core)
 * ```typescript
 * import { buildWifiString } from "@qr-plus/wifi";
 * import { renderToSVG } from "@qr-plus/core";
 *
 * const svg = renderToSVG(buildWifiString({
 *   ssid: "MyNetwork",
 *   password: "secret",
 * }));
 * ```
 */

// Builder
export { buildWifiString } from "./builder";

// Errors
export { WIFI_ERROR_CODE, WifiError } from "./errors";
export type { WifiConfig, WifiEncryption } from "./types";
// Types
export { WIFI_ENCRYPTION } from "./types";
