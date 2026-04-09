import { describe, expect, it } from "vitest";
import {
	buildVCardString,
	EMAIL_TYPE,
	PHONE_TYPE,
	VCARD_ERROR_CODE,
	VCARD_VERSION,
	VCardError,
} from "../src";

describe("buildVCardString", () => {
	describe("basic functionality", () => {
		it("should generate minimal vCard with first name only", () => {
			const result = buildVCardString({
				firstName: "John",
			});

			expect(result).toContain("BEGIN:VCARD");
			expect(result).toContain("VERSION:3.0");
			expect(result).toContain("N:;John;;;");
			expect(result).toContain("FN:John");
			expect(result).toContain("END:VCARD");
		});

		it("should generate vCard with first and last name", () => {
			const result = buildVCardString({
				firstName: "John",
				lastName: "Doe",
			});

			expect(result).toContain("N:Doe;John;;;");
			expect(result).toContain("FN:John Doe");
		});

		it("should include organization", () => {
			const result = buildVCardString({
				firstName: "John",
				organization: "Acme Inc",
			});

			expect(result).toContain("ORG:Acme Inc");
		});

		it("should include title", () => {
			const result = buildVCardString({
				firstName: "John",
				title: "Engineer",
			});

			expect(result).toContain("TITLE:Engineer");
		});

		it("should include single phone as CELL", () => {
			const result = buildVCardString({
				firstName: "John",
				phone: "+1234567890",
			});

			expect(result).toContain("TEL;TYPE=CELL:+1234567890");
		});

		it("should include single email as INTERNET", () => {
			const result = buildVCardString({
				firstName: "John",
				email: "john@example.com",
			});

			expect(result).toContain("EMAIL;TYPE=INTERNET:john@example.com");
		});

		it("should include website URL", () => {
			const result = buildVCardString({
				firstName: "John",
				website: "https://example.com",
			});

			expect(result).toContain("URL:https://example.com");
		});

		it("should include note", () => {
			const result = buildVCardString({
				firstName: "John",
				note: "Met at conference",
			});

			expect(result).toContain("NOTE:Met at conference");
		});

		it("should use vCard 4.0 when specified", () => {
			const result = buildVCardString({
				firstName: "John",
				version: VCARD_VERSION.V4,
			});

			expect(result).toContain("VERSION:4.0");
		});

		it("should default to vCard 3.0", () => {
			const result = buildVCardString({
				firstName: "John",
			});

			expect(result).toContain("VERSION:3.0");
		});
	});

	describe("multiple phones and emails", () => {
		it("should include multiple phone numbers with types", () => {
			const result = buildVCardString({
				firstName: "Jane",
				phone: [
					{ number: "+1234567890", type: PHONE_TYPE.CELL },
					{ number: "+0987654321", type: PHONE_TYPE.WORK },
				],
			});

			expect(result).toContain("TEL;TYPE=CELL:+1234567890");
			expect(result).toContain("TEL;TYPE=WORK:+0987654321");
		});

		it("should default phone type to CELL", () => {
			const result = buildVCardString({
				firstName: "Jane",
				phone: [{ number: "+1234567890" }],
			});

			expect(result).toContain("TEL;TYPE=CELL:+1234567890");
		});

		it("should include multiple email addresses with types", () => {
			const result = buildVCardString({
				firstName: "Jane",
				email: [
					{ address: "jane@work.com", type: EMAIL_TYPE.WORK },
					{ address: "jane@home.com", type: EMAIL_TYPE.HOME },
				],
			});

			expect(result).toContain("EMAIL;TYPE=WORK:jane@work.com");
			expect(result).toContain("EMAIL;TYPE=HOME:jane@home.com");
		});

		it("should default email type to INTERNET", () => {
			const result = buildVCardString({
				firstName: "Jane",
				email: [{ address: "jane@example.com" }],
			});

			expect(result).toContain("EMAIL;TYPE=INTERNET:jane@example.com");
		});
	});

	describe("address formatting", () => {
		it("should format full address", () => {
			const result = buildVCardString({
				firstName: "John",
				address: {
					street: "123 Main St",
					city: "Springfield",
					region: "IL",
					postalCode: "62701",
					country: "USA",
				},
			});

			expect(result).toContain(
				"ADR;TYPE=HOME:;;123 Main St;Springfield;IL;62701;USA",
			);
		});

		it("should handle partial address", () => {
			const result = buildVCardString({
				firstName: "John",
				address: {
					city: "Buenos Aires",
					country: "Argentina",
				},
			});

			expect(result).toContain("ADR;TYPE=HOME:;;;Buenos Aires;;;Argentina");
		});

		it("should handle address with only street", () => {
			const result = buildVCardString({
				firstName: "John",
				address: {
					street: "456 Oak Ave",
				},
			});

			expect(result).toContain("ADR;TYPE=HOME:;;456 Oak Ave;;;;");
		});
	});

	describe("special character escaping", () => {
		it("should escape semicolons in name", () => {
			const result = buildVCardString({
				firstName: "John;Jr",
			});

			expect(result).toContain("N:;John\\;Jr;;;");
			expect(result).toContain("FN:John\\;Jr");
		});

		it("should escape commas in organization", () => {
			const result = buildVCardString({
				firstName: "John",
				organization: "Acme, Inc",
			});

			expect(result).toContain("ORG:Acme\\, Inc");
		});

		it("should escape backslashes in values", () => {
			// Input: C:\Users\John (2 literal backslashes)
			const result = buildVCardString({
				firstName: "John",
				note: "Path: C:\\\\Users\\\\John",
			});

			// Each \ is doubled by escaping → C:\\\\Users\\\\John (4 literal backslashes)
			const lines = result.split("\n");
			const noteLine = lines.find((l) => l.startsWith("NOTE:"));
			expect(noteLine).toBeDefined();
			expect(noteLine?.includes("C:\\\\\\\\Users\\\\\\\\John")).toBe(true);
		});

		it("should escape newlines in note", () => {
			const result = buildVCardString({
				firstName: "John",
				note: "Line 1\nLine 2",
			});

			expect(result).toContain("NOTE:Line 1\\nLine 2");
		});

		it("should escape special characters in address fields", () => {
			const result = buildVCardString({
				firstName: "John",
				address: {
					street: "123; Main St",
					city: "Spring,field",
				},
			});

			expect(result).toContain("123\\; Main St");
			expect(result).toContain("Spring\\,field");
		});
	});

	describe("validation", () => {
		it("should throw EMPTY_NAME for empty firstName", () => {
			expect(() => buildVCardString({ firstName: "" })).toThrow(VCardError);

			try {
				buildVCardString({ firstName: "" });
			} catch (error) {
				expect(error).toBeInstanceOf(VCardError);
				expect((error as VCardError).code).toBe(VCARD_ERROR_CODE.EMPTY_NAME);
			}
		});

		it("should throw EMPTY_NAME for whitespace-only firstName", () => {
			expect(() => buildVCardString({ firstName: "   " })).toThrow(VCardError);
		});

		it("should throw INVALID_EMAIL for bad email string", () => {
			expect(() =>
				buildVCardString({
					firstName: "John",
					email: "not-an-email",
				}),
			).toThrow(VCardError);

			try {
				buildVCardString({
					firstName: "John",
					email: "not-an-email",
				});
			} catch (error) {
				expect((error as VCardError).code).toBe(VCARD_ERROR_CODE.INVALID_EMAIL);
			}
		});

		it("should throw INVALID_EMAIL for bad email in array", () => {
			expect(() =>
				buildVCardString({
					firstName: "John",
					email: [{ address: "bad@" }],
				}),
			).toThrow(VCardError);
		});

		it("should throw INVALID_PHONE for bad phone string", () => {
			expect(() =>
				buildVCardString({
					firstName: "John",
					phone: "abc-not-a-phone",
				}),
			).toThrow(VCardError);

			try {
				buildVCardString({
					firstName: "John",
					phone: "abc-not-a-phone",
				});
			} catch (error) {
				expect((error as VCardError).code).toBe(VCARD_ERROR_CODE.INVALID_PHONE);
			}
		});

		it("should throw INVALID_PHONE for bad phone in array", () => {
			expect(() =>
				buildVCardString({
					firstName: "John",
					phone: [{ number: "not_valid!" }],
				}),
			).toThrow(VCardError);
		});

		it("should throw INVALID_URL for bad website", () => {
			expect(() =>
				buildVCardString({
					firstName: "John",
					website: "not-a-url",
				}),
			).toThrow(VCardError);

			try {
				buildVCardString({
					firstName: "John",
					website: "not-a-url",
				});
			} catch (error) {
				expect((error as VCardError).code).toBe(VCARD_ERROR_CODE.INVALID_URL);
			}
		});

		it("should accept http:// URLs", () => {
			expect(() =>
				buildVCardString({
					firstName: "John",
					website: "http://example.com",
				}),
			).not.toThrow();
		});

		it("should accept https:// URLs", () => {
			expect(() =>
				buildVCardString({
					firstName: "John",
					website: "https://example.com",
				}),
			).not.toThrow();
		});

		it("should accept valid phone formats", () => {
			const validPhones = [
				"+1234567890",
				"(555) 123-4567",
				"+1 (555) 123-4567",
				"555.123.4567",
				"5551234567",
			];

			for (const phone of validPhones) {
				expect(() =>
					buildVCardString({ firstName: "John", phone }),
				).not.toThrow();
			}
		});
	});

	describe("complete vCard structure", () => {
		it("should produce valid vCard with all fields", () => {
			const result = buildVCardString({
				firstName: "Jane",
				lastName: "Smith",
				organization: "Acme Inc",
				title: "Senior Engineer",
				phone: [
					{ number: "+1234567890", type: PHONE_TYPE.CELL },
					{ number: "+0987654321", type: PHONE_TYPE.WORK },
				],
				email: [
					{
						address: "jane@acme.com",
						type: EMAIL_TYPE.WORK,
					},
					{
						address: "jane@home.com",
						type: EMAIL_TYPE.HOME,
					},
				],
				website: "https://acme.com",
				address: {
					street: "123 Main St",
					city: "Springfield",
					region: "IL",
					postalCode: "62701",
					country: "USA",
				},
				note: "Met at conference 2026",
			});

			const lines = result.split("\n");
			expect(lines[0]).toBe("BEGIN:VCARD");
			expect(lines[1]).toBe("VERSION:3.0");
			expect(lines[2]).toBe("N:Smith;Jane;;;");
			expect(lines[3]).toBe("FN:Jane Smith");
			expect(lines[lines.length - 1]).toBe("END:VCARD");

			expect(result).toContain("ORG:Acme Inc");
			expect(result).toContain("TITLE:Senior Engineer");
			expect(result).toContain("TEL;TYPE=CELL:+1234567890");
			expect(result).toContain("TEL;TYPE=WORK:+0987654321");
			expect(result).toContain("EMAIL;TYPE=WORK:jane@acme.com");
			expect(result).toContain("EMAIL;TYPE=HOME:jane@home.com");
			expect(result).toContain("URL:https://acme.com");
			expect(result).toContain("ADR;TYPE=HOME:");
			expect(result).toContain("NOTE:Met at conference 2026");
		});

		it("should start with BEGIN:VCARD and end with END:VCARD", () => {
			const result = buildVCardString({
				firstName: "Test",
			});

			expect(result.startsWith("BEGIN:VCARD")).toBe(true);
			expect(result.endsWith("END:VCARD")).toBe(true);
		});

		it("should not include empty optional fields", () => {
			const result = buildVCardString({
				firstName: "John",
			});

			expect(result).not.toContain("ORG:");
			expect(result).not.toContain("TITLE:");
			expect(result).not.toContain("TEL;");
			expect(result).not.toContain("EMAIL;");
			expect(result).not.toContain("URL:");
			expect(result).not.toContain("ADR;");
			expect(result).not.toContain("NOTE:");
		});
	});

	describe("edge cases", () => {
		it("should handle Unicode characters in name", () => {
			const result = buildVCardString({
				firstName: "José",
				lastName: "García",
			});

			expect(result).toContain("N:García;José;;;");
			expect(result).toContain("FN:José García");
		});

		it("should handle very long note", () => {
			const longNote = "A".repeat(500);
			const result = buildVCardString({
				firstName: "John",
				note: longNote,
			});

			expect(result).toContain(`NOTE:${longNote}`);
		});

		it("should handle emoji in note", () => {
			const result = buildVCardString({
				firstName: "John",
				note: "Great person! 👍",
			});

			expect(result).toContain("NOTE:Great person! 👍");
		});
	});

	describe("constant values", () => {
		it("VCARD_VERSION should have correct values", () => {
			expect(VCARD_VERSION.V3).toBe("3.0");
			expect(VCARD_VERSION.V4).toBe("4.0");
		});

		it("PHONE_TYPE should have all expected values", () => {
			expect(PHONE_TYPE.CELL).toBe("CELL");
			expect(PHONE_TYPE.WORK).toBe("WORK");
			expect(PHONE_TYPE.HOME).toBe("HOME");
			expect(PHONE_TYPE.FAX).toBe("FAX");
			expect(PHONE_TYPE.PAGER).toBe("PAGER");
		});

		it("EMAIL_TYPE should have all expected values", () => {
			expect(EMAIL_TYPE.WORK).toBe("WORK");
			expect(EMAIL_TYPE.HOME).toBe("HOME");
			expect(EMAIL_TYPE.INTERNET).toBe("INTERNET");
		});
	});

	describe("VCardError", () => {
		it("should have correct name", () => {
			const error = new VCardError(VCARD_ERROR_CODE.EMPTY_NAME, "test");
			expect(error.name).toBe("VCardError");
		});

		it("should have correct code", () => {
			const error = new VCardError(VCARD_ERROR_CODE.INVALID_EMAIL, "test");
			expect(error.code).toBe("INVALID_EMAIL");
		});

		it("should have correct message", () => {
			const error = new VCardError(
				VCARD_ERROR_CODE.EMPTY_NAME,
				"Custom message",
			);
			expect(error.message).toBe("Custom message");
		});

		it("should be an instance of Error", () => {
			const error = new VCardError(VCARD_ERROR_CODE.EMPTY_NAME, "test");
			expect(error).toBeInstanceOf(Error);
		});
	});
});
