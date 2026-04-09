/**
 * @fileoverview @qr-plus/vcard — Entry Point
 * @description vCard QR code string builder with validation.
 * Generates standard-compliant vCard 3.0/4.0 content
 * for QR code encoding.
 *
 * @packageDocumentation
 * @module @qr-plus/vcard
 * @license MIT
 *
 * @example Build a vCard string for use with any QR generator
 * ```typescript
 * import { buildVCardString } from "@qr-plus/vcard";
 *
 * const content = buildVCardString({
 *   firstName: "John",
 *   lastName: "Doe",
 *   email: "john@example.com",
 *   phone: "+1234567890",
 * });
 * ```
 *
 * @example Generate a complete vCard QR code (with @qr-plus/core)
 * ```typescript
 * import { buildVCardString } from "@qr-plus/vcard";
 * import { renderToSVG } from "@qr-plus/core";
 *
 * const svg = renderToSVG(buildVCardString({
 *   firstName: "John",
 *   lastName: "Doe",
 *   phone: "+1234567890",
 * }));
 * ```
 */

// Builder
export { buildVCardString } from "./builder";

// Errors
export { VCARD_ERROR_CODE, VCardError } from "./errors";
export type {
	EmailEntry,
	EmailType,
	PhoneEntry,
	PhoneType,
	VCardAddress,
	VCardConfig,
	VCardVersion,
} from "./types";
// Types
export {
	EMAIL_TYPE,
	PHONE_TYPE,
	VCARD_VERSION,
} from "./types";
