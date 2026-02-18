#!/usr/bin/env node
/**
 * @fileoverview Suite de tests E2E - Verifica que los QR generados sean legibles
 * @description Ejecutar con: node e2e-test.js [--count=N] [--seed=N] [--verbose]
 */

const { createCanvas } = require("canvas");
const jsQR = require("jsqr");
const { QRCode } = require("../dist/index.js");

// Parse CLI arguments
const args = process.argv.slice(2);
const getArg = (name, defaultVal) => {
	const arg = args.find((a) => a.startsWith(`--${name}=`));
	return arg ? arg.split("=")[1] : defaultVal;
};
const TEST_COUNT = parseInt(getArg("count", "20"), 10);
const TEST_SEED = parseInt(getArg("seed", Date.now().toString()), 10);
const VERBOSE = args.includes("--verbose");

// Simple seeded random
let seed = TEST_SEED;
function random() {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
}

function randomInt(min, max) {
	return Math.floor(random() * (max - min + 1)) + min;
}

// Character sets
const NUMERIC = "0123456789";
const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

function generateTestData(type, minLen, maxLen) {
	const length = randomInt(minLen, maxLen);
	const chars = type === "numeric" ? NUMERIC : ALPHANUMERIC;
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars[randomInt(0, chars.length - 1)];
	}
	return result;
}

// Generate QR matrix using our library
function generateOurQR(text, options = {}) {
	try {
		const qr = new QRCode(text, options);
		const result = qr.generate();
		return result.matrix;
	} catch (e) {
		return null;
	}
}

// Render matrix to canvas for jsQR
function renderMatrix(matrix, scale = 4) {
	const size = matrix.length;
	const canvasSize = size * scale;
	const canvas = createCanvas(canvasSize, canvasSize);
	const ctx = canvas.getContext("2d");

	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, canvasSize, canvasSize);

	ctx.fillStyle = "#000000";
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			if (matrix[row][col]) {
				ctx.fillRect(col * scale, row * scale, scale, scale);
			}
		}
	}

	return ctx.getImageData(0, 0, canvasSize, canvasSize);
}

// Decode QR using jsQR
function decodeQR(matrix) {
	const imageData = renderMatrix(matrix);
	const code = jsQR(imageData.data, imageData.width, imageData.height);
	return code ? code.data : null;
}

// Test results tracking
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
	try {
		fn();
		passed++;
		if (VERBOSE) console.log(`  \x1b[32m✓\x1b[0m ${name}`);
	} catch (e) {
		failed++;
		failures.push({ name, error: e.message });
		console.log(`  \x1b[31m✗\x1b[0m ${name}`);
		if (VERBOSE) console.log(`    ${e.message}`);
	}
}

function assert(condition, message) {
	if (!condition) throw new Error(message || "Assertion failed");
}

function assertEqual(actual, expected, message) {
	if (actual !== expected) {
		throw new Error(message || `Expected ${expected}, got ${actual}`);
	}
}

// ============================================================================
// TEST SUITES
// ============================================================================

console.log("\n\x1b[1mQR Code Readability Tests\x1b[0m");
console.log(`Seed: ${TEST_SEED}, Count: ${TEST_COUNT}\n`);

// Fixed decoding tests
console.log("\x1b[36mFixed Data\x1b[0m");
const levels = ["L", "M", "Q", "H"];
const fixedTexts = ["A", "HELLO", "12345", "HTTPS://EXAMPLE.COM"];

for (const level of levels) {
	for (const text of fixedTexts) {
		test(`Level ${level}: "${text.substring(0, 15)}"`, () => {
			const matrix = generateOurQR(text, { errorCorrectionLevel: level });
			assert(matrix !== null, "Failed to generate QR");
			const decoded = decodeQR(matrix);
			assertEqual(decoded, text, `Decoded: "${decoded}"`);
		});
	}
}

// Random data tests
console.log("\n\x1b[36mRandom Data Tests\x1b[0m");
for (let i = 0; i < TEST_COUNT; i++) {
	const level = levels[i % 4];
	const type = i % 2 === 0 ? "alphanumeric" : "numeric";
	const text = generateTestData(type, 5, 30);

	test(`Random #${i + 1} (${level}, ${type}): "${text.substring(0, 15)}..."`, () => {
		const matrix = generateOurQR(text, { errorCorrectionLevel: level });
		assert(matrix !== null, "Failed to generate QR");
		const decoded = decodeQR(matrix);
		assertEqual(decoded, text, `Decoded: "${decoded}"`);
	});
}

// Edge cases
console.log("\n\x1b[36mEdge Cases\x1b[0m");
const edgeCases = [
	["Single char", "A"],
	["All numeric", "1234567890"],
	["Max alphanumeric chars", "ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:"],
	["URL", "HTTPS://GITHUB.COM/USER/REPO"],
	["Spaces", "HELLO WORLD TEST"],
];

for (const [name, text] of edgeCases) {
	test(name, () => {
		const matrix = generateOurQR(text, { errorCorrectionLevel: "M" });
		assert(matrix !== null, "Failed to generate QR");
		const decoded = decodeQR(matrix);
		assertEqual(decoded, text);
	});
}

// ============================================================================
// RESULTS
// ============================================================================

console.log("\n" + "=".repeat(50));
console.log(`\x1b[1mResults:\x1b[0m ${passed} passed, ${failed} failed`);

if (failures.length > 0) {
	console.log("\n\x1b[31mFailures:\x1b[0m");
	for (const f of failures) {
		console.log(`  - ${f.name}: ${f.error}`);
	}
}

console.log("");
process.exit(failed > 0 ? 1 : 0);
