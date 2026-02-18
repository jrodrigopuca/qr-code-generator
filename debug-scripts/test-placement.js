// test-placement.js - Verificar el algoritmo de colocación de datos
// Vamos a colocar bits manualmente y comparar con la matriz de referencia

const size = 21; // V1

// Crear matrices
const matrix = Array.from({ length: size }, () => Array(size).fill(-1));
const reserved = Array.from({ length: size }, () => Array(size).fill(0));

// Marcar áreas reservadas (similar a lo que hace el QRCode)
// Finder patterns + separators (esquinas)
for (let r = 0; r < 9; r++) {
	for (let c = 0; c < 9; c++) {
		reserved[r][c] = 1; // Superior izquierdo
		if (r < 9 && size - 1 - c >= size - 8)
			reserved[r][size - 1 - c + (c < 1 ? 0 : 0)] = 1; // Superior derecho
	}
}
// Superior derecho
for (let r = 0; r < 9; r++) {
	for (let c = size - 8; c < size; c++) {
		reserved[r][c] = 1;
	}
}
// Inferior izquierdo
for (let r = size - 8; r < size; r++) {
	for (let c = 0; c < 9; c++) {
		reserved[r][c] = 1;
	}
}
// Timing patterns
for (let i = 0; i < size; i++) {
	reserved[6][i] = 1;
	reserved[i][6] = 1;
}
// Format info area
for (let i = 0; i < 9; i++) {
	reserved[8][i] = 1;
	reserved[i][8] = 1;
	reserved[8][size - 1 - i] = 1;
	reserved[size - 1 - i][8] = 1;
}

console.log("=== Análisis del algoritmo de colocación zigzag ===\n");

// Mostrar áreas reservadas
console.log("Áreas reservadas (1 = reservado):");
for (let r = 0; r < size; r++) {
	let row = "";
	for (let c = 0; c < size; c++) {
		row += reserved[r][c] ? "█" : ".";
	}
	console.log(r.toString().padStart(2) + " " + row);
}

// Simular colocación de datos con el algoritmo actual
const bits = [];
for (let i = 0; i < 208; i++) {
	// V1 tiene 208 bits de datos (26 codewords * 8)
	bits.push(i % 10); // Números 0-9 para ver el orden
}

console.log("\n=== Simulando colocación con algoritmo actual ===");
console.log("Total bits a colocar:", bits.length);

let bitIndex = 0;
let right = size - 1;
const placementOrder = []; // Para registrar el orden

while (right >= 0 && bitIndex < bits.length) {
	// Skip columna 6 (timing pattern vertical)
	if (right === 6) {
		console.log("Saltando columna 6");
		right--;
		continue;
	}

	// Determinar dirección
	const directionIndex = Math.floor((size - 1 - right) / 2);
	const goingUp = directionIndex % 2 === 0;
	console.log(
		"Columnas " +
			right +
			"-" +
			(right - 1) +
			": dirección=" +
			(goingUp ? "ARRIBA" : "ABAJO") +
			" (directionIndex=" +
			directionIndex +
			")",
	);

	// Procesar columna doble
	for (let vert = 0; vert < size; vert++) {
		const row = goingUp ? size - 1 - vert : vert;

		for (let horz = 0; horz < 2; horz++) {
			const col = right - horz;

			if (col < 0) continue;
			if (reserved[row][col] !== 0) continue;
			if (bitIndex >= bits.length) continue;

			placementOrder.push({ row, col, bitIndex });
			matrix[row][col] = bitIndex;
			bitIndex++;
		}
	}

	right -= 2;
}

console.log("\nBits colocados:", bitIndex);
console.log("Primeros 20 bits colocados:");
for (let i = 0; i < Math.min(20, placementOrder.length); i++) {
	const p = placementOrder[i];
	console.log("  Bit " + p.bitIndex + " → [" + p.row + "][" + p.col + "]");
}

// La referencia esperada según ISO 18004 para V1:
// Empieza en [20][20], luego [20][19], sube a [19][20], [19][19], etc.
console.log("\n=== Orden esperado según ISO 18004 ===");
console.log("El primer bit debería ir en [20][20]");
console.log("El segundo bit debería ir en [20][19]");
console.log("El tercer bit debería ir en [19][20]");
console.log("El cuarto bit debería ir en [19][19]");
console.log("...");

// Verificar si nuestro algoritmo coincide
console.log("\n=== Verificación ===");
const expectedFirst = [
	{ row: 20, col: 20 },
	{ row: 20, col: 19 },
	{ row: 19, col: 20 },
	{ row: 19, col: 19 },
	{ row: 18, col: 20 },
	{ row: 18, col: 19 },
	{ row: 17, col: 20 },
	{ row: 17, col: 19 },
	{ row: 16, col: 20 },
	{ row: 16, col: 19 },
];

let allCorrect = true;
for (
	let i = 0;
	i < Math.min(expectedFirst.length, placementOrder.length);
	i++
) {
	const actual = placementOrder[i];
	const expected = expectedFirst[i];
	const correct = actual.row === expected.row && actual.col === expected.col;
	if (!correct) allCorrect = false;
	console.log(
		"  Bit " +
			i +
			": actual=[" +
			actual.row +
			"][" +
			actual.col +
			"] esperado=[" +
			expected.row +
			"][" +
			expected.col +
			"] " +
			(correct ? "✓" : "✗"),
	);
}

console.log(
	allCorrect
		? "\n✓ Primeros bits coinciden con ISO 18004"
		: "\n✗ HAY PROBLEMAS EN LA COLOCACIÓN",
);
