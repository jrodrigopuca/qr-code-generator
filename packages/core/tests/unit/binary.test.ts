/**
 * @fileoverview Tests unitarios para utils/binary
 */

import { describe, it, expect } from "vitest";
import { toBinary, fromBinary, chunkString } from "../../src/utils/binary";

describe("toBinary()", () => {
	it("convierte cero a cadena de ceros", () => {
		expect(toBinary(0, 4)).toBe("0000");
	});

	it("convierte 5 a binario con padding de 8 bits", () => {
		expect(toBinary(5, 8)).toBe("00000101");
	});

	it("convierte 255 a binario de 8 bits (todos unos)", () => {
		expect(toBinary(255, 8)).toBe("11111111");
	});

	it("convierte 1 a binario con padding de 4 bits", () => {
		expect(toBinary(1, 4)).toBe("0001");
	});

	it("convierte un número que ya ocupa exactamente `length` bits", () => {
		expect(toBinary(15, 4)).toBe("1111");
	});

	it("añade padding cuando el número ocupa menos bits que `length`", () => {
		expect(toBinary(1, 8)).toBe("00000001");
	});

	it("respeta length mayor al necesario (más padding)", () => {
		expect(toBinary(3, 10)).toBe("0000000011");
	});

	it("lanza RangeError con valor negativo", () => {
		expect(() => toBinary(-1, 8)).toThrow(RangeError);
	});

	it("el mensaje del RangeError es descriptivo", () => {
		expect(() => toBinary(-5, 8)).toThrow("Value must be non-negative");
	});

	it("funciona con números grandes (modo indicator 1111 en 4 bits)", () => {
		expect(toBinary(0b1111, 4)).toBe("1111");
	});
});

describe("fromBinary()", () => {
	it("convierte '00000101' a 5", () => {
		expect(fromBinary("00000101")).toBe(5);
	});

	it("convierte '11111111' a 255", () => {
		expect(fromBinary("11111111")).toBe(255);
	});

	it("convierte '0000' a 0", () => {
		expect(fromBinary("0000")).toBe(0);
	});

	it("convierte '1' a 1", () => {
		expect(fromBinary("1")).toBe(1);
	});

	it("convierte '10000000' a 128", () => {
		expect(fromBinary("10000000")).toBe(128);
	});

	it("es el inverso de toBinary", () => {
		const original = 42;
		expect(fromBinary(toBinary(original, 8))).toBe(original);
	});

	it("ignora padding de ceros a la izquierda", () => {
		expect(fromBinary("00001010")).toBe(fromBinary("1010"));
	});
});

describe("chunkString()", () => {
	it("divide cadena en grupos de tamaño exacto", () => {
		expect(chunkString("12345678", 2)).toEqual(["12", "34", "56", "78"]);
	});

	it("divide cadena en grupos de 3", () => {
		expect(chunkString("123456789", 3)).toEqual(["123", "456", "789"]);
	});

	it("retorna la cadena completa si size >= length", () => {
		expect(chunkString("abc", 3)).toEqual(["abc"]);
	});

	it("retorna la cadena completa si size > length", () => {
		expect(chunkString("ab", 5)).toEqual(["ab"]);
	});

	it("retorna array vacío con cadena vacía", () => {
		expect(chunkString("", 4)).toEqual([]);
	});

	it("maneja el último chunk más pequeño que size", () => {
		expect(chunkString("12345", 2)).toEqual(["12", "34", "5"]);
	});

	it("funciona con size=1 (un char por chunk)", () => {
		expect(chunkString("abc", 1)).toEqual(["a", "b", "c"]);
	});

	it("divide cadena binaria de 8 bits en nibbles de 4", () => {
		expect(chunkString("10110010", 4)).toEqual(["1011", "0010"]);
	});
});
