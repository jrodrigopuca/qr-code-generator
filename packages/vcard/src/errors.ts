/**
 * @fileoverview Custom errors for @qr-plus/vcard
 * @module @qr-plus/vcard/errors
 */

const VCARD_ERROR_CODE = {
	EMPTY_NAME: "EMPTY_NAME",
	INVALID_EMAIL: "INVALID_EMAIL",
	INVALID_PHONE: "INVALID_PHONE",
	INVALID_URL: "INVALID_URL",
} as const;

type VCardErrorCode = (typeof VCARD_ERROR_CODE)[keyof typeof VCARD_ERROR_CODE];

class VCardError extends Error {
	readonly code: VCardErrorCode;

	constructor(code: VCardErrorCode, message: string) {
		super(message);
		this.name = "VCardError";
		this.code = code;
	}
}

export type { VCardErrorCode };
export { VCARD_ERROR_CODE, VCardError };
