// verify-format-info.js - Verify format info is written correctly
const { FinderPattern } = require("../dist/patterns/FinderPattern.js");
const { TimingPattern } = require("../dist/patterns/TimingPattern.js");
const { AlignmentPattern } = require("../dist/patterns/AlignmentPattern.js");
const { FormatInfo } = require("../dist/patterns/FormatInfo.js");
const { MaskEvaluator } = require("../dist/mask/MaskEvaluator.js");
const qrgen = require("qrcode-generator");

const size = 21;
const version = 1;

console.log("=== Verificación de Format Info ===\n");

// Create our QR
const matrix = Array.from({ length: size }, () => Array(size).fill(0));
const reserved = Array.from({ length: size }, () => Array(size).fill(0));

FinderPattern.draw(matrix, reserved);
TimingPattern.draw(matrix, reserved);
AlignmentPattern.draw(matrix, reserved, version);
FormatInfo.reserveFormatArea(reserved, size);

// Use mask 0 for testing
const mask = 0;
const ecLevel = "M";

// Place some dummy data (just zeros for this test)
for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		if (reserved[r][c] === 0) {
			matrix[r][c] = 0;
		}
	}
}

// Apply mask
MaskEvaluator.apply(matrix, reserved, mask);

// Draw format info
FormatInfo.drawFormat(matrix, reserved, ecLevel, mask);

// Now read back the format info we wrote
console.log("=== Primera copia (alrededor del finder superior izquierdo) ===");

// First copy: Row 8 columns 0-5, then column 7, column 8
// Plus column 8 rows 7, 5-0
let format1 = "";
for (let c = 0; c <= 5; c++) {
	format1 += matrix[8][c];
}
format1 += matrix[8][7]; // skip 6 (timing)
format1 += matrix[8][8];
format1 += matrix[7][8]; // dark module area
for (let r = 5; r >= 0; r--) {
	format1 += matrix[r][8];
}

console.log("Leída: " + format1);

// What should it be for M level, mask 0?
// EC Level M = 00 (binary)
// Mask 0 = 000 (binary)
// Data = 00 000 = 0x00
// BCH + XOR with mask pattern = format info string
const FORMAT_INFO_M_MASK0 = "101010000010010";
console.log("Esperada: " + FORMAT_INFO_M_MASK0);
console.log("Coincide: " + (format1 === FORMAT_INFO_M_MASK0 ? "✓" : "✗"));

console.log("\n=== Segunda copia (inferior izquierda + superior derecha) ===");

// Second copy: Column 8 rows 20-14 (bottom-left finder)
// Then row 8 columns 13-20 (top-right finder)
let format2 = "";

// Column 8, rows from bottom to row 14
for (let r = size - 1; r >= size - 7; r--) {
	format2 += matrix[r][8];
}

// Row 8, columns from 13 to right
for (let c = size - 8; c < size; c++) {
	format2 += matrix[8][c];
}

console.log("Leída: " + format2);
console.log("Esperada: " + FORMAT_INFO_M_MASK0);
console.log("Coincide: " + (format2 === FORMAT_INFO_M_MASK0 ? "✓" : "✗"));

// Now let's check what qrcode-generator writes for M level, mask 6
console.log("\n=== Comparación con qrcode-generator ===");

const qr = qrgen(1, "M");
qr.addData("01234567");
qr.make();

// Read format info from qrcode-generator
let qrgenFormat1 = "";
for (let c = 0; c <= 5; c++) {
	qrgenFormat1 += qr.isDark(8, c) ? "1" : "0";
}
qrgenFormat1 += qr.isDark(8, 7) ? "1" : "0";
qrgenFormat1 += qr.isDark(8, 8) ? "1" : "0";
qrgenFormat1 += qr.isDark(7, 8) ? "1" : "0";
for (let r = 5; r >= 0; r--) {
	qrgenFormat1 += qr.isDark(r, 8) ? "1" : "0";
}

console.log("qrcode-generator format: " + qrgenFormat1);

// Decode it
const XOR_MASK = "101010000010010";
let decoded = "";
for (let i = 0; i < 15; i++) {
	const bit = qrgenFormat1[i] === "1" ? 1 : 0;
	const mask_bit = XOR_MASK[i] === "1" ? 1 : 0;
	decoded += (bit ^ mask_bit).toString();
}
console.log("Después de quitar XOR mask: " + decoded);
console.log(
	"  EC Level bits: " +
		decoded.substring(0, 2) +
		" = " +
		parseInt(decoded.substring(0, 2), 2),
);
console.log(
	"  Mask bits: " +
		decoded.substring(2, 5) +
		" = " +
		parseInt(decoded.substring(2, 5), 2),
);

// Now show our format bits
console.log("\n=== Nuestros format bits detallados ===");
console.log("Para EC Level M (00) y Mask 0 (000):");
console.log("  Data bits: 00 000 = 00000");
console.log("  BCH encoding: adds 10 check bits");

// Show what our format looks like in detail
console.log("\nPrimera copia posiciones:");
console.log("  Row 8:");
for (let c = 0; c <= 8; c++) {
	if (c === 6) {
		// timing column
		console.log(`    [8][6] = timing (skipped)`);
	} else {
		console.log(`    [8][${c}] = ${matrix[8][c]}`);
	}
}
console.log("  Column 8:");
for (let r = 7; r >= 0; r--) {
	if (r === 6) {
		console.log(`    [6][8] = timing (skipped)`);
	} else {
		console.log(`    [${r}][8] = ${matrix[r][8]}`);
	}
}

// Check the dark module at position (size-8, 8)
console.log(`\n=== Módulo oscuro obligatorio ===`);
console.log(
	`Posición: [${size - 8}][8] = (4*V + 9, 8) = (${4 * version + 9}, 8)`,
);
console.log(`Valor: ${matrix[size - 8][8]}`);
console.log(`Debería ser: 1 (siempre oscuro)`);
console.log(`Correcto: ${matrix[size - 8][8] === 1 ? "✓" : "✗"}`);
