/**
 * Script para depurar la generación de codewords
 * Compara con valores conocidos de "01234567" EC=M
 */

import { NumericEncoder } from "../src/encoder/NumericEncoder";
import { DataEncoder } from "../src/encoder/DataEncoder";

const text = "01234567";

console.log("=== Análisis de codificación para '01234567' ===\n");

// 1. Codificación numérica manual paso a paso
console.log("1. Codificación numérica manual:");
console.log("   - Grupo '012' = 12 → " + (12).toString(2).padStart(10, "0"));
console.log("   - Grupo '345' = 345 → " + (345).toString(2).padStart(10, "0"));
console.log("   - Grupo '67' = 67 → " + (67).toString(2).padStart(7, "0"));

const numericEncoder = new NumericEncoder();
const encodedData = numericEncoder.encode(text);
console.log("\n   NumericEncoder.encode() = " + encodedData);
console.log("   Longitud: " + encodedData.length + " bits");

// 2. Segmento completo con indicador de modo y longitud
console.log("\n2. Segmento completo (Versión 1, EC=M):");
console.log("   - Mode indicator: 0001 (numérico)");
console.log(
	"   - Character count (10 bits): " + (8).toString(2).padStart(10, "0"),
);
console.log("   - Data: " + encodedData);

const fullSegment = numericEncoder.encodeSegment(text, 1);
console.log("   - Segment completo: " + fullSegment);
console.log("   - Longitud: " + fullSegment.length + " bits");

// 3. DataEncoder con padding
console.log("\n3. DataEncoder completo:");
const dataEncoder = new DataEncoder();
const result = dataEncoder.encode(text, 1, "M");
console.log("   - Bitstream total: " + result.bitstream);
console.log("   - Longitud: " + result.bitstream.length + " bits");

// Convertir a bytes
console.log("\n4. Codewords de datos:");
const dataBits = result.bitstream;
const dataCodewords: number[] = [];
for (let i = 0; i < dataBits.length; i += 8) {
	const byte = dataBits.slice(i, i + 8);
	dataCodewords.push(parseInt(byte, 2));
}
console.log("   Bytes: [" + dataCodewords.join(", ") + "]");
console.log(
	"   Hex: " +
		dataCodewords
			.map((b) => b.toString(16).padStart(2, "0").toUpperCase())
			.join(" "),
);

// 5. Valores esperados según thonky.com para "01234567" V1-M
console.log("\n5. Valores esperados (según especificación):");
console.log("   Para '01234567' V1-M, los data codewords esperados son:");
console.log("   Hex: 10 20 0C 56 61 80 EC 11 EC 11 EC 11 EC 11 EC 11");
console.log(
	"   Bytes: [16, 32, 12, 86, 97, 128, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17]",
);

// Comparación
const expected = [
	16, 32, 12, 86, 97, 128, 236, 17, 236, 17, 236, 17, 236, 17, 236, 17,
];
console.log("\n6. Comparación:");
console.log("   Generados: " + dataCodewords.join(", "));
console.log(
	"   Esperados: " + expected.slice(0, dataCodewords.length).join(", "),
);

let match = true;
for (let i = 0; i < Math.max(dataCodewords.length, expected.length); i++) {
	if (dataCodewords[i] !== expected[i]) {
		console.log(
			`   DIFERENCIA en byte ${i}: generado=${dataCodewords[i]}, esperado=${expected[i]}`,
		);
		match = false;
	}
}
if (match) {
	console.log("   ✓ Los data codewords coinciden!");
}

// Mostrar desglose bit a bit
console.log("\n7. Desglose bit a bit del bitstream:");
let pos = 0;
console.log(`   Mode indicator (4 bits): ${dataBits.slice(pos, pos + 4)}`);
pos += 4;
console.log(`   Char count (10 bits):    ${dataBits.slice(pos, pos + 10)}`);
pos += 10;
console.log(`   Grupo '012' (10 bits):   ${dataBits.slice(pos, pos + 10)}`);
pos += 10;
console.log(`   Grupo '345' (10 bits):   ${dataBits.slice(pos, pos + 10)}`);
pos += 10;
console.log(`   Grupo '67' (7 bits):     ${dataBits.slice(pos, pos + 7)}`);
pos += 7;
console.log(`   Terminador (4 bits):     ${dataBits.slice(pos, pos + 4)}`);
pos += 4;
console.log(`   Padding bits:            ${dataBits.slice(pos)}`);
