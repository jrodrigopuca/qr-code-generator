// test-full-trace.js - Traza completa de la generación del QR
// Compara cada paso con valores esperados

const { QRCode } = require("../dist/QRCode.js");
const { NumericEncoder } = require("../dist/encoder/NumericEncoder.js");
const { ReedSolomon } = require("../dist/correction/ReedSolomon.js");
const { MaskEvaluator } = require("../dist/mask/MaskEvaluator.js");
const {
	BLOCK_CONFIG,
	ECC_CODEWORDS_PER_BLOCK,
	REMAINDER_BITS,
} = require("../dist/constants/index.js");

console.log('=== TRAZA COMPLETA: "01234567" V1-M Máscara 2 ===\n');

// Paso 1: Codificación de datos
console.log("PASO 1: Codificación de datos");
const text = "01234567";
const dataCodewords = [
	0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec,
	0x11, 0xec, 0x11,
];
console.log(
	"Data codewords:",
	dataCodewords
		.map((x) => x.toString(16).toUpperCase().padStart(2, "0"))
		.join(" "),
);

// Paso 2: EC codewords
console.log("\nPASO 2: EC Codewords");
const rsEncoder = new ReedSolomon(10);
const ecCodewords = rsEncoder.encode(dataCodewords);
console.log(
	"EC codewords:",
	ecCodewords
		.map((x) => x.toString(16).toUpperCase().padStart(2, "0"))
		.join(" "),
);

// Paso 3: Secuencia final
console.log("\nPASO 3: Secuencia final (Data + EC)");
const allCodewords = [...dataCodewords, ...ecCodewords];
console.log("Total:", allCodewords.length, "codewords");
console.log(
	"Hex:",
	allCodewords
		.map((x) => x.toString(16).toUpperCase().padStart(2, "0"))
		.join(" "),
);

// Convertir a bits
const bits = [];
for (const cw of allCodewords) {
	for (let i = 7; i >= 0; i--) {
		bits.push((cw >> i) & 1);
	}
}
// Añadir remainder bits (0 para V1)
const remainder = REMAINDER_BITS[0];
for (let i = 0; i < remainder; i++) {
	bits.push(0);
}
console.log("Total bits:", bits.length);
console.log("Primeros 32 bits:", bits.slice(0, 32).join(""));

// Paso 4: Colocación de datos (SIN máscara)
console.log("\nPASO 4: Colocación sin máscara");
const size = 21;
const matrix = Array.from({ length: size }, () => Array(size).fill(0));
const reserved = Array.from({ length: size }, () => Array(size).fill(0));

// Colocar patrones de función y reservar áreas
// Finder patterns + separators
for (let r = 0; r < 9; r++) {
	for (let c = 0; c < 9; c++) reserved[r][c] = 1;
}
for (let r = 0; r < 9; r++) {
	for (let c = size - 8; c < size; c++) reserved[r][c] = 1;
}
for (let r = size - 8; r < size; r++) {
	for (let c = 0; c < 9; c++) reserved[r][c] = 1;
}
// Timing patterns row and column 6
for (let i = 0; i < size; i++) {
	reserved[6][i] = 1;
	reserved[i][6] = 1;
}

// Contar posiciones disponibles para datos
let availablePositions = 0;
for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		if (reserved[r][c] === 0) availablePositions++;
	}
}
console.log("Posiciones disponibles para datos:", availablePositions);

// Colocar bits usando el algoritmo zigzag
let bitIndex = 0;
let right = size - 1;

while (right >= 0 && bitIndex < bits.length) {
	if (right === 6) {
		right--;
		continue;
	}

	const goingUp = Math.floor((size - 1 - right) / 2) % 2 === 0;

	for (let vert = 0; vert < size; vert++) {
		const row = goingUp ? size - 1 - vert : vert;

		for (let horz = 0; horz < 2; horz++) {
			const col = right - horz;

			if (col < 0) continue;
			if (reserved[row][col] !== 0) continue;
			if (bitIndex >= bits.length) continue;

			matrix[row][col] = bits[bitIndex];
			bitIndex++;
		}
	}

	right -= 2;
}

console.log("Bits colocados:", bitIndex);

// Mostrar primeros valores colocados
console.log("\nValores en posiciones clave (sin máscara):");
console.log("  [20][20]=", matrix[20][20], "  esperado: bit 0 =", bits[0]);
console.log("  [20][19]=", matrix[20][19], "  esperado: bit 1 =", bits[1]);
console.log("  [19][20]=", matrix[19][20], "  esperado: bit 2 =", bits[2]);
console.log("  [19][19]=", matrix[19][19], "  esperado: bit 3 =", bits[3]);

// Paso 5: Aplicar máscara 2
console.log("\nPASO 5: Aplicar máscara 2 (col % 3 === 0)");
const matrixMasked = matrix.map((row) => [...row]);

const mask2 = (row, col) => col % 3 === 0;

for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		if (reserved[r][c] === 0 && mask2(r, c)) {
			matrixMasked[r][c] ^= 1;
		}
	}
}

console.log("\nValores después de máscara 2:");
console.log(
	"  [20][20]=",
	matrixMasked[20][20],
	"  (col 20 % 3 =",
	20 % 3,
	", invertir:",
	mask2(20, 20),
	")",
);
console.log(
	"  [20][19]=",
	matrixMasked[20][19],
	"  (col 19 % 3 =",
	19 % 3,
	", invertir:",
	mask2(20, 19),
	")",
);
console.log(
	"  [20][18]=",
	matrixMasked[20][18],
	"  (col 18 % 3 =",
	18 % 3,
	", invertir:",
	mask2(20, 18),
	")",
);

// Comparar con referencia
const REFERENCE = [
	[1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
	[1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1],
	[0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0],
	[1, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1],
	[1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0],
	[0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
	[1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1],
	[0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
	[1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
	[1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0],
	[1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1],
	[1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
	[1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1],
	[1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1],
];

console.log("\nComparación con referencia en área de datos:");
console.log("Nota: Solo comparamos donde reserved=0 (área de datos)\n");

// Verificar algunas posiciones específicas
const testPositions = [
	[20, 20],
	[20, 19],
	[20, 18],
	[19, 20],
	[19, 19],
	[19, 18],
	[9, 9],
	[9, 10],
	[9, 11],
];

for (const [r, c] of testPositions) {
	if (reserved[r][c] === 0) {
		const gen = matrixMasked[r][c];
		const ref = REFERENCE[r][c];
		const match = gen === ref;
		console.log(
			`  [${r}][${c}]: generado=${gen} referencia=${ref} ${match ? "✓" : "✗"}`,
		);
	}
}

// Contar diferencias en área de datos
let diffCount = 0;
for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		if (reserved[r][c] === 0) {
			if (matrixMasked[r][c] !== REFERENCE[r][c]) {
				diffCount++;
			}
		}
	}
}
console.log("\nDiferencias totales en área de datos:", diffCount);
