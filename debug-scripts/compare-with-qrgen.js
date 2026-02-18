// compare-with-qrgen.js - Comparar con qrcode-generator
const qrgen = require("qrcode-generator");
const { QRCode } = require("../dist/QRCode.js");

// Generar con qrcode-generator
const qr = qrgen(1, "M");
qr.addData("01234567", "Numeric");
qr.make();

const size = qr.getModuleCount();
const qrgenMatrix = [];
for (let r = 0; r < size; r++) {
	const row = [];
	for (let c = 0; c < size; c++) {
		row.push(qr.isDark(r, c) ? 1 : 0);
	}
	qrgenMatrix.push(row);
}

// Generar con nuestro código (auto-mask)
const ourQr = new QRCode("01234567", { errorCorrectionLevel: "M" });
const ourResult = ourQr.generate();

console.log("=== Comparación directa ===\n");
console.log("qrcode-generator (máscara auto):");
console.log("Nuestra implementación: máscara", ourResult.maskPattern);
console.log("");

// Imprimir ambas matrices lado a lado
console.log("Comparación fila por fila:");
console.log("(+) = nuestra tiene 1, qrgen tiene 0");
console.log("(-) = nuestra tiene 0, qrgen tiene 1");
console.log("");

let totalDiffs = 0;
for (let r = 0; r < size; r++) {
	let diffLine = "";
	let ourLine = "";
	let qrgenLine = "";

	for (let c = 0; c < size; c++) {
		const ourVal = ourResult.matrix[r][c];
		const qrgenVal = qrgenMatrix[r][c];
		ourLine += ourVal;
		qrgenLine += qrgenVal;

		if (ourVal !== qrgenVal) {
			diffLine += ourVal > qrgenVal ? "+" : "-";
			totalDiffs++;
		} else {
			diffLine += ".";
		}
	}

	if (diffLine.includes("+") || diffLine.includes("-")) {
		console.log(`Row ${r.toString().padStart(2)}: ${diffLine}`);
		console.log(`  Ours:  ${ourLine}`);
		console.log(`  QRgen: ${qrgenLine}`);
	}
}

console.log(`\nTotal diferencias: ${totalDiffs}`);

if (totalDiffs === 0) {
	console.log("✓ ¡Las matrices son idénticas!");
} else {
	console.log("✗ Hay diferencias");
}

// Verificar con jsqr si nuestra versión puede leerse
console.log("\n=== Prueba de decodificación con jsqr ===");
const { createCanvas } = require("canvas");
const jsqr = require("jsqr");

function testDecode(matrix, name) {
	const qrSize = matrix.length;
	const scale = 10;
	const canvas = createCanvas(qrSize * scale, qrSize * scale);
	const ctx = canvas.getContext("2d");

	// Dibujar QR
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "black";

	for (let r = 0; r < qrSize; r++) {
		for (let c = 0; c < qrSize; c++) {
			if (matrix[r][c] === 1) {
				ctx.fillRect(c * scale, r * scale, scale, scale);
			}
		}
	}

	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const decoded = jsqr(imageData.data, canvas.width, canvas.height);

	if (decoded) {
		console.log(`${name}: ✓ Decodificado = "${decoded.data}"`);
		return true;
	} else {
		console.log(`${name}: ✗ No se pudo decodificar`);
		return false;
	}
}

testDecode(qrgenMatrix, "qrcode-generator");
testDecode(ourResult.matrix, "Nuestra implementación");
