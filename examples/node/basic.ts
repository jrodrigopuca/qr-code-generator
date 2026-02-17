/**
 * @fileoverview Ejemplo básico de generación de QR en Node.js
 * @description Ejecutar con: node --experimental-strip-types examples/node/basic.ts
 */

import { QRCode, generateQR, SVGRenderer } from "../../src/index.ts";
import { writeFileSync } from "fs";

console.log("=== QR Code Generator - Node.js Examples ===\n");

// Ejemplo 1: Uso simple con helper function
console.log("1. Generación simple:");
const result = generateQR("Hello World");
console.log(`   Contenido: "Hello World"`);
console.log(`   Versión: ${result.version}`);
console.log(`   Modo: ${result.mode}`);
console.log(`   Tamaño: ${result.size}x${result.size}`);
console.log(`   Nivel corrección: ${result.errorCorrectionLevel}`);

// Ejemplo 2: Diferentes modos de codificación
console.log("\n2. Detección automática de modo:");

const numericQR = generateQR("1234567890");
console.log(
	`   "1234567890" → modo: ${numericQR.mode}, versión: ${numericQR.version}`,
);

const alphanumericQR = generateQR("HELLO WORLD");
console.log(
	`   "HELLO WORLD" → modo: ${alphanumericQR.mode}, versión: ${alphanumericQR.version}`,
);

const byteQR = generateQR("hello@example.com");
console.log(
	`   "hello@example.com" → modo: ${byteQR.mode}, versión: ${byteQR.version}`,
);

// Ejemplo 3: Configuración avanzada
console.log("\n3. Configuración avanzada:");
const qr = new QRCode("https://github.com", {
	errorCorrectionLevel: "H",
	version: "auto",
	mask: "auto",
});
const advancedResult = qr.generate();
console.log(`   URL: "https://github.com"`);
console.log(`   Corrección: H (30% recovery)`);
console.log(`   Versión seleccionada: ${advancedResult.version}`);
console.log(`   Máscara aplicada: ${advancedResult.maskPattern}`);

// Ejemplo 4: Generar SVG
console.log("\n4. Generación de SVG:");
const svgContent = SVGRenderer.render(result.matrix, {
	scale: 8,
	margin: 2,
	darkColor: "#000000",
	lightColor: "#ffffff",
});

const outputPath = "examples/node/output.svg";
writeFileSync(outputPath, svgContent);
console.log(`   SVG guardado en: ${outputPath}`);

// Ejemplo 5: Diferentes niveles de corrección
console.log("\n5. Comparación de niveles de corrección:");
const testContent = "QR Code Test";
["L", "M", "Q", "H"].forEach((level) => {
	const qrResult = generateQR(testContent, {
		errorCorrectionLevel: level as "L" | "M" | "Q" | "H",
	});
	console.log(
		`   Nivel ${level}: versión ${qrResult.version}, tamaño ${qrResult.size}x${qrResult.size}`,
	);
});

// Ejemplo 6: Acceso a la matriz
console.log("\n6. Acceso a la matriz binaria:");
const smallQR = generateQR("Hi", { errorCorrectionLevel: "L" });
console.log(`   Matriz ${smallQR.size}x${smallQR.size}:`);

// Mostrar las primeras 7 filas (finder pattern)
for (let row = 0; row < 7; row++) {
	const line = smallQR.matrix[row]
		.slice(0, 7)
		.map((cell) => (cell === 1 ? "██" : "  "))
		.join("");
	console.log(`   ${line}`);
}
console.log("   (Finder pattern superior izquierdo)");

console.log("\n=== Ejemplos completados ===");
