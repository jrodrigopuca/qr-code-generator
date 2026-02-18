// check-masks.js - Verificar qué máscara usa cada implementación
const { createCanvas } = require("canvas");
const qrgen = require("qrcode-generator");
const { QRCode } = require("../dist/QRCode.js");

const text = "01234567";

// Generar con qrcode-generator
const qr1 = qrgen(1, "M");
qr1.addData(text);
qr1.make();

// Leer format info de qrcode-generator
const size = qr1.getModuleCount();
console.log("=== Análisis de máscaras ===\n");
console.log("Tamaño:", size, "x", size);

// Format info está en fila 8, columnas 0-5 y 7-8 (primera copia)
// Los bits son: D1 D2 D3 D4 D5 D6 D7 D8 D9 D10 D11 D12 D13 D14 D15
// Donde D1-D2 = nivel EC, D3-D5 = máscara

// Leer primera copia del format info de qrcode-generator
let formatBits1 = "";
// Columnas 0-5 de fila 8
for (let c = 0; c <= 5; c++) {
	formatBits1 += qr1.isDark(8, c) ? "1" : "0";
}
// Columna 7 de fila 8
formatBits1 += qr1.isDark(8, 7) ? "1" : "0";
// Columna 8 de fila 8
formatBits1 += qr1.isDark(8, 8) ? "1" : "0";
// Columnas 8 de filas 7,5,4,3,2,1,0
formatBits1 += qr1.isDark(7, 8) ? "1" : "0";
formatBits1 += qr1.isDark(5, 8) ? "1" : "0";
formatBits1 += qr1.isDark(4, 8) ? "1" : "0";
formatBits1 += qr1.isDark(3, 8) ? "1" : "0";
formatBits1 += qr1.isDark(2, 8) ? "1" : "0";
formatBits1 += qr1.isDark(1, 8) ? "1" : "0";
formatBits1 += qr1.isDark(0, 8) ? "1" : "0";

console.log("Format info de qrcode-generator: " + formatBits1);

// XOR con máscara
const FORMAT_MASK = "101010000010010";
let dataFormat1 = "";
for (let i = 0; i < 15; i++) {
	const bit1 = formatBits1[i] === "1" ? 1 : 0;
	const mask = FORMAT_MASK[i] === "1" ? 1 : 0;
	dataFormat1 += (bit1 ^ mask).toString();
}
console.log("Después de XOR con máscara: " + dataFormat1);
console.log("  Nivel EC (bits 0-1): " + dataFormat1.substring(0, 2));
console.log("  Máscara (bits 2-4): " + dataFormat1.substring(2, 5));

const ecLevel = parseInt(dataFormat1.substring(0, 2), 2);
const maskPattern = parseInt(dataFormat1.substring(2, 5), 2);

const EC_NAMES = ["M", "L", "H", "Q"];
console.log(`  -> EC Level: ${ecLevel} (${EC_NAMES[ecLevel]})`);
console.log(`  -> Máscara: ${maskPattern}`);

// Ahora verificar nuestra implementación
console.log("\n=== Nuestra implementación ===");
const qr2 = QRCode.create(text, { errorCorrectionLevel: "M" });
const matrix = qr2.getMatrix();

// Leer nuestro format info
let formatBits2 = "";
// Columnas 0-5 de fila 8
for (let c = 0; c <= 5; c++) {
	formatBits2 += matrix[8][c] ? "1" : "0";
}
// Columna 7 de fila 8
formatBits2 += matrix[8][7] ? "1" : "0";
// Columna 8 de fila 8
formatBits2 += matrix[8][8] ? "1" : "0";
// Columnas 8 de filas 7,5,4,3,2,1,0
formatBits2 += matrix[7][8] ? "1" : "0";
formatBits2 += matrix[5][8] ? "1" : "0";
formatBits2 += matrix[4][8] ? "1" : "0";
formatBits2 += matrix[3][8] ? "1" : "0";
formatBits2 += matrix[2][8] ? "1" : "0";
formatBits2 += matrix[1][8] ? "1" : "0";
formatBits2 += matrix[0][8] ? "1" : "0";

console.log("Format info nuestro: " + formatBits2);

let dataFormat2 = "";
for (let i = 0; i < 15; i++) {
	const bit1 = formatBits2[i] === "1" ? 1 : 0;
	const mask = FORMAT_MASK[i] === "1" ? 1 : 0;
	dataFormat2 += (bit1 ^ mask).toString();
}
console.log("Después de XOR con máscara: " + dataFormat2);
console.log("  Nivel EC (bits 0-1): " + dataFormat2.substring(0, 2));
console.log("  Máscara (bits 2-4): " + dataFormat2.substring(2, 5));

const ecLevel2 = parseInt(dataFormat2.substring(0, 2), 2);
const maskPattern2 = parseInt(dataFormat2.substring(2, 5), 2);

console.log(`  -> EC Level: ${ecLevel2} (${EC_NAMES[ecLevel2]})`);
console.log(`  -> Máscara: ${maskPattern2}`);

// Comparación
console.log("\n=== Comparación ===");
if (maskPattern === maskPattern2) {
	console.log("✓ Ambos usan la misma máscara: " + maskPattern);
} else {
	console.log("✗ MÁSCARAS DIFERENTES!");
	console.log(`  qrcode-generator: máscara ${maskPattern}`);
	console.log(`  Nuestra: máscara ${maskPattern2}`);
}

// Patterns esperados para M level
console.log("\n=== Format strings para verificar ===");
const FORMAT_STRINGS = {
	"M-0": "101010000010010",
	"M-1": "101000100100101",
	"M-2": "101111001111100",
	"M-3": "101101101001011",
	"M-4": "100010111111001",
	"M-5": "100000011001110",
	"M-6": "100111110010111",
	"M-7": "100101010100000",
};

for (const [key, expected] of Object.entries(FORMAT_STRINGS)) {
	if (formatBits1 === expected) {
		console.log(`qrcode-generator usa: ${key}`);
	}
	if (formatBits2 === expected) {
		console.log(`Nuestra implementación usa: ${key}`);
	}
}
