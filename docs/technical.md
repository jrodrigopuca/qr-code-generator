# QR Code Generator — Documentación Técnica

## Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Módulos del Sistema](#módulos-del-sistema)
4. [Algoritmos Implementados](#algoritmos-implementados)
5. [Flujo de Datos](#flujo-de-datos)
6. [API Pública](#api-pública)
7. [Testing](#testing)
8. [Build y Distribución](#build-y-distribución)
9. [Referencias](#referencias)

---

## Descripción General

**qr-pure** es un generador de códigos QR desarrollado desde cero en TypeScript, sin dependencias externas para la generación del QR. Implementa el estándar ISO/IEC 18004 y se distribuye como paquete npm con soporte dual CJS/ESM.

### Características

| Característica                                  | Estado          |
| ----------------------------------------------- | --------------- |
| Versiones 1-40                                  | ✅ Implementado |
| Niveles de corrección L/M/Q/H                   | ✅ Implementado |
| Modo Numeric                                    | ✅ Implementado |
| Modo Alphanumeric                               | ✅ Implementado |
| Modo Byte                                       | ✅ Implementado |
| Detección automática de modo                    | ✅ Implementado |
| Selección automática de versión                 | ✅ Implementado |
| Selección automática de máscara                 | ✅ Implementado |
| 8 patrones de máscara + scoring                 | ✅ Implementado |
| Corrección de errores Reed-Solomon              | ✅ Implementado |
| Patrones de función (Finder, Alignment, Timing) | ✅ Implementado |
| Información de formato y versión                | ✅ Implementado |
| Renderer Canvas                                 | ✅ Implementado |
| Renderer SVG (con formas de módulo)             | ✅ Implementado |
| Renderer Terminal (ASCII/Unicode)               | ✅ Implementado |
| Custom errors tipados                           | ✅ Implementado |
| Build dual CJS + ESM                            | ✅ Implementado |
| Modo Kanji                                      | ❌ Pendiente    |

---

## Arquitectura del Proyecto

```
qr-code-generator/
├── src/
│   ├── index.ts              # Entry point — exports y helper functions
│   ├── QRCode.ts             # Clase principal — orquesta la generación
│   ├── errors.ts             # QRCodeError con códigos tipados
│   ├── types/
│   │   └── index.ts          # Tipos e interfaces del sistema
│   ├── encoder/
│   │   ├── index.ts          # Re-exports
│   │   ├── BaseEncoder.ts    # Clase base abstracta
│   │   ├── ByteEncoder.ts    # Modo Byte (8 bits/char)
│   │   ├── NumericEncoder.ts # Modo Numérico (10 bits/3 dígitos)
│   │   ├── AlphanumericEncoder.ts  # Modo Alfanumérico (11 bits/2 chars)
│   │   └── ModeDetector.ts   # Detección automática del modo óptimo
│   ├── correction/
│   │   ├── index.ts
│   │   ├── GaloisField.ts    # Aritmética GF(2^8)
│   │   └── ReedSolomon.ts    # Codificación Reed-Solomon
│   ├── patterns/
│   │   ├── index.ts
│   │   ├── FinderPattern.ts      # Patrones de búsqueda 7x7
│   │   ├── AlignmentPattern.ts   # Patrones de alineación 5x5
│   │   ├── TimingPattern.ts      # Líneas de sincronización
│   │   └── FormatInfo.ts         # Info de formato y versión
│   ├── mask/
│   │   ├── index.ts
│   │   └── MaskEvaluator.ts  # 8 máscaras + scoring de penalización
│   ├── renderer/
│   │   ├── index.ts
│   │   ├── CanvasRenderer.ts     # HTML5 Canvas (render, toDataURL, toBlob)
│   │   ├── SVGRenderer.ts        # SVG (paths optimizados, moduleShape)
│   │   └── TerminalRenderer.ts   # Terminal (unicode, compact, ascii)
│   ├── constants/
│   │   ├── index.ts
│   │   ├── capacity.ts       # Tablas de capacidad por versión/nivel
│   │   ├── correction.ts     # Config de bloques y ECC por versión
│   │   ├── alignment.ts      # Posiciones de patrones de alineación
│   │   ├── format.ts         # Cadenas de formato y versión
│   │   └── galois.ts         # Tablas log/antilog GF(2^8)
│   └── utils/
│       ├── index.ts
│       └── binary.ts         # Utilidades de conversión binaria
├── tests/
│   ├── unit/                 # Tests unitarios (vitest)
│   │   ├── encoder.test.ts
│   │   ├── galois-field.test.ts
│   │   ├── reed-solomon.test.ts
│   │   ├── mask.test.ts
│   │   ├── matrix-structure.test.ts
│   │   ├── codewords.test.ts
│   │   ├── binary.test.ts
│   │   ├── svg-renderer.test.ts
│   │   ├── canvas-renderer.test.ts
│   │   └── terminal-renderer.test.ts
│   └── integration/
│       └── qr-generation.test.ts
├── e2e-tests/                # Tests E2E con jsQR (proyecto separado)
│   ├── e2e-test.js
│   └── package.json
├── demo/
│   ├── browser/              # Demo interactiva con Vite
│   │   ├── index.html
│   │   ├── app.ts
│   │   └── style.css
│   └── node/
│       └── basic.ts          # Script de ejemplo para Node.js
├── docs/
│   ├── technical.md          # Este documento
│   └── roadmap.md            # Roadmap del proyecto
├── tsconfig.json
├── tsup.config.ts            # Build config (CJS + ESM)
├── vitest.config.ts          # Test config con coverage
├── eslint.config.mjs
└── package.json
```

### Stack tecnológico

| Herramienta       | Uso                                              |
| ----------------- | ------------------------------------------------ |
| TypeScript 5.7+   | Lenguaje principal                               |
| tsup              | Build dual CJS + ESM con tipos y sourcemaps      |
| Vitest            | Unit/integration testing con coverage            |
| jsQR              | Verificación E2E (decodifica QR generados)       |
| ESLint + Prettier | Linting y formateo                               |
| GitHub Actions    | CI (typecheck, lint, test, coverage, build, E2E) |

---

## Módulos del Sistema

### QRCode (`src/QRCode.ts`)

Clase principal que orquesta todo el proceso de generación. Recibe datos y opciones, coordina los demás módulos y retorna la matriz final.

```typescript
const qr = new QRCode("Hello World", {
	errorCorrectionLevel: "H", // L | M | Q | H (default: M)
	version: "auto", // 1-40 | "auto" (default: auto)
	mask: "auto", // 0-7 | "auto" (default: auto)
	mode: "auto", // numeric | alphanumeric | byte | auto
});

const result = qr.generate();
// → { matrix, version, size, mode, maskPattern }
```

### Encoders (`src/encoder/`)

Arquitectura basada en herencia con `BaseEncoder` como clase abstracta:

- **`ModeDetector`**: Analiza el contenido y selecciona el modo más eficiente
- **`NumericEncoder`**: Agrupa dígitos de 3 en 3, codifica en 10 bits
- **`AlphanumericEncoder`**: Agrupa pares de caracteres, codifica en 11 bits
- **`ByteEncoder`**: Codifica cada carácter como 8 bits ISO 8859-1

Cada encoder implementa `encode(data, version, errorLevel)` retornando los codewords finales con padding.

### Corrección de errores (`src/correction/`)

- **`GaloisField`**: Aritmética sobre GF(2^8) con polinomio primitivo `x^8 + x^4 + x^3 + x^2 + 1`. Tablas log/antilog precalculadas.
- **`ReedSolomon`**: Genera polinomio generador de grado _n_, ejecuta la división polinomial y retorna los codewords de corrección.

```typescript
const rs = new ReedSolomon(10); // 10 codewords de ECC
const ecc = rs.encode([32, 91, 11]); // → number[]
```

### Patrones de función (`src/patterns/`)

Clases estáticas que colocan los patrones requeridos por el estándar:

| Clase              | Función                                       |
| ------------------ | --------------------------------------------- |
| `FinderPattern`    | 3 cuadrados 7×7 en esquinas + separadores     |
| `AlignmentPattern` | Patrones 5×5 según tabla de versión (v≥2)     |
| `TimingPattern`    | Líneas alternantes en fila 6 y columna 6      |
| `FormatInfo`       | 15 bits de formato + 18 bits de versión (v≥7) |

### Máscaras (`src/mask/`)

**`MaskEvaluator`** implementa las 8 funciones de máscara del estándar y el algoritmo de selección automática con 4 reglas de penalización:

| Regla | Penalización                                      |
| ----- | ------------------------------------------------- |
| N1    | Grupos de 5+ módulos consecutivos del mismo color |
| N2    | Bloques 2×2 del mismo color                       |
| N3    | Patrones similares a finders (1:1:3:1:1)          |
| N4    | Desviación de la proporción 50/50 oscuro/claro    |

```typescript
const bestMask = MaskEvaluator.findBestMask(matrix, reserved);
MaskEvaluator.apply(matrix, reserved, bestMask);
```

### Renderers (`src/renderer/`)

Tres renderers independientes, todos con métodos estáticos:

#### CanvasRenderer

Renderiza en HTML5 Canvas. Métodos: `render()`, `toDataURL()`, `toBlob()`.

```typescript
CanvasRenderer.render(canvas, matrix, { scale: 10, margin: 4 });
const dataUrl = await CanvasRenderer.toDataURL(matrix);
const blob = await CanvasRenderer.toBlob(matrix);
```

#### SVGRenderer

Genera markup SVG como string. Soporta paths optimizados (fusiona módulos adyacentes horizontalmente) y 4 formas de módulo:

```typescript
// Cuadrados estándar (paths optimizados)
SVGRenderer.render(matrix, { scale: 10 });

// Formas personalizadas
SVGRenderer.render(matrix, { moduleShape: "rounded", cornerRadius: 0.3 });
SVGRenderer.render(matrix, { moduleShape: "circle" });
SVGRenderer.render(matrix, { moduleShape: "dot" });
```

Tipo `ModuleShape`: `"square"` | `"rounded"` | `"circle"` | `"dot"`

#### TerminalRenderer

Genera texto para la consola con 3 estilos:

```typescript
// Unicode (bloques ██ / espacios) — mejor contraste
TerminalRenderer.render(matrix);

// Compact (medio bloque ▀▄█) — mitad de altura
TerminalRenderer.render(matrix, { style: "compact" });

// ASCII (## / espacios) — máxima compatibilidad
TerminalRenderer.render(matrix, { style: "ascii" });

// Invertido para terminales con fondo oscuro
TerminalRenderer.render(matrix, { style: "unicode", invert: true });
```

### Constantes (`src/constants/`)

Tablas centralizadas extraídas del estándar ISO/IEC 18004:

- **`capacity.ts`**: Capacidad de datos por versión, nivel y modo
- **`correction.ts`**: Configuración de bloques y codewords de ECC
- **`alignment.ts`**: Posiciones de patrones de alineación por versión
- **`format.ts`**: Cadenas BCH de formato (15 bits) y versión (18 bits)
- **`galois.ts`**: Tablas logaritmo/antilogaritmo para GF(2^8)

### Tipos (`src/types/index.ts`)

Tipos principales:

```typescript
type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type QRVersion = 1 | 2 | ... | 40;
type MaskPattern = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type EncodingMode = "numeric" | "alphanumeric" | "byte" | "kanji" | "auto";
type QRMatrix = number[][];

interface QRCodeOptions {
  errorCorrectionLevel?: ErrorCorrectionLevel;
  version?: QRVersion | "auto";
  mask?: MaskPattern | "auto";
  mode?: EncodingMode;
}

interface QRCodeResult {
  matrix: QRMatrix;
  version: QRVersion;
  size: number;
  mode: EncodingMode;
  maskPattern: MaskPattern;
}

interface RenderOptions {
  scale?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}
```

### Errores (`src/errors.ts`)

`QRCodeError` extiende `Error` con un `code` tipado:

```typescript
type QRErrorCode =
	| "DATA_EMPTY"
	| "DATA_TOO_LONG"
	| "INVALID_VERSION"
	| "INVALID_ERROR_LEVEL"
	| "INVALID_MASK"
	| "CANVAS_CONTEXT"
	| "ENCODING_ERROR";
```

---

## Algoritmos Implementados

### 1. Codificación de datos

```
Texto → Detección de modo → Encoding → Padding → Codewords
```

1. **Detección de modo** (`ModeDetector`): Determina si el input es numérico, alfanumérico o byte
2. **Mode Indicator**: 4 bits identificando el modo (`0001`, `0010`, `0100`)
3. **Character Count Indicator**: Longitud del mensaje (bits varían por versión y modo)
4. **Codificación**: Conversión según el modo seleccionado
5. **Padding**: Terminator + bit padding + pad codewords (`0xEC`, `0x11` alternados)

### 2. Reed-Solomon sobre GF(2^8)

El campo de Galois GF(2^8) usa el polinomio primitivo `0x11D` (x^8 + x^4 + x^3 + x^2 + 1):

1. **Generación del polinomio generador**: Producto de `(x - α^i)` para `i = 0..n-1`
2. **División polinomial**: El mensaje se divide por el generador
3. **Residuo**: Los coeficientes del residuo son los codewords de corrección

### 3. Interleaving

Los datos y codewords de ECC se entrelazan por bloques según la configuración de cada versión:

1. Dividir datos en grupos/bloques según `BLOCK_CONFIG`
2. Calcular ECC para cada bloque independientemente
3. Intercalar codewords de datos de todos los bloques
4. Intercalar codewords de ECC de todos los bloques
5. Agregar remainder bits según versión

### 4. Patrones de función

```
┌─────────┬──────────────────────────────────────────┐
│ Patrón  │ Descripción                              │
├─────────┼──────────────────────────────────────────┤
│ Finder  │ 3 cuadrados 7×7 en esquinas + separadores│
│ Align   │ Patrones 5×5 para versiones ≥2           │
│ Timing  │ Líneas alternantes en fila 6 y columna 6 │
│ Dark    │ Módulo siempre oscuro en (4×v+9, 8)      │
│ Format  │ 15 bits BCH cerca de finders             │
│ Version │ 18 bits BCH para versiones ≥7            │
└─────────┴──────────────────────────────────────────┘
```

### 5. Selección de máscara

Se evalúan las 8 máscaras con 4 reglas de penalización (N1-N4) y se selecciona la que minimiza la puntuación total. Esto es completamente automático cuando `mask: "auto"`.

### 6. Colocación de datos

Los bits se colocan en columnas de 2 módulos, zigzagueando de abajo hacia arriba y de derecha a izquierda, saltando áreas reservadas (patrones de función, formato, versión).

---

## Flujo de Datos

```
     Texto de entrada
              │
              ▼
     ┌────────────────────┐
     │ ModeDetector       │ ── Selecciona numeric / alphanumeric / byte
     └────────┬───────────┘
              │
              ▼
     ┌────────────────────┐
     │ QRCode.generate()  │ ── Selecciona versión óptima (auto) y nivel ECC
     └────────┬───────────┘
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
┌──────────────┐   ┌───────────────┐
│   Encoder    │   │   Patterns    │
│              │   │               │
│ - encode()   │   │ - Finder      │
│ - padding    │   │ - Alignment   │
│ - codewords  │   │ - Timing      │
└──────┬───────┘   │ - Dark module │
       │           └──────┬────────┘
       ▼                  │
┌──────────────┐          │
│ ReedSolomon  │          │
│              │          │
│ - ECC blocks │          │
│ - interleave │          │
└──────┬───────┘          │
       │                  │
       └────────┬─────────┘
                │
                ▼
         ┌──────────┐
         │ loadData │ ── Coloca bits en zigzag
         └────┬─────┘
              │
              ▼
       ┌─────────────┐
       │ MaskEvaluator│ ── Evalúa 8 máscaras, aplica la mejor
       └──────┬──────┘
              │
              ▼
       ┌──────────┐
       │FormatInfo│ ── Añade formato (15 bits) y versión (18 bits)
       └────┬─────┘
            │
            ▼
    Matriz QR final (number[][])
            │
     ┌──────┼──────────┐
     ▼      ▼          ▼
  Canvas   SVG     Terminal
```

---

## API Pública

### Helper functions

```typescript
import {
	generateQR,
	renderToCanvas,
	renderToSVG,
	renderToTerminal,
} from "qr-pure";

// Generar solo la matriz
const { matrix, version, size, mode, maskPattern } = generateQR("Hello");

// Renderizar directamente
renderToCanvas(canvas, "Hello", { scale: 10, darkColor: "#1a1a1a" });
const svg = renderToSVG("Hello", { scale: 10, margin: 4 });
const text = renderToTerminal("Hello", { style: "compact" });
```

### Clase QRCode

```typescript
import { QRCode } from "qr-pure";

const qr = new QRCode("Hello World", {
	errorCorrectionLevel: "H",
	version: "auto",
	mask: "auto",
	mode: "auto",
});

const { matrix, version, size, mode, maskPattern } = qr.generate();
```

### Renderers

```typescript
import { CanvasRenderer, SVGRenderer, TerminalRenderer } from "qr-pure";

// Canvas
CanvasRenderer.render(canvas, matrix, { scale: 10, margin: 4 });
const dataUrl = await CanvasRenderer.toDataURL(matrix, { darkColor: "#333" });
const blob = await CanvasRenderer.toBlob(matrix);

// SVG
const svg = SVGRenderer.render(matrix, {
	moduleShape: "rounded",
	cornerRadius: 0.3,
});

// Terminal
console.log(
	TerminalRenderer.render(matrix, { style: "compact", invert: true }),
);
```

### Módulos avanzados

Para uso avanzado, los módulos internos están exportados:

```typescript
import {
	// Encoders
	ByteEncoder,
	NumericEncoder,
	AlphanumericEncoder,
	ModeDetector,
	// Corrección de errores
	GaloisField,
	ReedSolomon,
	// Patrones
	FinderPattern,
	AlignmentPattern,
	TimingPattern,
	FormatInfo,
	// Máscara
	MaskEvaluator,
	// Constantes
	constants,
	// Utilidades
	toBinary,
	fromBinary,
	chunkString,
	// Tipos
	type QRCodeOptions,
	type QRMatrix,
	type QRCodeResult,
	type ErrorCorrectionLevel,
	type ModuleShape,
} from "qr-pure";
```

### Scripts npm

```bash
npm run build          # Build dual CJS + ESM (tsup)
npm run typecheck      # Verificación de tipos
npm run test           # Tests unitarios + integración
npm run test:coverage  # Tests con reporte de cobertura
npm run lint           # ESLint
npm run format         # Prettier
npm run demo:node      # Ejecutar demo Node.js
npm run demo:browser   # Iniciar demo browser (Vite)
```

---

## Testing

### Estructura de tests

| Archivo                     | Cobertura                                 | Tests |
| --------------------------- | ----------------------------------------- | ----- |
| `encoder.test.ts`           | Numeric, Alphanumeric, Byte, ModeDetector | ~40   |
| `galois-field.test.ts`      | Aritmética GF(2^8)                        | ~20   |
| `reed-solomon.test.ts`      | Codificación RS, polinomios generadores   | ~15   |
| `mask.test.ts`              | 8 patrones, scoring, selección automática | ~20   |
| `matrix-structure.test.ts`  | Finder, Alignment, Timing, FormatInfo     | ~30   |
| `codewords.test.ts`         | Interleaving, remainder bits              | ~15   |
| `binary.test.ts`            | Conversión binaria, chunkString           | ~25   |
| `svg-renderer.test.ts`      | SVG output, paths, moduleShape (4 formas) | ~62   |
| `canvas-renderer.test.ts`   | Canvas render, toDataURL, toBlob          | ~30   |
| `terminal-renderer.test.ts` | Unicode, compact, ascii, invert           | ~33   |
| `qr-generation.test.ts`     | Integración end-to-end                    | ~40   |

**Total**: ~352 unit/integration tests + 41 E2E (jsQR en proyecto separado)

### E2E Tests

Los tests E2E (`e2e-tests/`) generan QR codes reales, los renderizan en canvas y los decodifican con `jsQR` para verificar que el contenido se recupera correctamente. Cubren versiones 1-40, los 4 niveles de corrección, y los 3 modos de codificación.

### Ejecutar tests

```bash
npm test                                   # Unit + integration
npm run test:coverage                      # Con reporte de cobertura
cd e2e-tests && npm install && npm test    # E2E
```

---

## Build y Distribución

### Configuración tsup

```typescript
// tsup.config.ts
export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs", "esm"],
	dts: true,
	clean: true,
	sourcemap: true,
});
```

### Salida

```
dist/
├── index.js      # CommonJS
├── index.mjs     # ES Module
├── index.d.ts    # Tipos (CJS)
├── index.d.mts   # Tipos (ESM)
└── *.map         # Source maps
```

### Package exports

```json
{
	"main": "dist/index.js",
	"module": "dist/index.mjs",
	"types": "dist/index.d.ts",
	"exports": {
		".": {
			"import": {
				"types": "./dist/index.d.mts",
				"default": "./dist/index.mjs"
			},
			"require": {
				"types": "./dist/index.d.ts",
				"default": "./dist/index.js"
			}
		}
	}
}
```

---

## Referencias

- [ISO/IEC 18004:2015](https://www.iso.org/standard/62021.html) — Especificación oficial QR Code
- [Thonky QR Code Tutorial](https://www.thonky.com/qr-code-tutorial/) — Tutorial paso a paso
- [Reed-Solomon Error Correction](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction) — Algoritmo de corrección

---

_Documentación actualizada: Febrero 2026_
_Versión del proyecto: 2.1.0_
