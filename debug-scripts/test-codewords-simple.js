// test-codewords-simple.js
const { NumericEncoder } = require("../dist/encoder/NumericEncoder.js");

const text = "01234567";
console.log("=== Análisis de codificación para 01234567 ===\n");

console.log("Grupos numéricos esperados (manual):");
console.log("  012 = 12 → ", (12).toString(2).padStart(10, "0"));
console.log("  345 = 345 →", (345).toString(2).padStart(10, "0"));
console.log("  67 = 67 →  ", (67).toString(2).padStart(7, "0"));
console.log("");

const numEncoder = new NumericEncoder();
const encodedBits = numEncoder.encode(text);
console.log("NumericEncoder.encode():");
console.log("  Resultado:", encodedBits);
console.log("  Longitud:", encodedBits.length, "bits");

// Verificar cada grupo
console.log("\nVerificación de grupos:");
const g1 = (12).toString(2).padStart(10, "0");
const g2 = (345).toString(2).padStart(10, "0");
const g3 = (67).toString(2).padStart(7, "0");
const esperado = g1 + g2 + g3;
console.log("  Esperado:", esperado);
console.log("  Obtenido:", encodedBits);
console.log("  Coincide:", esperado === encodedBits ? "✓" : "✗");

// Construir bitstream completo V1-M manualmente
console.log("\n=== Construcción de bitstream completo V1-M ===");
const modeIndicator = "0001"; // numérico
const charCount = (8).toString(2).padStart(10, "0"); // 8 caracteres, 10 bits para V1
console.log("Mode indicator:", modeIndicator);
console.log("Char count:", charCount);
console.log("Data bits:", encodedBits);

let bitstream = modeIndicator + charCount + encodedBits;
console.log("\nBitstream parcial:", bitstream);
console.log("Longitud:", bitstream.length, "bits");

// Terminador: hasta 4 ceros
const totalDataBits = 16 * 8; // V1-M tiene 16 data codewords
const terminatorLen = Math.min(4, totalDataBits - bitstream.length);
bitstream += "0".repeat(terminatorLen);
console.log("Después del terminador:", bitstream.length, "bits");

// Padding a múltiplo de 8
while (bitstream.length % 8 !== 0) {
	bitstream += "0";
}
console.log("Después del padding a byte:", bitstream.length, "bits");

// Palabras de relleno
const padBytes = ["11101100", "00010001"]; // 236 y 17
let padIndex = 0;
while (bitstream.length < totalDataBits) {
	bitstream += padBytes[padIndex % 2];
	padIndex++;
}
console.log("Bitstream final:", bitstream.length, "bits");
console.log("Bitstream:", bitstream);

// Convertir a bytes
let bytes = [];
for (let i = 0; i < bitstream.length; i += 8) {
	bytes.push(parseInt(bitstream.slice(i, i + 8), 2));
}
console.log("\nData codewords generados:", bytes.join(", "));
console.log(
	"Hex generado:",
	bytes.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" "),
);
console.log("");
console.log("Esperado para 01234567 V1-M:");
console.log("Hex esperado: 10 20 0C 56 61 80 EC 11 EC 11 EC 11 EC 11 EC 11");

// Comparación
const expected = [
	0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec,
	0x11, 0xec, 0x11,
];
console.log("\nComparación byte a byte:");
let allMatch = true;
for (let i = 0; i < Math.max(bytes.length, expected.length); i++) {
	const gen = bytes[i];
	const exp = expected[i];
	const match = gen === exp;
	if (!match) allMatch = false;
	const genHex =
		gen !== undefined ? gen.toString(16).toUpperCase().padStart(2, "0") : "N/A";
	const expHex =
		exp !== undefined ? exp.toString(16).toUpperCase().padStart(2, "0") : "N/A";
	console.log(
		"  Byte " +
			i +
			": generado=" +
			genHex +
			" esperado=" +
			expHex +
			" " +
			(match ? "✓" : "✗"),
	);
}
console.log(allMatch ? "\n✓ Todos coinciden!" : "\n✗ HAY DIFERENCIAS");
