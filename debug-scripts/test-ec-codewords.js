// test-ec-codewords.js - Verificar los codewords de corrección de errores
const { ReedSolomon } = require("../dist/correction/ReedSolomon.js");
const {
	BLOCK_CONFIG,
	ECC_CODEWORDS_PER_BLOCK,
} = require("../dist/constants/index.js");

// Data codewords para "01234567" V1-M (ya verificados como correctos)
const dataCodewords = [
	0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec,
	0x11, 0xec, 0x11,
];

console.log('=== Verificación de EC codewords para "01234567" V1-M ===\n');

const version = 1;
const errorLevel = "M";

// Obtener config para V1-M
const levelIndex = { L: 0, M: 1, Q: 2, H: 3 }[errorLevel];
const eccCodewords = ECC_CODEWORDS_PER_BLOCK[version - 1][errorLevel];
const blockConfig = BLOCK_CONFIG[version - 1][errorLevel];
const [g1Blocks, g1DataCw, g2Blocks, g2DataCw] = blockConfig;

console.log("Configuración V1-M:");
console.log("  EC codewords por bloque:", eccCodewords);
console.log("  Block config:", blockConfig);
console.log(
	"  Grupo 1: " + g1Blocks + " bloques de " + g1DataCw + " data codewords",
);
console.log(
	"  Grupo 2: " + g2Blocks + " bloques de " + g2DataCw + " data codewords",
);

// Generar EC
const rsEncoder = new ReedSolomon(eccCodewords);
const eccResult = rsEncoder.encode(dataCodewords);

console.log("\nData codewords (16):");
console.log(
	"  " +
		dataCodewords
			.map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
			.join(" "),
);

console.log("\nEC codewords generados (" + eccCodewords + "):");
console.log(
	"  " +
		eccResult
			.map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
			.join(" "),
);

// Valores esperados para "01234567" V1-M según thonky.com
// Los EC codewords esperados son: A5 24 D4 C1 ED 36 C7 87 2C 55
const expectedEC = [0xa5, 0x24, 0xd4, 0xc1, 0xed, 0x36, 0xc7, 0x87, 0x2c, 0x55];
console.log("\nEC codewords esperados:");
console.log(
	"  " +
		expectedEC
			.map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
			.join(" "),
);

// Comparar
console.log("\nComparación:");
let allMatch = true;
for (let i = 0; i < Math.max(eccResult.length, expectedEC.length); i++) {
	const gen = eccResult[i];
	const exp = expectedEC[i];
	const match = gen === exp;
	if (!match) allMatch = false;
	const genHex =
		gen !== undefined ? gen.toString(16).toUpperCase().padStart(2, "0") : "N/A";
	const expHex =
		exp !== undefined ? exp.toString(16).toUpperCase().padStart(2, "0") : "N/A";
	console.log(
		"  EC " +
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

// Mostrar secuencia final intercalada
console.log("\n=== Secuencia final (Data + EC) ===");
const finalSequence = [...dataCodewords, ...eccResult];
console.log("Total codewords:", finalSequence.length);
console.log(
	"Hex: " +
		finalSequence
			.map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
			.join(" "),
);
