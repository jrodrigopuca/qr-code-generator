/**
 * Script de depuración para verificar la generación de códigos QR.
 *
 * Uso: npx tsx test-debug.ts [texto] [nivel]
 *
 * Ejemplos:
 *   npx tsx test-debug.ts
 *   npx tsx test-debug.ts "https://example.com" H
 *   npx tsx test-debug.ts "12345" L
 */

import { QRCode } from "../src/QRCode";
import { SVGRenderer } from "../src/renderer";
import { FORMAT_INFO_STRINGS } from "../src/constants";
import * as fs from "fs";

// Configuración desde argumentos o valores por defecto
const data = process.argv[2] || "HELLO";
const errorLevel = (process.argv[3] as "L" | "M" | "Q" | "H") || "L";

console.log(`\n=== QR Debug para: "${data}" ===\n`);

// Generar QR
const qr = new QRCode(data, { errorCorrectionLevel: errorLevel });
const result = qr.generate();

console.log(`Versión: ${result.version}`);
console.log(`Tamaño: ${result.size}x${result.size}`);
console.log(`Máscara: ${result.maskPattern}`);
console.log(`Modo: ${result.mode}`);
console.log(`Nivel EC: ${result.errorCorrectionLevel}`);

// Verificar formato esperado
const expectedFormat =
	FORMAT_INFO_STRINGS[result.maskPattern][result.errorCorrectionLevel];
console.log(`\n--- Información de Formato ---`);
console.log(`Formato esperado: ${expectedFormat}`);

// Leer formato de la matriz (primera copia)
const matrix = result.matrix;
const formatBits1 = [
	matrix[0][8],
	matrix[1][8],
	matrix[2][8],
	matrix[3][8],
	matrix[4][8],
	matrix[5][8],
	matrix[7][8],
	matrix[8][8],
	matrix[8][7],
	matrix[8][5],
	matrix[8][4],
	matrix[8][3],
	matrix[8][2],
	matrix[8][1],
	matrix[8][0],
].join("");
console.log(`Formato leído (copia 1): ${formatBits1}`);

// Segunda copia (posiciones correctas según ISO 18004)
const size = result.size;
const formatBits2 = [
	matrix[8][size - 1],
	matrix[8][size - 2],
	matrix[8][size - 3],
	matrix[8][size - 4],
	matrix[8][size - 5],
	matrix[8][size - 6],
	matrix[8][size - 7],
	matrix[8][size - 8],
	matrix[size - 7][8],
	matrix[size - 6][8],
	matrix[size - 5][8],
	matrix[size - 4][8],
	matrix[size - 3][8],
	matrix[size - 2][8],
	matrix[size - 1][8],
].join("");
console.log(`Formato leído (copia 2): ${formatBits2}`);

// Verificar coincidencia
const formatMatch =
	formatBits1 === expectedFormat && formatBits2 === expectedFormat;
console.log(`Formato correcto: ${formatMatch ? "✅ SÍ" : "❌ NO"}`);

// Módulo oscuro fijo
const darkModuleCorrect = matrix[size - 8][8] === 1;
console.log(
	`Módulo oscuro fijo [${size - 8}][8]: ${darkModuleCorrect ? "✅ OK" : "❌ ERROR"}`,
);

// Verificar patrones finder
console.log(`\n--- Finder Patterns ---`);
const topLeftOK = matrix[0].slice(0, 7).join("") === "1111111";
const topRightOK = matrix[0].slice(-7).join("") === "1111111";
const bottomLeftOK = matrix[size - 1].slice(0, 7).join("") === "1111111";
console.log(`Superior izquierdo: ${topLeftOK ? "✅" : "❌"}`);
console.log(`Superior derecho: ${topRightOK ? "✅" : "❌"}`);
console.log(`Inferior izquierdo: ${bottomLeftOK ? "✅" : "❌"}`);

// Verificar separadores
console.log(`\n--- Separadores (deben ser 0) ---`);
const sepRow7OK = matrix[7].slice(0, 8).every((v) => v === 0);
const sepCol7OK = [0, 1, 2, 3, 4, 5, 6, 7].every((r) => matrix[r][7] === 0);
console.log(`Fila 7, cols 0-7: ${sepRow7OK ? "✅" : "❌"}`);
console.log(`Col 7, filas 0-7: ${sepCol7OK ? "✅" : "❌"}`);

// Verificar timing patterns
console.log(`\n--- Timing Patterns ---`);
const timingRow = matrix[6].slice(8, size - 8);
const timingCol = [];
for (let r = 8; r < size - 8; r++) {
	timingCol.push(matrix[r][6]);
}
const timingRowOK = timingRow.every((v, i) => v === (i % 2 === 0 ? 1 : 0));
const timingColOK = timingCol.every((v, i) => v === (i % 2 === 0 ? 1 : 0));
console.log(`Horizontal (fila 6): ${timingRowOK ? "✅" : "❌"}`);
console.log(`Vertical (col 6): ${timingColOK ? "✅" : "❌"}`);

// Imprimir matriz visual
console.log("\n--- Matriz Visual ---");
for (let row = 0; row < result.size; row++) {
	let line = row.toString().padStart(2, " ") + " ";
	for (let col = 0; col < result.size; col++) {
		line += result.matrix[row][col] === 1 ? "██" : "  ";
	}
	console.log(line);
}

// Generar SVG
const svg = SVGRenderer.render(result.matrix, { scale: 10, margin: 4 });
const svgPath = "test-qr.svg";
fs.writeFileSync(svgPath, svg);
console.log(`\n✅ SVG guardado en ${svgPath}`);

// Resumen
console.log("\n=== Resumen ===");
const allOK =
	formatMatch &&
	darkModuleCorrect &&
	topLeftOK &&
	topRightOK &&
	bottomLeftOK &&
	sepRow7OK &&
	sepCol7OK &&
	timingRowOK &&
	timingColOK;
if (allOK) {
	console.log("✅ Todas las verificaciones pasaron");
} else {
	console.log("❌ Hay errores en la generación del QR");
}
