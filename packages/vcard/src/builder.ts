/**
 * @fileoverview vCard string builder
 * @description Builds vCard 3.0/4.0 formatted strings for QR code encoding.
 *
 * Generates standard-compliant vCard content following RFC 6350 (v4.0)
 * and RFC 2426 (v3.0).
 *
 * @module @qr-plus/vcard/builder
 * @see https://datatracker.ietf.org/doc/html/rfc6350
 * @see https://datatracker.ietf.org/doc/html/rfc2426
 */

import { VCARD_ERROR_CODE, VCardError } from "./errors";
import type {
	EmailEntry,
	PhoneEntry,
	VCardAddress,
	VCardConfig,
} from "./types";
import { EMAIL_TYPE, PHONE_TYPE, VCARD_VERSION } from "./types";

/**
 * Basic email validation pattern.
 * Not RFC 5322 exhaustive — good enough for QR use cases.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Basic phone validation: allows +, digits, spaces, dashes, parens.
 */
const PHONE_PATTERN = /^[+\d\s\-().]+$/;

/**
 * Basic URL validation.
 */
const URL_PATTERN = /^https?:\/\/.+/;

/**
 * Escapes special characters in vCard field values.
 * Per RFC 6350: backslash, semicolon, comma, and newline must be escaped.
 */
function escapeValue(value: string): string {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\n/g, "\\n");
}

/**
 * Normalizes phone input to an array of PhoneEntry.
 */
function normalizePhones(phone: string | PhoneEntry[]): PhoneEntry[] {
	if (typeof phone === "string") {
		return [{ number: phone, type: PHONE_TYPE.CELL }];
	}
	return phone;
}

/**
 * Normalizes email input to an array of EmailEntry.
 */
function normalizeEmails(email: string | EmailEntry[]): EmailEntry[] {
	if (typeof email === "string") {
		return [{ address: email, type: EMAIL_TYPE.INTERNET }];
	}
	return email;
}

/**
 * Validates a vCard configuration object.
 * @throws {VCardError} If the configuration is invalid.
 */
function validateConfig(config: VCardConfig): void {
	if (!config.firstName || config.firstName.trim().length === 0) {
		throw new VCardError(
			VCARD_ERROR_CODE.EMPTY_NAME,
			"First name must be a non-empty string.",
		);
	}

	if (config.email) {
		const emails = normalizeEmails(config.email);
		for (const entry of emails) {
			if (!EMAIL_PATTERN.test(entry.address)) {
				throw new VCardError(
					VCARD_ERROR_CODE.INVALID_EMAIL,
					`Invalid email address: "${entry.address}".`,
				);
			}
		}
	}

	if (config.phone) {
		const phones = normalizePhones(config.phone);
		for (const entry of phones) {
			if (!PHONE_PATTERN.test(entry.number)) {
				throw new VCardError(
					VCARD_ERROR_CODE.INVALID_PHONE,
					`Invalid phone number: "${entry.number}".`,
				);
			}
		}
	}

	if (config.website && !URL_PATTERN.test(config.website)) {
		throw new VCardError(
			VCARD_ERROR_CODE.INVALID_URL,
			`Invalid URL: "${config.website}". Must start with http:// or https://.`,
		);
	}
}

/**
 * Formats an address into a vCard ADR line.
 * vCard 3.0 ADR format: PO Box;Extended;Street;City;Region;Postal;Country
 */
function formatAddress(address: VCardAddress): string {
	const parts = [
		"", // PO Box
		"", // Extended address
		escapeValue(address.street ?? ""),
		escapeValue(address.city ?? ""),
		escapeValue(address.region ?? ""),
		escapeValue(address.postalCode ?? ""),
		escapeValue(address.country ?? ""),
	];
	return parts.join(";");
}

/**
 * Builds a vCard string from a configuration object.
 *
 * @param config - vCard contact configuration
 * @returns Formatted vCard string ready for QR encoding
 *
 * @throws {VCardError} If firstName is empty, email is invalid,
 *   phone is invalid, or URL is malformed.
 *
 * @example Basic contact
 * ```typescript
 * const content = buildVCardString({
 *   firstName: "John",
 *   lastName: "Doe",
 *   email: "john@example.com",
 *   phone: "+1234567890",
 * });
 * ```
 *
 * @example Full contact with multiple phones
 * ```typescript
 * const content = buildVCardString({
 *   firstName: "Jane",
 *   lastName: "Smith",
 *   organization: "Acme Inc",
 *   title: "Engineer",
 *   phone: [
 *     { number: "+1234567890", type: "CELL" },
 *     { number: "+0987654321", type: "WORK" },
 *   ],
 *   email: "jane@acme.com",
 *   website: "https://acme.com",
 *   address: {
 *     street: "123 Main St",
 *     city: "Springfield",
 *     region: "IL",
 *     postalCode: "62701",
 *     country: "USA",
 *   },
 * });
 * ```
 */
function buildVCardString(config: VCardConfig): string {
	validateConfig(config);

	const version = config.version ?? VCARD_VERSION.V3;
	const lastName = config.lastName ?? "";
	const lines: string[] = [];

	lines.push("BEGIN:VCARD");
	lines.push(`VERSION:${version}`);
	lines.push(`N:${escapeValue(lastName)};${escapeValue(config.firstName)};;;`);

	const fullName = lastName
		? `${config.firstName} ${lastName}`
		: config.firstName;
	lines.push(`FN:${escapeValue(fullName)}`);

	if (config.organization) {
		lines.push(`ORG:${escapeValue(config.organization)}`);
	}

	if (config.title) {
		lines.push(`TITLE:${escapeValue(config.title)}`);
	}

	if (config.phone) {
		const phones = normalizePhones(config.phone);
		for (const entry of phones) {
			const type = entry.type ?? PHONE_TYPE.CELL;
			lines.push(`TEL;TYPE=${type}:${entry.number}`);
		}
	}

	if (config.email) {
		const emails = normalizeEmails(config.email);
		for (const entry of emails) {
			const type = entry.type ?? EMAIL_TYPE.INTERNET;
			lines.push(`EMAIL;TYPE=${type}:${entry.address}`);
		}
	}

	if (config.website) {
		lines.push(`URL:${config.website}`);
	}

	if (config.address) {
		lines.push(`ADR;TYPE=HOME:${formatAddress(config.address)}`);
	}

	if (config.note) {
		lines.push(`NOTE:${escapeValue(config.note)}`);
	}

	lines.push("END:VCARD");

	return lines.join("\n");
}

export { buildVCardString, escapeValue, validateConfig };
