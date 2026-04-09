/**
 * @fileoverview Shared types for @qr-plus/vcard
 * @description Type definitions for vCard QR code generation.
 * @module @qr-plus/vcard/types
 */

/**
 * Supported vCard versions.
 * 3.0 is recommended for QR codes — compact and widely supported.
 */
const VCARD_VERSION = {
	V3: "3.0",
	V4: "4.0",
} as const;

type VCardVersion = (typeof VCARD_VERSION)[keyof typeof VCARD_VERSION];

/**
 * Phone type identifiers for vCard TEL property.
 */
const PHONE_TYPE = {
	CELL: "CELL",
	WORK: "WORK",
	HOME: "HOME",
	FAX: "FAX",
	PAGER: "PAGER",
} as const;

type PhoneType = (typeof PHONE_TYPE)[keyof typeof PHONE_TYPE];

/**
 * A phone entry with type and number.
 */
interface PhoneEntry {
	/** Phone number. */
	number: string;
	/** Phone type. @default "CELL" */
	type?: PhoneType;
}

/**
 * Email type identifiers for vCard EMAIL property.
 */
const EMAIL_TYPE = {
	WORK: "WORK",
	HOME: "HOME",
	INTERNET: "INTERNET",
} as const;

type EmailType = (typeof EMAIL_TYPE)[keyof typeof EMAIL_TYPE];

/**
 * An email entry with type and address.
 */
interface EmailEntry {
	/** Email address. */
	address: string;
	/** Email type. @default "INTERNET" */
	type?: EmailType;
}

/**
 * Address fields for vCard ADR property.
 * Per vCard 3.0: PO Box ; Extended ; Street ; City ; Region ; Postal ; Country
 */
interface VCardAddress {
	/** Street address. */
	street?: string;
	/** City / locality. */
	city?: string;
	/** State / province / region. */
	region?: string;
	/** Postal / ZIP code. */
	postalCode?: string;
	/** Country name. */
	country?: string;
}

/**
 * Configuration for vCard QR code string generation.
 */
interface VCardConfig {
	/** First name. Required. */
	firstName: string;
	/** Last name. Optional. */
	lastName?: string;
	/** Organization / company name. */
	organization?: string;
	/** Job title. */
	title?: string;
	/**
	 * Phone number(s).
	 * Can be a single string (treated as CELL) or an array of PhoneEntry.
	 */
	phone?: string | PhoneEntry[];
	/**
	 * Email address(es).
	 * Can be a single string (treated as INTERNET) or an array of EmailEntry.
	 */
	email?: string | EmailEntry[];
	/** Website URL. */
	website?: string;
	/** Physical address. */
	address?: VCardAddress;
	/** Note / additional information. */
	note?: string;
	/** vCard version. @default "3.0" */
	version?: VCardVersion;
}

export type {
	EmailEntry,
	EmailType,
	PhoneEntry,
	PhoneType,
	VCardAddress,
	VCardConfig,
	VCardVersion,
};
export { EMAIL_TYPE, PHONE_TYPE, VCARD_VERSION };
