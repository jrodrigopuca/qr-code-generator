// debug-mask-penalties.js - Compare mask penalty calculations
const { FinderPattern } = require("../dist/patterns/FinderPattern.js");
const { TimingPattern } = require("../dist/patterns/TimingPattern.js");
const { AlignmentPattern } = require("../dist/patterns/AlignmentPattern.js");
const { FormatInfo } = require("../dist/patterns/FormatInfo.js");
const { MaskEvaluator } = require("../dist/mask/MaskEvaluator.js");
const { REMAINDER_BITS } = require("../dist/constants/index.js");
const qrgen = require("qrcode-generator");

const size = 21;
const version = 1;
const text = "01234567";

// Crear matrices
const matrix = Array.from({ length: size }, () => Array(size).fill(0));
const reserved = Array.from({ length: size }, () => Array(size).fill(0));

// Colocar patrones de función
FinderPattern.draw(matrix, reserved);
TimingPattern.draw(matrix, reserved);
AlignmentPattern.draw(matrix, reserved, version);
FormatInfo.reserveFormatArea(reserved, size);

// Codewords exactos para "01234567" V1-M
const codewords = [
	0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec,
	0x11, 0xec, 0x11, 0xa5, 0x24, 0xd4, 0xc1, 0xed, 0x36, 0xc7, 0x87, 0x2c, 0x55,
];

// Convertir a bits
const bits = [];
for (const cw of codewords) {
	for (let i = 7; i >= 0; i--) {
		bits.push((cw >> i) & 1);
	}
}

// Colocar datos (algoritmo zigzag)
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

console.log("=== Evaluación de penalidades por máscara ===\n");
console.log("Bits colocados:", bitIndex);

// Evaluar cada máscara
const penalties = [];
for (let mask = 0; mask < 8; mask++) {
	// Copiar matriz
	const testMatrix = matrix.map((row) => [...row]);

	// Aplicar máscara
	MaskEvaluator.apply(testMatrix, reserved, mask);

	// Calcular penalidad
	const penalty = MaskEvaluator.calculatePenalty(testMatrix);
	penalties.push({ mask, penalty });

	console.log(`Máscara ${mask}: penalidad = ${penalty}`);
}

// Ordenar por penalidad
penalties.sort((a, b) => a.penalty - b.penalty);

console.log("\n=== Ranking de máscaras ===");
for (const p of penalties) {
	console.log(
		`  ${p.mask}: ${p.penalty}${p.mask === penalties[0].mask ? " <-- MEJOR" : ""}`,
	);
}

console.log("\n=== Comparación con qrcode-generator ===");

// qrcode-generator usa máscara 6 según el debug anterior
const qr = qrgen(1, "M");
qr.addData(text);
qr.make();

// Leer la máscara del format info
let formatBits = "";
for (let c = 0; c <= 5; c++) {
	formatBits += qr.isDark(8, c) ? "1" : "0";
}
formatBits += qr.isDark(8, 7) ? "1" : "0";
formatBits += qr.isDark(8, 8) ? "1" : "0";
formatBits += qr.isDark(7, 8) ? "1" : "0";
formatBits += qr.isDark(5, 8) ? "1" : "0";
formatBits += qr.isDark(4, 8) ? "1" : "0";
formatBits += qr.isDark(3, 8) ? "1" : "0";
formatBits += qr.isDark(2, 8) ? "1" : "0";
formatBits += qr.isDark(1, 8) ? "1" : "0";
formatBits += qr.isDark(0, 8) ? "1" : "0";

const FORMAT_MASK = "101010000010010";
let dataFormat = "";
for (let i = 0; i < 15; i++) {
	const bit1 = formatBits[i] === "1" ? 1 : 0;
	const mask = FORMAT_MASK[i] === "1" ? 1 : 0;
	dataFormat += (bit1 ^ mask).toString();
}
const qrgenMask = parseInt(dataFormat.substring(2, 5), 2);

console.log(`qrcode-generator usó: máscara ${qrgenMask}`);
console.log(`Nuestra mejor máscara: ${penalties[0].mask}`);

if (qrgenMask !== penalties[0].mask) {
	console.log("\n⚠️ DISCREPANCIA EN LA SELECCIÓN DE MÁSCARA");

	// Encontrar la posición de la máscara de qrgen en nuestro ranking
	const qrgenRank = penalties.findIndex((p) => p.mask === qrgenMask);
	console.log(
		`La máscara ${qrgenMask} está en posición ${qrgenRank + 1} en nuestro ranking`,
	);
	console.log(
		`Nuestra penalidad para máscara ${qrgenMask}: ${penalties[qrgenRank].penalty}`,
	);
	console.log(
		`Penalidad de nuestra mejor (${penalties[0].mask}): ${penalties[0].penalty}`,
	);
} else {
	console.log("\n✓ Ambos seleccionan la misma máscara");
}
