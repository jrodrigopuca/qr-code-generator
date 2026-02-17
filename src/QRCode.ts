/**
 * @fileoverview Clase principal para generación de códigos QR
 * @description Orquesta todos los componentes para crear códigos QR completos.
 * @module QRCode
 * @see {@link https://www.thonky.com/qr-code-tutorial/}
 */

import type {
	QRVersion,
	ErrorCorrectionLevel,
	MaskPattern,
	QRCodeOptions,
	QRMatrix,
	QRCodeResult,
} from "./types";

import { ByteEncoder } from "./encoder";
import { ReedSolomon } from "./correction";
import {
	FinderPattern,
	AlignmentPattern,
	TimingPattern,
	FormatInfo,
} from "./patterns";
import { MaskEvaluator } from "./mask";
import { QRCodeError } from "./errors";
import {
	BYTE_CAPACITY,
	ECC_CODEWORDS_PER_BLOCK,
	BLOCK_CONFIG,
	REMAINDER_BITS,
	MODE_INDICATORS,
} from "./constants";

/** Opciones por defecto */
const DEFAULT_OPTIONS = {
	errorCorrectionLevel: "M" as const,
	version: "auto" as const,
	mask: "auto" as const,
	mode: "auto" as const,
};

/**
 * Clase principal para generar códigos QR.
 *
 * @description Implementa el proceso completo de generación de QR:
 * 1. Análisis de datos y selección de versión
 * 2. Codificación de datos (modo byte)
 * 3. Generación de códigos de corrección de errores
 * 4. Construcción de la matriz con patrones de función
 * 5. Colocación de datos y aplicación de máscara
 * 6. Añadir información de formato y versión
 *
 * @example
 * ```typescript
 * const qr = new QRCode('Hello, World!', { errorCorrectionLevel: 'H' });
 * const result = qr.generate();
 * console.log(result.matrix);
 * ```
 */
export class QRCode {
	/** Datos a codificar */
	private readonly data: string;

	/** Nivel de corrección de errores */
	private readonly errorLevel: ErrorCorrectionLevel;

	/** Versión del QR (1-40) */
	private version: QRVersion;

	/** Patrón de máscara actual */
	private mask: MaskPattern;

	/** Tamaño de la matriz */
	private size: number;

	/** Si la versión fue auto-detectada */
	private readonly autoVersion: boolean;

	/** Si la máscara fue auto-detectada */
	private readonly autoMask: boolean;

	/**
	 * Crea una nueva instancia de QRCode.
	 *
	 * @param data - Datos a codificar
	 * @param options - Opciones de configuración
	 * @throws {QRCodeError} Si los datos son inválidos o muy largos
	 *
	 * @example
	 * ```typescript
	 * const qr = new QRCode('https://example.com');
	 * const qrWithOptions = new QRCode('data', {
	 *   errorCorrectionLevel: 'H',
	 *   version: 5
	 * });
	 * ```
	 */
	constructor(data: string, options: QRCodeOptions = {}) {
		if (!data || data.length === 0) {
			throw new QRCodeError("DATA_EMPTY", "Los datos no pueden estar vacíos");
		}

		this.data = data;
		const opts = { ...DEFAULT_OPTIONS, ...options };

		this.errorLevel = opts.errorCorrectionLevel;
		this.autoVersion = opts.version === "auto";
		this.autoMask = opts.mask === "auto";

		// Determinar versión
		if (this.autoVersion) {
			this.version = this.findMinVersion();
		} else {
			this.version = opts.version as QRVersion;
			this.validateVersion();
		}

		this.size = this.calculateSize(this.version);
		this.mask = this.autoMask ? 0 : (opts.mask as MaskPattern);
	}

	/**
	 * Genera el código QR completo.
	 *
	 * @returns Resultado con la matriz y metadatos
	 *
	 * @example
	 * ```typescript
	 * const result = qr.generate();
	 * console.log(`Versión: ${result.version}`);
	 * console.log(`Tamaño: ${result.size}x${result.size}`);
	 * ```
	 */
	generate(): QRCodeResult {
		// 1. Codificar datos
		const dataCodewords = this.encodeData();

		// 2. Generar códigos de corrección de errores
		const allCodewords = this.generateErrorCorrection(dataCodewords);

		// 3. Crear matriz y colocar patrones de función
		const matrix = this.createMatrix();
		const reserved = this.createMatrix();

		this.placePatterns(matrix, reserved);

		// 4. Colocar datos en la matriz
		this.placeData(matrix, reserved, allCodewords);

		// 5. Encontrar y aplicar mejor máscara
		if (this.autoMask) {
			this.mask = MaskEvaluator.findBestMask(matrix, reserved);
		}
		MaskEvaluator.apply(matrix, reserved, this.mask);

		// 6. Colocar información de formato y versión
		FormatInfo.drawFormat(matrix, reserved, this.errorLevel, this.mask);
		FormatInfo.drawVersion(matrix, reserved, this.version);

		return {
			matrix: matrix as QRMatrix,
			version: this.version,
			size: this.size,
			errorCorrectionLevel: this.errorLevel,
			maskPattern: this.mask,
		};
	}

	/**
	 * Encuentra la versión mínima que puede contener los datos.
	 *
	 * @returns Versión mínima necesaria
	 * @throws {QRCodeError} Si los datos son muy largos
	 *
	 * @internal
	 */
	private findMinVersion(): QRVersion {
		const encoder = new ByteEncoder();
		const dataLength = encoder.encodeUTF8(this.data).length;

		for (let v = 1; v <= 40; v++) {
			const capacity = BYTE_CAPACITY[v - 1][this.errorLevel];
			if (capacity >= dataLength) {
				return v as QRVersion;
			}
		}

		throw new QRCodeError(
			"DATA_TOO_LONG",
			`Los datos son demasiado largos para cualquier versión QR con nivel ${this.errorLevel}`,
		);
	}

	/**
	 * Valida que la versión especificada puede contener los datos.
	 *
	 * @throws {QRCodeError} Si los datos exceden la capacidad
	 *
	 * @internal
	 */
	private validateVersion(): void {
		const encoder = new ByteEncoder();
		const dataLength = encoder.encodeUTF8(this.data).length;
		const capacity = BYTE_CAPACITY[this.version - 1][this.errorLevel];

		if (dataLength > capacity) {
			throw new QRCodeError(
				"VERSION_TOO_SMALL",
				`La versión ${this.version} con nivel ${this.errorLevel} solo puede contener ${capacity} bytes, pero los datos tienen ${dataLength} bytes`,
			);
		}
	}

	/**
	 * Calcula el tamaño de la matriz para una versión.
	 *
	 * @param version - Versión del QR
	 * @returns Tamaño en módulos (21 + (v-1)*4)
	 *
	 * @internal
	 */
	private calculateSize(version: QRVersion): number {
		return 21 + (version - 1) * 4;
	}

	/**
	 * Crea una matriz vacía del tamaño correcto.
	 *
	 * @returns Matriz 2D inicializada en 0
	 *
	 * @internal
	 */
	private createMatrix(): number[][] {
		return Array.from({ length: this.size }, () => Array(this.size).fill(0));
	}

	/**
	 * Codifica los datos en codewords.
	 *
	 * @returns Array de codewords de datos
	 *
	 * @internal
	 */
	private encodeData(): number[] {
		const encoder = new ByteEncoder();
		const bytes = encoder.encodeUTF8(this.data);

		// Calcular capacidad de datos
		const eccCodewords =
			ECC_CODEWORDS_PER_BLOCK[this.version - 1][this.errorLevel];
		const blockConfig = BLOCK_CONFIG[this.version - 1][this.errorLevel];

		const [g1Blocks, g1DataCw, g2Blocks, g2DataCw] = blockConfig;
		const totalDataCodewords = g1Blocks * g1DataCw + g2Blocks * g2DataCw;

		// Construir el flujo de bits
		const bits: number[] = [];

		// Indicador de modo (byte = 0100)
		const modeIndicator = parseInt(MODE_INDICATORS.byte, 2);
		for (let i = 3; i >= 0; i--) {
			bits.push((modeIndicator >> i) & 1);
		}

		// Indicador de longitud de caracteres
		const charCountBits = encoder.getCharacterCountBits(this.version);
		for (let i = charCountBits - 1; i >= 0; i--) {
			bits.push((bytes.length >> i) & 1);
		}

		// Datos
		for (let b = 0; b < bytes.length; b++) {
			const byteVal = bytes[b];
			for (let i = 7; i >= 0; i--) {
				bits.push((byteVal >> i) & 1);
			}
		}

		// Terminador (hasta 4 bits de 0)
		const terminatorLength = Math.min(4, totalDataCodewords * 8 - bits.length);
		for (let i = 0; i < terminatorLength; i++) {
			bits.push(0);
		}

		// Padding a múltiplo de 8
		while (bits.length % 8 !== 0) {
			bits.push(0);
		}

		// Palabras de relleno alternantes (236, 17)
		const padBytes = [236, 17];
		let padIndex = 0;
		while (bits.length < totalDataCodewords * 8) {
			const pad = padBytes[padIndex % 2];
			for (let i = 7; i >= 0; i--) {
				bits.push((pad >> i) & 1);
			}
			padIndex++;
		}

		// Convertir bits a codewords
		const codewords: number[] = [];
		for (let i = 0; i < bits.length; i += 8) {
			let byte = 0;
			for (let j = 0; j < 8; j++) {
				byte = (byte << 1) | bits[i + j];
			}
			codewords.push(byte);
		}

		return codewords;
	}

	/**
	 * Genera los códigos de corrección de errores.
	 *
	 * @param dataCodewords - Codewords de datos
	 * @returns Todos los codewords (datos + ECC) intercalados
	 *
	 * @internal
	 */
	private generateErrorCorrection(dataCodewords: number[]): number[] {
		const eccCodewords =
			ECC_CODEWORDS_PER_BLOCK[this.version - 1][this.errorLevel];
		const blockConfig = BLOCK_CONFIG[this.version - 1][this.errorLevel];
		const [g1Blocks, g1DataCw, g2Blocks, g2DataCw] = blockConfig;

		const dataBlocks: number[][] = [];
		const eccBlocks: number[][] = [];
		let offset = 0;

		// Crear instancia del codificador Reed-Solomon
		const rsEncoder = new ReedSolomon(eccCodewords);

		// Grupo 1
		for (let i = 0; i < g1Blocks; i++) {
			const block = dataCodewords.slice(offset, offset + g1DataCw);
			dataBlocks.push(block);
			eccBlocks.push(rsEncoder.encode(block));
			offset += g1DataCw;
		}

		// Grupo 2
		for (let i = 0; i < g2Blocks; i++) {
			const block = dataCodewords.slice(offset, offset + g2DataCw);
			dataBlocks.push(block);
			eccBlocks.push(rsEncoder.encode(block));
			offset += g2DataCw;
		}

		// Intercalar codewords de datos
		const interleaved: number[] = [];
		const maxDataLength = Math.max(g1DataCw, g2DataCw);

		for (let i = 0; i < maxDataLength; i++) {
			for (const block of dataBlocks) {
				if (i < block.length) {
					interleaved.push(block[i]);
				}
			}
		}

		// Intercalar codewords de ECC
		for (let i = 0; i < eccCodewords; i++) {
			for (const block of eccBlocks) {
				interleaved.push(block[i]);
			}
		}

		return interleaved;
	}

	/**
	 * Coloca todos los patrones de función en la matriz.
	 *
	 * @param matrix - Matriz del QR
	 * @param reserved - Matriz de reserva
	 *
	 * @internal
	 */
	private placePatterns(matrix: number[][], reserved: number[][]): void {
		// Finder patterns y separadores
		FinderPattern.draw(matrix, reserved);

		// Timing patterns
		TimingPattern.draw(matrix, reserved);

		// Alignment patterns (versión >= 2)
		AlignmentPattern.draw(matrix, reserved, this.version);

		// Reservar área para información de formato
		FormatInfo.reserveFormatArea(reserved, this.size);

		// Reservar área para información de versión (versión >= 7)
		FormatInfo.reserveVersionArea(reserved, this.version, this.size);
	}

	/**
	 * Coloca los datos en la matriz siguiendo el patrón zigzag.
	 *
	 * @param matrix - Matriz del QR
	 * @param reserved - Matriz de reserva
	 * @param codewords - Codewords a colocar
	 *
	 * @internal
	 */
	private placeData(
		matrix: number[][],
		reserved: number[][],
		codewords: number[],
	): void {
		// Convertir codewords a bits
		const bits: number[] = [];
		for (const cw of codewords) {
			for (let i = 7; i >= 0; i--) {
				bits.push((cw >> i) & 1);
			}
		}

		// Añadir bits de resto si es necesario
		const remainder = REMAINDER_BITS[this.version - 1];
		for (let i = 0; i < remainder; i++) {
			bits.push(0);
		}

		// Colocar bits en patrón zigzag
		let bitIndex = 0;
		let right = this.size - 1;

		while (right >= 0 && bitIndex < bits.length) {
			// Skip columna 6 (timing pattern vertical)
			if (right === 6) {
				right--;
				continue;
			}

			// Procesar columna doble de abajo hacia arriba y viceversa
			for (let vert = 0; vert < this.size; vert++) {
				// Alternar dirección
				const row =
					Math.floor((this.size - 1 - right) / 2) % 2 === 0
						? this.size - 1 - vert
						: vert;

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
	}

	/**
	 * Obtiene la versión del QR.
	 *
	 * @returns Versión (1-40)
	 */
	getVersion(): QRVersion {
		return this.version;
	}

	/**
	 * Obtiene el nivel de corrección de errores.
	 *
	 * @returns Nivel de corrección
	 */
	getErrorCorrectionLevel(): ErrorCorrectionLevel {
		return this.errorLevel;
	}

	/**
	 * Obtiene el tamaño de la matriz.
	 *
	 * @returns Tamaño en módulos
	 */
	getSize(): number {
		return this.size;
	}
}
