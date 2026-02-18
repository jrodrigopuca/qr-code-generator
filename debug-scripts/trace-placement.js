// trace-placement.js - Trazar exactamente qué bits van en la fila 7
const { FinderPattern } = require("../dist/patterns/FinderPattern.js");
const { TimingPattern } = require("../dist/patterns/TimingPattern.js");
const { AlignmentPattern } = require("../dist/patterns/AlignmentPattern.js");
const { FormatInfo } = require("../dist/patterns/FormatInfo.js");
const { REMAINDER_BITS } = require("../dist/constants/index.js");

const size = 21;
const version = 1;

// Crear matrices
const matrix = Array.from({ length: size }, () => Array(size).fill(-1)); // -1 = sin colocar
const reserved = Array.from({ length: size }, () => Array(size).fill(0));

// Colocar patrones de función (copiar la lógica exacta de QRCode)
FinderPattern.draw(matrix, reserved);
TimingPattern.draw(matrix, reserved);
AlignmentPattern.draw(matrix, reserved, version);
FormatInfo.reserveFormatArea(reserved, size);

// Simular datos (26 codewords para V1-M)
const codewords = [
	0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec,
	0x11, 0xec, 0x11, 0xa5, 0x24, 0xd4, 0xc1, 0xed, 0x36, 0xc7, 0x87, 0x2c, 0x55,
];

// Convertir a bits
const bits = [];
for (const cw of codewords) {
	for (let i = 7; i >= 0; i--) {
		bits.push((cw >> i) & 1);
	}
}
const remainder = REMAINDER_BITS[version - 1];
for (let i = 0; i < remainder; i++) {
	bits.push(0);
}

console.log("=== Traza de colocación de bits ===\n");
console.log("Total bits a colocar:", bits.length);

// Tracking para fila 7
const row7Placements = [];

// Algoritmo zigzag (copiado exactamente de QRCode.ts)
let bitIndex = 0;
let right = size - 1;

while (right >= 0 && bitIndex < bits.length) {
	if (right === 6) {
		right--;
		continue;
	}

	const directionIndex = Math.floor((size - 1 - right) / 2);
	const goingUp = directionIndex % 2 === 0;

	for (let vert = 0; vert < size; vert++) {
		const row = goingUp ? size - 1 - vert : vert;

		for (let horz = 0; horz < 2; horz++) {
			const col = right - horz;

			if (col < 0) continue;
			if (reserved[row][col] !== 0) continue;
			if (bitIndex >= bits.length) continue;

			// Registrar colocación en fila 7
			if (row === 7) {
				row7Placements.push({
					col: col,
					bitIndex: bitIndex,
					bitValue: bits[bitIndex],
					columns: `${right}-${right - 1}`,
				});
			}

			matrix[row][col] = bits[bitIndex];
			bitIndex++;
		}
	}

	right -= 2;
}

console.log("\nBits colocados:", bitIndex);

// Mostrar colocaciones en fila 7
console.log("\n=== Colocaciones en fila 7 ===");
if (row7Placements.length === 0) {
	console.log("¡PROBLEMA! No se colocó ningún bit en fila 7");

	// Analizar por qué
	console.log("\nAnálisis de por qué no se colocaron bits en fila 7:");
	console.log("Fila 7 reserved:", reserved[7].join(""));

	// Ver qué columnas deberían estar disponibles
	console.log("\nColumnas disponibles (reserved=0) en fila 7:");
	for (let c = 0; c < size; c++) {
		if (reserved[7][c] === 0) {
			console.log(`  Columna ${c}`);
		}
	}

	// Verificar el momento cuando se procesan las columnas 12-9
	console.log("\nSimulando paso por columnas cerca de fila 7:");
	for (let testRight = 12; testRight >= 8; testRight -= 2) {
		if (testRight === 6) continue;
		const dirIdx = Math.floor((size - 1 - testRight) / 2);
		const up = dirIdx % 2 === 0;
		console.log(
			`  Columnas ${testRight}-${testRight - 1}: dirección=${up ? "ARRIBA" : "ABAJO"}, dirIdx=${dirIdx}`,
		);
		console.log(
			`    Fila 7 reserved para col ${testRight}: ${reserved[7][testRight]}, col ${testRight - 1}: ${reserved[7][testRight - 1]}`,
		);
	}
} else {
	console.log(`Se colocaron ${row7Placements.length} bits en fila 7:`);
	for (const p of row7Placements) {
		console.log(
			`  Col ${p.col}: bit[${p.bitIndex}] = ${p.bitValue} (durante columnas ${p.columns})`,
		);
	}
}

// Mostrar matriz de fila 7
console.log("\nFila 7 de la matriz final:");
console.log("  Valores:", matrix[7].map((v) => (v === -1 ? "." : v)).join(""));
console.log("  Reserv:", reserved[7].join(""));

// Verificar si algún módulo se quedó sin colocar en área de datos
console.log("\n=== Módulos de datos sin colocar ===");
let unplacedCount = 0;
for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		if (reserved[r][c] === 0 && matrix[r][c] === -1) {
			unplacedCount++;
			if (unplacedCount <= 10) {
				console.log(`  [${r}][${c}] no tiene datos asignados`);
			}
		}
	}
}
console.log(`Total sin colocar: ${unplacedCount}`);
