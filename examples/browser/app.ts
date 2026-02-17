/**
 * @fileoverview Demo interactiva del generador de QR
 * @description Este archivo usa imports desde src/ directamente usando Vite
 */

import { QRCode, CanvasRenderer, SVGRenderer } from "../../src/index.ts";
import type {
	ErrorCorrectionLevel,
	QRCodeResult,
} from "../../src/types/index.ts";

// Elementos del DOM
const contentInput = document.getElementById("content") as HTMLTextAreaElement;
const errorLevelSelect = document.getElementById(
	"errorLevel",
) as HTMLSelectElement;
const renderModeSelect = document.getElementById(
	"renderMode",
) as HTMLSelectElement;
const sizeInput = document.getElementById("size") as HTMLInputElement;
const darkColorInput = document.getElementById("darkColor") as HTMLInputElement;
const lightColorInput = document.getElementById(
	"lightColor",
) as HTMLInputElement;

const canvas = document.getElementById("qrCanvas") as HTMLCanvasElement;
const svgContainer = document.getElementById("qrSvg") as HTMLDivElement;

const infoVersion = document.getElementById("infoVersion") as HTMLSpanElement;
const infoMode = document.getElementById("infoMode") as HTMLSpanElement;
const infoSize = document.getElementById("infoSize") as HTMLSpanElement;
const infoMask = document.getElementById("infoMask") as HTMLSpanElement;

const downloadPngBtn = document.getElementById(
	"downloadPng",
) as HTMLButtonElement;
const downloadSvgBtn = document.getElementById(
	"downloadSvg",
) as HTMLButtonElement;

let currentResult: QRCodeResult | null = null;

/**
 * Genera y renderiza el código QR
 */
function generateQR(): void {
	const content = contentInput.value;

	if (!content) {
		clearOutput();
		return;
	}

	try {
		const errorLevel = errorLevelSelect.value as ErrorCorrectionLevel;
		const size = parseInt(sizeInput.value, 10);
		const darkColor = darkColorInput.value;
		const lightColor = lightColorInput.value;
		const renderMode = renderModeSelect.value;

		// Generar QR
		const qr = new QRCode(content, {
			errorCorrectionLevel: errorLevel,
		});
		currentResult = qr.generate();

		// Actualizar info
		infoVersion.textContent = currentResult.version.toString();
		infoMode.textContent = currentResult.mode;
		infoSize.textContent = `${currentResult.size}×${currentResult.size}`;
		infoMask.textContent = currentResult.maskPattern.toString();

		// Calcular scale a partir del tamaño deseado
		const margin = 2;
		const scale = Math.floor(size / (currentResult.size + margin * 2));

		// Renderizar según el modo seleccionado
		const renderOptions = {
			scale,
			margin,
			darkColor,
			lightColor,
		};

		if (renderMode === "canvas") {
			canvas.style.display = "block";
			svgContainer.style.display = "none";
			CanvasRenderer.render(canvas, currentResult.matrix, renderOptions);
		} else {
			canvas.style.display = "none";
			svgContainer.style.display = "block";
			const svg = SVGRenderer.render(currentResult.matrix, renderOptions);
			svgContainer.innerHTML = svg;
		}
	} catch (error) {
		console.error("Error generando QR:", error);
		clearOutput();
	}
}

/**
 * Limpia la salida
 */
function clearOutput(): void {
	const ctx = canvas.getContext("2d");
	if (ctx) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
	svgContainer.innerHTML = "";
	infoVersion.textContent = "-";
	infoMode.textContent = "-";
	infoSize.textContent = "-";
	infoMask.textContent = "-";
	currentResult = null;
}

/**
 * Descarga el QR como PNG
 */
function downloadPng(): void {
	if (!currentResult) return;

	const size = parseInt(sizeInput.value, 10);
	const darkColor = darkColorInput.value;
	const lightColor = lightColorInput.value;
	const margin = 2;
	const scale = Math.floor(size / (currentResult.size + margin * 2));

	const dataUrl = CanvasRenderer.toDataURL(currentResult.matrix, {
		scale,
		margin,
		darkColor,
		lightColor,
	});

	const link = document.createElement("a");
	link.download = "qrcode.png";
	link.href = dataUrl;
	link.click();
}

/**
 * Descarga el QR como SVG
 */
function downloadSvg(): void {
	if (!currentResult) return;

	const size = parseInt(sizeInput.value, 10);
	const darkColor = darkColorInput.value;
	const lightColor = lightColorInput.value;
	const margin = 2;
	const scale = Math.floor(size / (currentResult.size + margin * 2));

	const svg = SVGRenderer.render(currentResult.matrix, {
		scale,
		margin,
		darkColor,
		lightColor,
		xmlDeclaration: true,
	});

	const blob = new Blob([svg], { type: "image/svg+xml" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.download = "qrcode.svg";
	link.href = url;
	link.click();
	URL.revokeObjectURL(url);
}

// Event listeners
contentInput.addEventListener("input", generateQR);
errorLevelSelect.addEventListener("change", generateQR);
renderModeSelect.addEventListener("change", generateQR);
sizeInput.addEventListener("input", generateQR);
darkColorInput.addEventListener("input", generateQR);
lightColorInput.addEventListener("input", generateQR);

downloadPngBtn.addEventListener("click", downloadPng);
downloadSvgBtn.addEventListener("click", downloadSvg);

// Generar QR inicial
generateQR();
