// extract-qrgen-codewords.js - Extract actual codewords from qrcode-generator
const qrgen = require("qrcode-generator");
const { FinderPattern } = require("../dist/patterns/FinderPattern.js");
const { TimingPattern } = require("../dist/patterns/TimingPattern.js");
const { AlignmentPattern } = require("../dist/patterns/AlignmentPattern.js");
const { FormatInfo } = require("../dist/patterns/FormatInfo.js");

const size = 21;
const version = 1;
const text = "01234567";

// Crear reserved
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

// Obtener qrcode-generator
const qr = qrgen(1, "M");
qr.addData(text);
qr.make();

// Máscara 6 para revertir
const mask6 = (row, col) => (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;

// Extraer datos crudos (sin máscara) de qrcode-generator
const qrgenRaw = [];
for (let r = 0; r < size; r++) {
	qrgenRaw[r] = [];
	for (let c = 0; c < size; c++) {
		let val = qr.isDark(r, c) ? 1 : 0;
		if (reserved[r][c] === 0 && mask6(r, c)) {
			val ^= 1;
		}
		qrgenRaw[r][c] = val;
	}
}

// Recorrer en orden zigzag para extraer los bits
const extractedBits = [];
let right = size - 1;

while (right >= 0) {
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

			extractedBits.push(qrgenRaw[row][col]);
		}
	}

	right -= 2;
}

console.log("=== Codewords extraídos de qrcode-generator ===\n");
console.log("Total bits extraídos:", extractedBits.length);
console.log("Primeros 64 bits:", extractedBits.slice(0, 64).join(""));

// Convertir a codewords
const extractedCodewords = [];
for (let i = 0; i < extractedBits.length; i += 8) {
	let cw = 0;
	for (let j = 0; j < 8 && i + j < extractedBits.length; j++) {
		cw = (cw << 1) | extractedBits[i + j];
	}
	extractedCodewords.push(cw);
}

console.log("\nCodewords extraídos (hex):");
console.log(
	extractedCodewords
		.map((c) => c.toString(16).toUpperCase().padStart(2, "0"))
		.join(" "),
);

// Nuestros codewords esperados
const ourCodewords = [
	0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec,
	0x11, 0xec, 0x11, 0xa5, 0x24, 0xd4, 0xc1, 0xed, 0x36, 0xc7, 0x87, 0x2c, 0x55,
];

console.log("\nNuestros codewords esperados (hex):");
console.log(
	ourCodewords
		.map((c) => c.toString(16).toUpperCase().padStart(2, "0"))
		.join(" "),
);

// Comparar
console.log("\n=== Comparación byte por byte ===");
const minLen = Math.min(extractedCodewords.length, ourCodewords.length);
let firstDiff = -1;
for (let i = 0; i < minLen; i++) {
	const match = extractedCodewords[i] === ourCodewords[i];
	if (!match && firstDiff === -1) firstDiff = i;
	console.log(
		`  Byte ${i}: qrgen=0x${extractedCodewords[i].toString(16).toUpperCase().padStart(2, "0")}, ` +
			`nuestro=0x${ourCodewords[i].toString(16).toUpperCase().padStart(2, "0")} ${match ? "✓" : "✗"}`,
	);
}

if (firstDiff >= 0) {
	console.log(`\nPrimer byte diferente: ${firstDiff}`);
	console.log(
		`  qrgen: 0x${extractedCodewords[firstDiff].toString(16).toUpperCase().padStart(2, "0")} = ${extractedCodewords[firstDiff].toString(2).padStart(8, "0")}`,
	);
	console.log(
		`  nuestro: 0x${ourCodewords[firstDiff].toString(16).toUpperCase().padStart(2, "0")} = ${ourCodewords[firstDiff].toString(2).padStart(8, "0")}`,
	);
} else {
	console.log("\n✓ Todos los codewords coinciden!");
}
