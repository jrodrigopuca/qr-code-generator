// check-reserved-real.js - Ver las áreas reservadas reales del código de producción
const { QRCode } = require("../dist/QRCode.js");
const qrgen = require("qrcode-generator");

// Generar con ambas implementaciones
const qr = qrgen(1, "M");
qr.addData("01234567", "Numeric");
qr.make();

// Nuestro QR
// Necesitamos acceder a la matriz reserved, pero no está expuesta
// Vamos a simular manualmente usando la misma lógica

console.log("=== Verificación de Fila 7 ===\n");

// Obtener matriz de qrcode-generator
const size = 21;
const qrgenFila7 = [];
for (let c = 0; c < size; c++) {
	qrgenFila7.push(qr.isDark(7, c) ? 1 : 0);
}

const ourQr = new QRCode("01234567", { errorCorrectionLevel: "M" });
const ourResult = ourQr.generate();
const ourFila7 = ourResult.matrix[7];

console.log("Fila 7 de qrcode-generator:", qrgenFila7.join(""));
console.log("Fila 7 nuestra:             ", ourFila7.join(""));

// Comparar
let difsF7 = "";
for (let c = 0; c < size; c++) {
	if (ourFila7[c] !== qrgenFila7[c]) {
		difsF7 += "X";
	} else {
		difsF7 += ".";
	}
}
console.log("Diferencias:                ", difsF7);

console.log("\nAnálisis por sección:");
console.log("  Columnas 0-7 (separador izq):", ourFila7.slice(0, 8).join(""));
console.log("  Columnas 8-12 (datos/fmt):   ", ourFila7.slice(8, 13).join(""));
console.log(
	"  Columnas 13-20 (separador der):",
	ourFila7.slice(13, 21).join(""),
);

console.log("\nQRgen:");
console.log("  Columnas 0-7 (separador izq):", qrgenFila7.slice(0, 8).join(""));
console.log(
	"  Columnas 8-12 (datos/fmt):   ",
	qrgenFila7.slice(8, 13).join(""),
);
console.log(
	"  Columnas 13-20 (separador der):",
	qrgenFila7.slice(13, 21).join(""),
);

console.log("\n=== Verificación de Fila 8 (Format Info) ===");
const ourFila8 = ourResult.matrix[8];
const qrgenFila8 = [];
for (let c = 0; c < size; c++) {
	qrgenFila8.push(qr.isDark(8, c) ? 1 : 0);
}

console.log("Fila 8 nuestra:             ", ourFila8.join(""));
console.log("Fila 8 qrcode-generator:    ", qrgenFila8.join(""));

// Diferencias
let difsF8 = "";
for (let c = 0; c < size; c++) {
	if (ourFila8[c] !== qrgenFila8[c]) {
		difsF8 += "X";
	} else {
		difsF8 += ".";
	}
}
console.log("Diferencias:                ", difsF8);

// Mostrar específicamente columna 8 (vertical)
console.log("\n=== Columna 8 (Format Info Vertical) ===");
let ourCol8 = "";
let qrgenCol8 = "";
for (let r = 0; r < size; r++) {
	ourCol8 += ourResult.matrix[r][8];
	qrgenCol8 += qr.isDark(r, 8) ? "1" : "0";
}
console.log("Columna 8 nuestra:       ", ourCol8);
console.log("Columna 8 qrcode-gen:    ", qrgenCol8);

// Analizar por secciones
console.log("\nDesglose columna 8:");
console.log(
	"  Filas 0-5 (finder area):",
	ourCol8.slice(0, 6),
	"vs",
	qrgenCol8.slice(0, 6),
);
console.log("  Fila 6 (timing):        ", ourCol8[6], "vs", qrgenCol8[6]);
console.log("  Fila 7 (separador):     ", ourCol8[7], "vs", qrgenCol8[7]);
console.log(
	"  Filas 8-12:             ",
	ourCol8.slice(8, 13),
	"vs",
	qrgenCol8.slice(8, 13),
);
console.log(
	"  Filas 13-20:            ",
	ourCol8.slice(13, 21),
	"vs",
	qrgenCol8.slice(13, 21),
);
