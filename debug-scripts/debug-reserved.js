// debug-reserved.js - Debug qué posiciones están reservadas
// Necesitamos simular exactamente lo que hace QRCode.generate() para ver las áreas reservadas

const { FinderPattern } = require("../dist/patterns/FinderPattern.js");
const { TimingPattern } = require("../dist/patterns/TimingPattern.js");
const { AlignmentPattern } = require("../dist/patterns/AlignmentPattern.js");
const { FormatInfo } = require("../dist/patterns/FormatInfo.js");

const size = 21; // V1
const version = 1;

// Crear matrices
const matrix = Array.from({ length: size }, () => Array(size).fill(0));
const reserved = Array.from({ length: size }, () => Array(size).fill(0));

console.log("=== Debug de áreas reservadas ===\n");

// Simular placePatterns
console.log("1. Colocando FinderPattern.draw...");
FinderPattern.draw(matrix, reserved);

// Mostrar reserved después de finder patterns
console.log("\nReserved después de FinderPattern:");
for (let r = 0; r < size; r++) {
	let line = r.toString().padStart(2) + " ";
	for (let c = 0; c < size; c++) {
		line += reserved[r][c] ? "█" : ".";
	}
	console.log(line);
}

// Específicamente ver fila 7
console.log("\nFila 7 reservada:", reserved[7].join(""));
console.log("  Columnas 0-7:", reserved[7].slice(0, 8).join(""));
console.log("  Columnas 8-12:", reserved[7].slice(8, 13).join(""));
console.log("  Columnas 13-20:", reserved[7].slice(13, 21).join(""));

console.log("\n2. Colocando TimingPattern.draw...");
TimingPattern.draw(matrix, reserved);

// Mostrar reserved después de timing
console.log("\nReserved después de TimingPattern:");
for (let r = 0; r < size; r++) {
	let line = r.toString().padStart(2) + " ";
	for (let c = 0; c < size; c++) {
		line += reserved[r][c] ? "█" : ".";
	}
	console.log(line);
}

console.log("\nFila 7 reservada:", reserved[7].join(""));
console.log("  Columnas 0-7:", reserved[7].slice(0, 8).join(""));
console.log("  Columnas 8-12:", reserved[7].slice(8, 13).join(""));
console.log("  Columnas 13-20:", reserved[7].slice(13, 21).join(""));

// AlignmentPattern (pero V1 no tiene)
console.log("\n3. AlignmentPattern.draw (V1 no tiene)...");
AlignmentPattern.draw(matrix, reserved, version);

// FormatInfo.reserveFormatArea
console.log("\n4. FormatInfo.reserveFormatArea...");
FormatInfo.reserveFormatArea(reserved, size);

// Mostrar reserved después de todo
console.log("\nReserved FINAL (antes de colocar datos):");
for (let r = 0; r < size; r++) {
	let line = r.toString().padStart(2) + " ";
	for (let c = 0; c < size; c++) {
		line += reserved[r][c] ? "█" : ".";
	}
	console.log(line);
}

console.log("\nFila 7 reservada FINAL:", reserved[7].join(""));
console.log("  Columnas 0-7:", reserved[7].slice(0, 8).join(""));
console.log("  Columnas 8-12:", reserved[7].slice(8, 13).join(""));
console.log("  Columnas 13-20:", reserved[7].slice(13, 21).join(""));

// Contar posiciones disponibles para datos
let availableCount = 0;
for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		if (reserved[r][c] === 0) availableCount++;
	}
}
console.log("\nPosiciones disponibles para datos:", availableCount);
console.log("Bits de datos V1-M: 26 * 8 =", 26 * 8);

// Lista de posiciones en fila 7 que NO están reservadas
console.log("\nPosiciones disponibles en fila 7:");
for (let c = 0; c < size; c++) {
	if (reserved[7][c] === 0) {
		console.log(`  Fila 7, columna ${c} está disponible`);
	}
}
