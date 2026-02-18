// trace-zigzag.js - Trace exactly which bit goes where
const { FinderPattern } = require("../dist/patterns/FinderPattern.js");
const { TimingPattern } = require("../dist/patterns/TimingPattern.js");
const { AlignmentPattern } = require("../dist/patterns/AlignmentPattern.js");
const { FormatInfo } = require("../dist/patterns/FormatInfo.js");
const qrgen = require("qrcode-generator");

const size = 21;
const version = 1;
const text = "01234567";

// Crear reserved para saber qué posiciones son datos
const reserved = Array.from({ length: size }, () => Array(size).fill(0));
FinderPattern.draw(
	Array.from({ length: size }, () => Array(size).fill(0)),
	reserved,
);
TimingPattern.draw(
	Array.from({ length: size }, () => Array(size).fill(0)),
	reserved,
);
AlignmentPattern.draw(
	Array.from({ length: size }, () => Array(size).fill(0)),
	reserved,
	version,
);
FormatInfo.reserveFormatArea(reserved, size);

// Codewords
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

console.log("=== Traza del algoritmo zigzag ===\n");
console.log("Total bits:", bits.length);
console.log("Primeros 32 bits:", bits.slice(0, 32).join(""));

// Trazar nuestro algoritmo
const positions = []; // Array de {row, col, bitIndex}
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

			positions.push({ row, col, bitIndex, bitValue: bits[bitIndex] });
			bitIndex++;
		}
	}

	right -= 2;
}

console.log("\nPosiciones de los primeros 32 bits:");
for (let i = 0; i < Math.min(32, positions.length); i++) {
	const p = positions[i];
	console.log(`  bit[${p.bitIndex}]=${p.bitValue} -> [${p.row}][${p.col}]`);
}

// Ahora obtener la matriz de qrcode-generator y aplicar reversa de máscara 6
const qr = qrgen(1, "M");
qr.addData(text);
qr.make();

const mask6 = (row, col) => (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;

// Crear matriz de datos crudos de qrgen (quitando máscara)
const qrgenRaw = [];
for (let r = 0; r < size; r++) {
	qrgenRaw[r] = [];
	for (let c = 0; c < size; c++) {
		let val = qr.isDark(r, c) ? 1 : 0;
		if (reserved[r][c] === 0 && mask6(r, c)) {
			val ^= 1; // Quitar máscara
		}
		qrgenRaw[r][c] = val;
	}
}

// Comparar las posiciones
console.log("\n=== Comparación de primeros 32 bits ===");
for (let i = 0; i < Math.min(32, positions.length); i++) {
	const p = positions[i];
	const ourValue = bits[p.bitIndex];
	const qrgenValue = qrgenRaw[p.row][p.col];
	const match = ourValue === qrgenValue ? "✓" : "✗";
	console.log(
		`  bit[${p.bitIndex}] @ [${p.row}][${p.col}]: nuestro=${ourValue}, qrgen=${qrgenValue} ${match}`,
	);
}

// Ver qué valores tiene qrgen en la esquina inferior derecha
console.log("\n=== qrgen datos en esquina inferior derecha ===");
for (let r = size - 5; r < size; r++) {
	let row = "";
	for (let c = size - 5; c < size; c++) {
		if (reserved[r][c] === 0) {
			row += qrgenRaw[r][c];
		} else {
			row += "-";
		}
	}
	console.log(`  Row ${r}: ${row}`);
}

console.log("\n=== Nuestros datos en esquina inferior derecha ===");
const ourMatrix = Array.from({ length: size }, () => Array(size).fill(-1));
for (const p of positions) {
	ourMatrix[p.row][p.col] = p.bitValue;
}
for (let r = size - 5; r < size; r++) {
	let row = "";
	for (let c = size - 5; c < size; c++) {
		if (reserved[r][c] === 0) {
			row += ourMatrix[r][c] === -1 ? "?" : ourMatrix[r][c];
		} else {
			row += "-";
		}
	}
	console.log(`  Row ${r}: ${row}`);
}

// Ver el primer desacuerdo
console.log("\n=== Primer desacuerdo exacto ===");
for (let i = 0; i < positions.length; i++) {
	const p = positions[i];
	const ourValue = bits[p.bitIndex];
	const qrgenValue = qrgenRaw[p.row][p.col];
	if (ourValue !== qrgenValue) {
		console.log(
			`Primer desacuerdo en bit[${p.bitIndex}] @ [${p.row}][${p.col}]`,
		);
		console.log(`  Nuestro valor: ${ourValue}`);
		console.log(`  qrgen valor: ${qrgenValue}`);
		console.log(
			`  Esto sugiere que qrgen pone un bit DIFERENTE en esta posición`,
		);
		break;
	}
}
