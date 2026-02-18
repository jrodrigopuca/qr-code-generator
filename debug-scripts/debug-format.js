// debug-format.js - Debug format info
const { QRCode } = require("../dist/QRCode.js");
const { FORMAT_INFO_STRINGS } = require("../dist/constants/index.js");

// Verificar las cadenas de formato predefinidas
console.log("=== FORMAT_INFO_STRINGS ===\n");
console.log("M level formats:");
for (let mask = 0; mask < 8; mask++) {
	console.log(`  Mask ${mask}: ${FORMAT_INFO_STRINGS[mask]["M"]}`);
}

// Generar nuestro QR y ver qué mask usa
const ourQr = new QRCode("01234567", { errorCorrectionLevel: "M" });
const ourResult = ourQr.generate();
console.log("\nNuestra máscara seleccionada:", ourResult.maskPattern);

// Verificar el formato que debería tener
const expectedFormat = FORMAT_INFO_STRINGS[ourResult.maskPattern]["M"];
console.log("Formato esperado:", expectedFormat);

// Extraer el formato de la matriz generada
console.log("\n=== Leyendo formato de la matriz ===");

const size = 21;
const matrix = ourResult.matrix;

// Primera copia (columna 8)
let format1 = "";
// Bits 0-5: columna 8, filas 0-5
for (let row = 0; row <= 5; row++) {
	format1 += matrix[row][8];
}
// Bit 6: fila 7, columna 8
format1 += matrix[7][8];
// Bit 7: fila 8, columna 8
format1 += matrix[8][8];
// Bit 8: fila 8, columna 7
format1 += matrix[8][7];
// Bits 9-14: fila 8, columnas 5-0
for (let col = 5; col >= 0; col--) {
	format1 += matrix[8][col];
}

console.log("Primera copia leída:  ", format1);
console.log("Formato esperado:     ", expectedFormat);
console.log("Coincide:             ", format1 === expectedFormat ? "✓" : "✗");

// Segunda copia
let format2 = "";
// Bits 0-7: fila 8, columnas size-1 a size-8
for (let col = size - 1; col >= size - 8; col--) {
	format2 += matrix[8][col];
}
// Bits 8-14: columna 8, filas size-7 a size-1
for (let row = size - 7; row <= size - 1; row++) {
	format2 += matrix[row][8];
}

console.log("Segunda copia leída:  ", format2);
console.log("Coincide:             ", format2 === expectedFormat ? "✓" : "✗");

// Verificar posición específica de la fila 8
console.log("\n=== Fila 8 detallada ===");
console.log("Fila 8 completa:", matrix[8].join(""));
console.log("Posiciones clave:");
for (let col = 0; col <= 8; col++) {
	console.log(`  [8][${col}] = ${matrix[8][col]}`);
}
console.log("...");
for (let col = 13; col <= 20; col++) {
	console.log(`  [8][${col}] = ${matrix[8][col]}`);
}

// Verificar si el timing está correcto
console.log("\n=== Verificación del Timing Pattern ===");
console.log("Fila 6 (timing horizontal):");
for (let col = 0; col < size; col++) {
	process.stdout.write(matrix[6][col].toString());
}
console.log("");

console.log("Columna 6 (timing vertical):");
for (let row = 0; row < size; row++) {
	process.stdout.write(matrix[row][6].toString());
}
console.log("");

// Verificar si hay patrones alternantes en lugares incorrectos
console.log("\n=== Verificación de patrones alternantes incorrectos ===");
console.log("Columna 8 (debería ser formato, NO timing):");
let col8Pattern = "";
for (let row = 0; row < size; row++) {
	col8Pattern += matrix[row][8];
}
console.log(col8Pattern);
// Verificar si es alternante
let isAlternating = true;
for (let i = 1; i < col8Pattern.length; i++) {
	if (col8Pattern[i] === col8Pattern[i - 1]) {
		isAlternating = false;
		break;
	}
}
console.log(
	"¿Es patrón alternante?",
	isAlternating ? "SÍ (PROBLEMA!)" : "NO (correcto)",
);
