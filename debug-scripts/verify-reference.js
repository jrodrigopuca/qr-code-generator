// verify-reference.js - Verificar la matriz de referencia con qrcode-generator

// Instalar qrcode-generator: npm install qrcode-generator

const qrgen = require("qrcode-generator");

// Generar QR con qrcode-generator
const qr = qrgen(1, "M"); // typeNumber=1 (V1), errorCorrectionLevel='M'
qr.addData("01234567", "Numeric");
qr.make();

console.log("=== QR generado con qrcode-generator ===\n");
console.log("Tamaño:", qr.getModuleCount(), "x", qr.getModuleCount());

// Obtener matriz
const size = qr.getModuleCount();
const matrix = [];
for (let r = 0; r < size; r++) {
	const row = [];
	for (let c = 0; c < size; c++) {
		row.push(qr.isDark(r, c) ? 1 : 0);
	}
	matrix.push(row);
}

console.log("\nMatriz generada:");
for (let r = 0; r < size; r++) {
	console.log(r.toString().padStart(2) + " " + matrix[r].join(""));
}

// Mi referencia original
const MY_REFERENCE = [
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

// Comparar
console.log("\n=== Comparación con mi referencia ===");
let diffs = 0;
for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		if (matrix[r][c] !== MY_REFERENCE[r][c]) {
			diffs++;
			if (diffs <= 10) {
				console.log(
					`  Diferencia en [${r}][${c}]: qrcode-gen=${matrix[r][c]}, mi_ref=${MY_REFERENCE[r][c]}`,
				);
			}
		}
	}
}
console.log(`\nTotal diferencias: ${diffs}`);

if (diffs === 0) {
	console.log("✓ Las matrices coinciden!");
} else {
	console.log("✗ Las matrices no coinciden");
	console.log("\nNota: qrcode-generator puede usar una máscara diferente.");
	// Mostrar qué máscara usa mi referencia vs qrcode-generator
}
