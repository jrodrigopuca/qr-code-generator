// verify-our-ec.js - Verify our EC codewords are correct
const { GaloisField } = require("../dist/correction/GaloisField.js");
const { ReedSolomon } = require("../dist/correction/ReedSolomon.js");

// Our data codewords (NUMERIC encoding of "01234567")
const dataCodewords = [
	0x10, 0x20, 0x0c, 0x56, 0x61, 0x80, 0xec, 0x11, 0xec, 0x11, 0xec, 0x11, 0xec,
	0x11, 0xec, 0x11,
];

console.log("=== Verificación de EC Codewords ===\n");
console.log(
	"Data codewords:",
	dataCodewords
		.map((c) => c.toString(16).toUpperCase().padStart(2, "0"))
		.join(" "),
);

// V1-M has 10 EC codewords
const numECCodewords = 10;

// Generate EC codewords
const rs = new ReedSolomon(numECCodewords);
const ecCodewords = rs.encode(dataCodewords);

console.log(
	"EC codewords generados:",
	ecCodewords
		.map((c) => c.toString(16).toUpperCase().padStart(2, "0"))
		.join(" "),
);

// Our expected EC codewords
const expectedEC = [0xa5, 0x24, 0xd4, 0xc1, 0xed, 0x36, 0xc7, 0x87, 0x2c, 0x55];
console.log(
	"EC codewords esperados:",
	expectedEC
		.map((c) => c.toString(16).toUpperCase().padStart(2, "0"))
		.join(" "),
);

// Compare
let match = true;
for (let i = 0; i < numECCodewords; i++) {
	if (ecCodewords[i] !== expectedEC[i]) {
		match = false;
		console.log(
			`  Byte ${i}: generado=0x${ecCodewords[i].toString(16).toUpperCase()}, esperado=0x${expectedEC[i].toString(16).toUpperCase()} ✗`,
		);
	}
}

if (match) {
	console.log("\n✓ EC codewords coinciden!");
} else {
	console.log("\n✗ EC codewords NO coinciden!");
}

// También verificar que jsqr pueda decodificar modo numérico correctamente
// Creando un QR simple manualmente
console.log("\n=== Test: ¿jsqr puede decodificar modo numérico? ===");

// Importar lo necesario
const jsQR = require("jsqr");
const { createCanvas } = require("canvas");

// Generar nuestro QR completo
const { FinderPattern } = require("../dist/patterns/FinderPattern.js");
const { TimingPattern } = require("../dist/patterns/TimingPattern.js");
const { AlignmentPattern } = require("../dist/patterns/AlignmentPattern.js");
const { FormatInfo } = require("../dist/patterns/FormatInfo.js");
const { MaskEvaluator } = require("../dist/mask/MaskEvaluator.js");

const size = 21;
const version = 1;

const matrix = Array.from({ length: size }, () => Array(size).fill(0));
const reserved = Array.from({ length: size }, () => Array(size).fill(0));

FinderPattern.draw(matrix, reserved);
TimingPattern.draw(matrix, reserved);
AlignmentPattern.draw(matrix, reserved, version);
FormatInfo.reserveFormatArea(reserved, size);

// All codewords
const allCodewords = [...dataCodewords, ...ecCodewords];
console.log(
	"\nAll codewords:",
	allCodewords
		.map((c) => c.toString(16).toUpperCase().padStart(2, "0"))
		.join(" "),
);

// Convert to bits
const bits = [];
for (const cw of allCodewords) {
	for (let i = 7; i >= 0; i--) {
		bits.push((cw >> i) & 1);
	}
}

// Place data with zigzag
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

			matrix[row][col] = bits[bitIndex];
			bitIndex++;
		}
	}

	right -= 2;
}

// Apply mask (let's try mask 0)
const mask = 0;
MaskEvaluator.apply(matrix, reserved, mask);

// Add format info for error level M (01) and mask 0 (000)
// Format: EC level (2 bits) + mask (3 bits) = 01 000 = 0x08
// Then BCH error correction and XOR with 101010000010010
FormatInfo.drawFormat(matrix, reserved, "M", mask);

// Convert to image
const moduleSize = 4;
const border = 4;
const canvasSize = (size + border * 2) * moduleSize;
const canvas = createCanvas(canvasSize, canvasSize);
const ctx = canvas.getContext("2d");

ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvasSize, canvasSize);

ctx.fillStyle = "black";
for (let r = 0; r < size; r++) {
	for (let c = 0; c < size; c++) {
		if (matrix[r][c] === 1) {
			ctx.fillRect(
				(border + c) * moduleSize,
				(border + r) * moduleSize,
				moduleSize,
				moduleSize,
			);
		}
	}
}

// Try to decode
const imageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
const decoded = jsQR(imageData.data, canvasSize, canvasSize);

if (decoded) {
	console.log(`\n✓ jsqr decodificó: "${decoded.data}"`);
} else {
	console.log(`\n✗ jsqr NO pudo decodificar`);

	// Try with different masks
	console.log("\nProbando con diferentes máscaras...");
	for (let testMask = 0; testMask < 8; testMask++) {
		// Reset matrix
		const testMatrix = Array.from({ length: size }, () => Array(size).fill(0));
		const testReserved = Array.from({ length: size }, () =>
			Array(size).fill(0),
		);

		FinderPattern.draw(testMatrix, testReserved);
		TimingPattern.draw(testMatrix, testReserved);
		AlignmentPattern.draw(testMatrix, testReserved, version);
		FormatInfo.reserveFormatArea(testReserved, size);

		// Place data
		let idx = 0;
		let r = size - 1;
		while (r >= 0 && idx < bits.length) {
			if (r === 6) {
				r--;
				continue;
			}
			const dirIdx = Math.floor((size - 1 - r) / 2);
			const up = dirIdx % 2 === 0;
			for (let v = 0; v < size; v++) {
				const row = up ? size - 1 - v : v;
				for (let h = 0; h < 2; h++) {
					const col = r - h;
					if (col < 0) continue;
					if (testReserved[row][col] !== 0) continue;
					if (idx >= bits.length) continue;
					testMatrix[row][col] = bits[idx];
					idx++;
				}
			}
			r -= 2;
		}

		MaskEvaluator.apply(testMatrix, testReserved, testMask);
		FormatInfo.drawFormat(testMatrix, testReserved, "M", testMask);

		// Convert to image
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, canvasSize, canvasSize);
		ctx.fillStyle = "black";
		for (let row = 0; row < size; row++) {
			for (let col = 0; col < size; col++) {
				if (testMatrix[row][col] === 1) {
					ctx.fillRect(
						(border + col) * moduleSize,
						(border + row) * moduleSize,
						moduleSize,
						moduleSize,
					);
				}
			}
		}

		const testImageData = ctx.getImageData(0, 0, canvasSize, canvasSize);
		const testDecoded = jsQR(testImageData.data, canvasSize, canvasSize);

		if (testDecoded) {
			console.log(
				`  Máscara ${testMask}: ✓ Decodificado = "${testDecoded.data}"`,
			);
		} else {
			console.log(`  Máscara ${testMask}: ✗ No decodificado`);
		}
	}
}
