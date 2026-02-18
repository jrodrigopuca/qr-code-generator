/**
 * Script para verificar que los QR generados sean decodificables.
 * 
 * Uso: npx tsx test-decode.ts [texto] [nivel]
 */

import { QRCode } from "../src/QRCode";
import { createCanvas } from "canvas";
import jsQR from "jsqr";

// Configuración
const data = process.argv[2] || "HELLO";
const errorLevel = (process.argv[3] as "L" | "M" | "Q" | "H") || "L";

console.log(`\n=== Verificación de Decodificación ===`);
console.log(`Texto original: "${data}"`);
console.log(`Nivel EC: ${errorLevel}\n`);

// Generar QR
const qr = new QRCode(data, { errorCorrectionLevel: errorLevel });
const result = qr.generate();

// Renderizar a canvas
const scale = 10;
const margin = 4;
const size = result.size;
const totalSize = (size + margin * 2) * scale;

const canvas = createCanvas(totalSize, totalSize);
const ctx = canvas.getContext("2d");

// Fondo blanco
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, totalSize, totalSize);

// Dibujar módulos
ctx.fillStyle = "#000000";
for (let row = 0; row < size; row++) {
	for (let col = 0; col < size; col++) {
		if (result.matrix[row][col] === 1) {
			const x = (col + margin) * scale;
			const y = (row + margin) * scale;
			ctx.fillRect(x, y, scale, scale);
		}
	}
}

// Obtener datos de imagen
const imageData = ctx.getImageData(0, 0, totalSize, totalSize);

// Intentar decodificar
const decoded = jsQR(imageData.data, totalSize, totalSize);

if (decoded) {
	console.log(`✅ QR decodificado exitosamente`);
	console.log(`   Texto decodificado: "${decoded.data}"`);
	
	if (decoded.data === data) {
		console.log(`\n✅ VERIFICACIÓN EXITOSA: El texto coincide`);
	} else {
		console.log(`\n❌ ERROR: El texto no coincide`);
		console.log(`   Esperado: "${data}"`);
		console.log(`   Obtenido: "${decoded.data}"`);
	}
} else {
	console.log(`❌ ERROR: No se pudo decodificar el QR`);
	console.log(`   Versión: ${result.version}`);
	console.log(`   Tamaño: ${result.size}x${result.size}`);
	console.log(`   Máscara: ${result.maskPattern}`);
	console.log(`   Modo: ${result.mode}`);
}
