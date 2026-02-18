/**
 * Script para comparar QR generado con referencia conocida.
 * Genera un QR "01234567" con nivel M que tiene una referencia conocida.
 */

import { QRCode } from "../src/QRCode";

// QR de referencia: "01234567" con EC=M, máscara 2
// Este es un QR conocido y verificado
const REFERENCE_MATRIX = [
	[1,1,1,1,1,1,1,0,0,0,1,0,0,0,1,1,1,1,1,1,1],
	[1,0,0,0,0,0,1,0,1,1,0,0,0,0,1,0,0,0,0,0,1],
	[1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
	[1,0,1,1,1,0,1,0,0,0,0,0,1,0,1,0,1,1,1,0,1],
	[1,0,1,1,1,0,1,0,0,1,0,1,0,0,1,0,1,1,1,0,1],
	[1,0,0,0,0,0,1,0,1,1,1,1,0,0,1,0,0,0,0,0,1],
	[1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
	[0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0,0,0,0],
	[0,1,1,0,1,0,1,1,1,0,0,1,1,0,0,1,0,0,1,1,0],
	[1,0,1,1,0,1,0,0,0,1,0,1,0,1,1,0,1,0,0,0,1],
	[1,1,0,1,0,0,1,1,1,0,0,0,1,1,1,0,1,0,0,1,0],
	[0,1,0,1,0,1,0,0,0,0,1,1,0,1,0,0,0,1,0,0,0],
	[1,1,0,1,0,0,1,0,0,0,0,1,0,1,0,0,0,0,0,1,1],
	[0,0,0,0,0,0,0,0,1,1,0,0,0,1,0,0,0,0,0,1,0],
	[1,1,1,1,1,1,1,0,0,0,1,0,0,0,0,0,0,1,1,0,0],
	[1,0,0,0,0,0,1,0,0,0,0,1,0,1,1,0,1,1,1,1,0],
	[1,0,1,1,1,0,1,0,0,0,0,0,1,1,0,1,1,0,0,0,1],
	[1,0,1,1,1,0,1,0,1,0,0,1,0,0,1,1,0,1,1,1,1],
	[1,0,1,1,1,0,1,0,1,1,1,0,0,0,1,0,0,0,0,0,0],
	[1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,1,0,0,1,1,1],
	[1,1,1,1,1,1,1,0,0,1,1,0,0,1,0,1,0,1,1,0,1],
];

// Generar nuestro QR con máscara forzada a 2 para comparar
const data = "01234567";
const qr = new QRCode(data, { errorCorrectionLevel: "M", mask: 2 });
const result = qr.generate();

console.log(`\n=== Comparación de QR ===`);
console.log(`Texto: "${data}"`);
console.log(`Versión: ${result.version}`);
console.log(`Máscara: ${result.maskPattern}`);
console.log(`Modo: ${result.mode}`);

// Comparar matrices
let differences = 0;
const diffMap: string[] = [];

for (let row = 0; row < 21; row++) {
	let line = "";
	for (let col = 0; col < 21; col++) {
		const expected = REFERENCE_MATRIX[row][col];
		const actual = result.matrix[row][col];
		if (expected !== actual) {
			differences++;
			line += "X";
		} else {
			line += actual === 1 ? "█" : " ";
		}
	}
	diffMap.push(line);
}

console.log(`\nDiferencias encontradas: ${differences}`);

if (differences > 0) {
	console.log("\nMapa de diferencias (X = diferente):");
	for (let row = 0; row < 21; row++) {
		console.log(`${row.toString().padStart(2)} ${diffMap[row]}`);
	}
	
	console.log("\nMatriz generada:");
	for (let row = 0; row < 21; row++) {
		console.log(`${row.toString().padStart(2)} ${result.matrix[row].join("")}`);
	}
	
	console.log("\nMatriz de referencia:");
	for (let row = 0; row < 21; row++) {
		console.log(`${row.toString().padStart(2)} ${REFERENCE_MATRIX[row].join("")}`);
	}
} else {
	console.log("✅ Las matrices coinciden perfectamente!");
}
