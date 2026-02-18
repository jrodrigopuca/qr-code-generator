// compare-raw-data.js - Compare data BEFORE masking
const { FinderPattern } = require("../dist/patterns/FinderPattern.js");
const { TimingPattern } = require("../dist/patterns/TimingPattern.js");
const { AlignmentPattern } = require("../dist/patterns/AlignmentPattern.js");
const { FormatInfo } = require("../dist/patterns/FormatInfo.js");
const { MaskEvaluator } = require("../dist/mask/MaskEvaluator.js");
const qrgen = require("qrcode-generator");

const size = 21;
const version = 1;
const text = "01234567";

// === NUESTRA IMPLEMENTACIÓN ===
const matrix = Array.from({ length: size }, () => Array(size).fill(0));
const reserved = Array.from({ length: size }, () => Array(size).fill(0));

FinderPattern.draw(matrix, reserved);
TimingPattern.draw(matrix, reserved);
AlignmentPattern.draw(matrix, reserved, version);
FormatInfo.reserveFormatArea(reserved, size);

// Codewords para "01234567" V1-M
const codewords = [
	0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec,
	0x11, 0xec, 0x11, 0xa5, 0x24, 0xd4, 0xc1, 0xed, 0x36, 0xc7, 0x87, 0x2c, 0x55,
];

const bits = [];
for (const cw of codewords) {
	for (let i = 7; i >= 0; i--) {
		bits.push((cw >> i) & 1);
	}
}

// Zigzag placement
let bitIndex = 0;
let right = size - 1;

while (right >= 0 && bitIndex < bits.length) {
	if (right === 6) {
		right--;
		continue;
	}

	const directionIndex = Math.floor((size - 1 - right) / 2);
	const goingUp = directionIndex % 2 === 0;

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

// === QRCODE-GENERATOR ===
// Necesitamos obtener los datos SIN máscara de qrcode-generator
// La máscara es XOR, así que podemos revertirla

const qr = qrgen(1, "M");
qr.addData(text);
qr.make();

// Obtener máscara usada por qrcode-generator (es 6)
const qrgenMask = 6;

// Copiar la matriz de qrcode-generator
const qrgenMatrix = Array.from({ length: size }, (_, r) =>
	Array.from({ length: size }, (_, c) => (qr.isDark(r, c) ? 1 : 0)),
);

// Crear matriz de áreas reservadas para qrgen
const qrgenReserved = Array.from({ length: size }, () => Array(size).fill(0));
FinderPattern.draw(
	Array.from({ length: size }, () => Array(size).fill(0)),
	qrgenReserved,
);
TimingPattern.draw(
	Array.from({ length: size }, () => Array(size).fill(0)),
	qrgenReserved,
);
AlignmentPattern.draw(
	Array.from({ length: size }, () => Array(size).fill(0)),
	qrgenReserved,
	version,
);
FormatInfo.reserveFormatArea(qrgenReserved, size);

// Función de máscara 6: ((row * col) % 2 + (row * col) % 3) % 2 === 0
const mask6 = (row, col) => (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;

// Quitar la máscara de qrcode-generator para obtener datos crudos
const qrgenRaw = qrgenMatrix.map((row, r) =>
	row.map((val, c) => {
		if (qrgenReserved[r][c] === 0 && mask6(r, c)) {
			return val ^ 1; // Revertir máscara
		}
		return val;
	}),
);

console.log("=== Comparación de datos ANTES de máscara ===\n");

// Comparar solo áreas de datos (no reservadas)
let differences = 0;
const diffList = [];

for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		// Solo comparar datos, no áreas reservadas ni format info
		if (reserved[r][c] === 0) {
			if (matrix[r][c] !== qrgenRaw[r][c]) {
				differences++;
				if (diffList.length < 20) {
					diffList.push({
						row: r,
						col: c,
						ours: matrix[r][c],
						qrgen: qrgenRaw[r][c],
					});
				}
			}
		}
	}
}

console.log(`Diferencias en datos (sin máscara): ${differences}`);

if (differences > 0) {
	console.log("\nPrimeras diferencias:");
	for (const d of diffList) {
		console.log(`  [${d.row}][${d.col}]: nuestro=${d.ours}, qrgen=${d.qrgen}`);
	}

	// Mostrar algunas filas para comparar
	console.log("\n=== Filas de datos comparadas ===");
	for (let r = 9; r <= 14; r++) {
		let ourRow = "";
		let qrgenRow = "";
		let diffRow = "";
		for (let c = 0; c < size; c++) {
			if (reserved[r][c] === 0) {
				ourRow += matrix[r][c];
				qrgenRow += qrgenRaw[r][c];
				diffRow += matrix[r][c] === qrgenRaw[r][c] ? "." : "X";
			} else {
				ourRow += "-";
				qrgenRow += "-";
				diffRow += "-";
			}
		}
		console.log(`Row ${r.toString().padStart(2)}:`);
		console.log(`  Nuestro: ${ourRow}`);
		console.log(`  QRGen:   ${qrgenRow}`);
		console.log(`  Diff:    ${diffRow}`);
	}
} else {
	console.log("\n✓ Los datos (sin máscara) son IDÉNTICOS!");
	console.log(
		"El problema debe estar en otra parte (máscara, format info, etc.)",
	);
}

// También verificar los patrones de función
console.log("\n=== Verificación de patrones de función ===");
let funcDiffs = 0;
for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		if (reserved[r][c] !== 0) {
			// Skip format info area for this comparison
			if (
				(r === 8 && c <= 8) ||
				(c === 8 && r <= 8) ||
				(r === 8 && c >= size - 8) ||
				(c === 8 && r >= size - 7)
			) {
				continue;
			}
			if (matrix[r][c] !== qrgenRaw[r][c]) {
				funcDiffs++;
				if (funcDiffs <= 10) {
					console.log(
						`  Patrón diff [${r}][${c}]: nuestro=${matrix[r][c]}, qrgen=${qrgenRaw[r][c]}`,
					);
				}
			}
		}
	}
}
console.log(`Total diferencias en patrones de función: ${funcDiffs}`);
