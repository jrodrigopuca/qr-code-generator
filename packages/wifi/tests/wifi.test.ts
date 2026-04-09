import { describe, expect, it } from "vitest";
import {
	buildWifiString,
	WIFI_ENCRYPTION,
	WIFI_ERROR_CODE,
	WifiError,
} from "../src";

describe("buildWifiString", () => {
	describe("basic functionality", () => {
		it("should generate WPA WiFi string with defaults", () => {
			const result = buildWifiString({
				ssid: "MyNetwork",
				password: "super-secret",
			});

			expect(result).toBe("WIFI:T:WPA;S:MyNetwork;P:super-secret;;");
		});

		it("should generate WPA WiFi string with explicit encryption", () => {
			const result = buildWifiString({
				ssid: "MyNetwork",
				password: "pass123",
				encryption: WIFI_ENCRYPTION.WPA,
			});

			expect(result).toBe("WIFI:T:WPA;S:MyNetwork;P:pass123;;");
		});

		it("should generate WEP WiFi string", () => {
			const result = buildWifiString({
				ssid: "OldRouter",
				password: "wepkey",
				encryption: WIFI_ENCRYPTION.WEP,
			});

			expect(result).toBe("WIFI:T:WEP;S:OldRouter;P:wepkey;;");
		});

		it("should generate open network string (no password)", () => {
			const result = buildWifiString({
				ssid: "FreeWiFi",
				encryption: WIFI_ENCRYPTION.NONE,
			});

			expect(result).toBe("WIFI:T:nopass;S:FreeWiFi;;");
		});

		it("should include hidden flag when true", () => {
			const result = buildWifiString({
				ssid: "HiddenNet",
				password: "secret",
				hidden: true,
			});

			expect(result).toBe("WIFI:T:WPA;S:HiddenNet;P:secret;H:true;;");
		});

		it("should omit hidden flag when false", () => {
			const result = buildWifiString({
				ssid: "VisibleNet",
				password: "pass",
				hidden: false,
			});

			expect(result).toBe("WIFI:T:WPA;S:VisibleNet;P:pass;;");
		});

		it("should omit hidden flag when not provided", () => {
			const result = buildWifiString({
				ssid: "DefaultNet",
				password: "pass",
			});

			expect(result).not.toContain("H:");
		});

		it("should omit password for open networks even if provided", () => {
			const result = buildWifiString({
				ssid: "OpenNet",
				password: "ignored",
				encryption: WIFI_ENCRYPTION.NONE,
			});

			expect(result).toBe("WIFI:T:nopass;S:OpenNet;;");
			expect(result).not.toContain("P:");
		});
	});

	describe("special character escaping", () => {
		it("should escape semicolons in SSID", () => {
			const result = buildWifiString({
				ssid: "My;Network",
				password: "pass",
			});

			expect(result).toBe("WIFI:T:WPA;S:My\\;Network;P:pass;;");
		});

		it("should escape colons in SSID", () => {
			const result = buildWifiString({
				ssid: "Net:work",
				password: "pass",
			});

			expect(result).toBe("WIFI:T:WPA;S:Net\\:work;P:pass;;");
		});

		it("should escape commas in SSID", () => {
			const result = buildWifiString({
				ssid: "Net,work",
				password: "pass",
			});

			expect(result).toBe("WIFI:T:WPA;S:Net\\,work;P:pass;;");
		});

		it("should escape double quotes in SSID", () => {
			const result = buildWifiString({
				ssid: 'My"Network',
				password: "pass",
			});

			expect(result).toBe('WIFI:T:WPA;S:My\\"Network;P:pass;;');
		});

		it("should escape backslashes in SSID", () => {
			const result = buildWifiString({
				ssid: "My\\Network",
				password: "pass",
			});

			expect(result).toBe("WIFI:T:WPA;S:My\\\\Network;P:pass;;");
		});

		it("should escape special characters in password", () => {
			const result = buildWifiString({
				ssid: "Net",
				password: "p;a:s,s",
			});

			expect(result).toBe("WIFI:T:WPA;S:Net;P:p\\;a\\:s\\,s;;");
		});

		it("should handle multiple special characters in both fields", () => {
			const result = buildWifiString({
				ssid: "A;B:C",
				password: "D;E:F",
			});

			expect(result).toBe("WIFI:T:WPA;S:A\\;B\\:C;P:D\\;E\\:F;;");
		});
	});

	describe("validation", () => {
		it("should throw EMPTY_SSID for empty SSID", () => {
			expect(() => buildWifiString({ ssid: "", password: "pass" })).toThrow(
				WifiError,
			);

			try {
				buildWifiString({ ssid: "", password: "pass" });
			} catch (error) {
				expect(error).toBeInstanceOf(WifiError);
				expect((error as WifiError).code).toBe(WIFI_ERROR_CODE.EMPTY_SSID);
			}
		});

		it("should throw EMPTY_SSID for whitespace-only SSID", () => {
			expect(() => buildWifiString({ ssid: "   ", password: "pass" })).toThrow(
				WifiError,
			);
		});

		it("should throw PASSWORD_REQUIRED for WPA without password", () => {
			expect(() => buildWifiString({ ssid: "Net" })).toThrow(WifiError);

			try {
				buildWifiString({ ssid: "Net" });
			} catch (error) {
				expect((error as WifiError).code).toBe(
					WIFI_ERROR_CODE.PASSWORD_REQUIRED,
				);
			}
		});

		it("should throw PASSWORD_REQUIRED for WEP without password", () => {
			expect(() =>
				buildWifiString({
					ssid: "Net",
					encryption: WIFI_ENCRYPTION.WEP,
				}),
			).toThrow(WifiError);
		});

		it("should throw PASSWORD_REQUIRED for empty password with WPA", () => {
			expect(() => buildWifiString({ ssid: "Net", password: "" })).toThrow(
				WifiError,
			);
		});

		it("should NOT throw for open network without password", () => {
			expect(() =>
				buildWifiString({
					ssid: "FreeNet",
					encryption: WIFI_ENCRYPTION.NONE,
				}),
			).not.toThrow();
		});
	});

	describe("edge cases", () => {
		it("should handle very long SSID", () => {
			const longSsid = "A".repeat(100);
			const result = buildWifiString({
				ssid: longSsid,
				password: "pass",
			});

			expect(result).toContain(`S:${longSsid}`);
		});

		it("should handle Unicode characters in SSID", () => {
			const result = buildWifiString({
				ssid: "Café☕",
				password: "pass",
			});

			expect(result).toBe("WIFI:T:WPA;S:Café☕;P:pass;;");
		});

		it("should handle Unicode characters in password", () => {
			const result = buildWifiString({
				ssid: "Net",
				password: "contraseña🔑",
			});

			expect(result).toBe("WIFI:T:WPA;S:Net;P:contraseña🔑;;");
		});

		it("should handle all options together", () => {
			const result = buildWifiString({
				ssid: "My;Net",
				password: "p:ass",
				encryption: WIFI_ENCRYPTION.WPA,
				hidden: true,
			});

			expect(result).toBe("WIFI:T:WPA;S:My\\;Net;P:p\\:ass;H:true;;");
		});
	});

	describe("WIFI_ENCRYPTION constants", () => {
		it("should have WPA value", () => {
			expect(WIFI_ENCRYPTION.WPA).toBe("WPA");
		});

		it("should have WEP value", () => {
			expect(WIFI_ENCRYPTION.WEP).toBe("WEP");
		});

		it("should have NONE value", () => {
			expect(WIFI_ENCRYPTION.NONE).toBe("nopass");
		});
	});

	describe("WifiError", () => {
		it("should have correct name", () => {
			const error = new WifiError(WIFI_ERROR_CODE.EMPTY_SSID, "test");
			expect(error.name).toBe("WifiError");
		});

		it("should have correct code", () => {
			const error = new WifiError(WIFI_ERROR_CODE.PASSWORD_REQUIRED, "test");
			expect(error.code).toBe("PASSWORD_REQUIRED");
		});

		it("should have correct message", () => {
			const error = new WifiError(WIFI_ERROR_CODE.EMPTY_SSID, "Custom message");
			expect(error.message).toBe("Custom message");
		});

		it("should be an instance of Error", () => {
			const error = new WifiError(WIFI_ERROR_CODE.EMPTY_SSID, "test");
			expect(error).toBeInstanceOf(Error);
		});
	});
});
