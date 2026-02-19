# QR Code Generator - Documentación Técnica Completa

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Componentes Principales](#componentes-principales)
4. [Algoritmos Implementados](#algoritmos-implementados)
5. [Flujo de Datos](#flujo-de-datos)
6. [API y Uso](#api-y-uso)
7. [Análisis de Código](#análisis-de-código)
8. [Elementos Faltantes](#elementos-faltantes)
9. [Mejoras Recomendadas](#mejoras-recomendadas)
10. [Guía de Contribución](#guía-de-contribución)

---

## Descripción General

Este proyecto es un **generador de códigos QR desarrollado desde cero** en TypeScript, sin dependencias de librerías externas para la generación del código QR. Implementa el estándar ISO/IEC 18004 para códigos QR, soportando:

- **40 versiones** de QR (desde 21x21 hasta 177x177 módulos)
- **4 niveles de corrección de errores**: L (7%), M (15%), Q (25%), H (30%)
- **8 patrones de máscara** para optimización
- **Modo Byte** para codificación de caracteres

### Características Actuales

| Característica                      | Estado          |
| ----------------------------------- | --------------- |
| Versiones 1-40                      | ✅ Implementado |
| Niveles de corrección L/M/Q/H       | ✅ Implementado |
| Patrones de búsqueda (Finder)       | ✅ Implementado |
| Patrones de alineación              | ✅ Implementado |
| Patrones de sincronización (Timing) | ✅ Implementado |
| Módulo oscuro                       | ✅ Implementado |
| Información de formato              | ✅ Implementado |
| Información de versión (v≥7)        | ✅ Implementado |
| 8 Máscaras de datos                 | ✅ Implementado |
| Corrección de errores Reed-Solomon  | ✅ Implementado |
| Interleaving de datos               | ✅ Implementado |
| Selección automática de versión     | ✅ Implementado |
| Selección automática de máscara     | ❌ Pendiente    |

---

## Arquitectura del Proyecto

```
qr-code-generator/
├── index.html          # Interfaz de usuario HTML
├── style.css           # Estilos de la aplicación
├── package.json        # Configuración npm y scripts
├── tsconfig.json       # Configuración de TypeScript
├── README.md           # Descripción básica del proyecto
├── src/
│   └── qr.ts          # Lógica principal del generador QR (TypeScript)
├── js/
│   └── canvas.js      # Manejo del canvas y eventos del DOM
└── dist/              # Salida compilada (generada por tsc)
    └── qr.js          # Código JavaScript compilado
```

### Tecnologías Utilizadas

- **TypeScript 5.7+**: Lenguaje principal
- **HTML5 Canvas**: Renderizado del código QR
- **Vitest**: Framework de testing
- **tsx**: Ejecución directa de TypeScript

---

## Componentes Principales

### 1. Clase `QR` (src/qr.ts)

La clase principal que encapsula toda la lógica de generación del código QR.

```typescript
class QR {
	version: number; // Versión del QR (1-40)
	text: string; // Texto a codificar
	lvlCorrection: string; // Nivel de corrección (L/M/Q/H)
	mode: string; // Modo de codificación ("0100" = Byte)
	ccm: number; // Character Count Mode
	antilog: number[]; // Tabla antilogarítmica para GF(2^8)
	ecc: number; // Cantidad de codewords de corrección
	d: number; // Dimensión del QR (módulos por lado)
	board: any[]; // Matriz del código QR
	maskNumber: number; // Número de máscara (0-7)
}
```

### 2. Función `getBetterQR()` (src/qr.ts)

Determina automáticamente la mejor versión y nivel de corrección para un texto dado.

```typescript
function getBetterQR(text) {
	// Retorna: { version, lvlCorrection, length }
}
```

### 3. Canvas Handler (js/canvas.js)

Gestiona la interacción con el DOM y la actualización en tiempo real del código QR.

---

## Algoritmos Implementados

### 1. Codificación de Datos

El proceso de codificación sigue estos pasos:

```
Texto → Mode Indicator → Character Count → Byte Encoding → Padding → Codewords
```

#### Métodos involucrados:

- `firstPart()`: Genera indicador de modo + conteo de caracteres
- `msgEncoding()`: Convierte caracteres a representación binaria de 8 bits
- `dataEncoding()`: Combina todo y aplica padding

### 2. Corrección de Errores Reed-Solomon

Implementación del algoritmo Reed-Solomon usando aritmética de campos de Galois GF(2^8).

#### Métodos involucrados:

- `getPoly(n)`: Genera el polinomio generador de grado n
- `getStep()`: Multiplica dos polinomios en GF(2^8)
- `makeIteration()`: Ejecuta una iteración de la división polinomial
- `getCorrection()`: Calcula los codewords de corrección de errores

### 3. Interleaving

Los datos y corrección de errores se entrelazan según las especificaciones del estándar.

#### Métodos involucrados:

- `makeGroups()`: Divide datos en grupos/bloques según versión
- `interleave()`: Entrelaza los codewords de múltiples bloques

### 4. Patrones de Función

```
┌─────────┬────────────────────────────────────────┐
│ Patrón  │ Descripción                            │
├─────────┼────────────────────────────────────────┤
│ Finder  │ 3 cuadrados 7x7 en esquinas            │
│ Align   │ Patrones 5x5 para versiones ≥2         │
│ Timing  │ Líneas alternantes fila 6 y columna 6  │
│ Dark    │ Módulo siempre oscuro en (4v+9, 8)     │
│ Format  │ 15 bits cerca de finders               │
│ Version │ 18 bits para versiones ≥7              │
└─────────┴────────────────────────────────────────┘
```

### 5. Máscaras de Datos

8 patrones de máscara disponibles:

| Máscara | Fórmula                                       |
| ------- | --------------------------------------------- |
| 0       | (row + col) % 2 == 0                          |
| 1       | row % 2 == 0                                  |
| 2       | col % 3 == 0                                  |
| 3       | (row + col) % 3 == 0                          |
| 4       | (floor(row/2) + floor(col/3)) % 2 == 0        |
| 5       | ((row*col) % 2) + ((row*col) % 3) == 0        |
| 6       | (((row*col) % 2) + ((row*col) % 3)) % 2 == 0  |
| 7       | (((row+col) % 2) + ((row\*col) % 3)) % 2 == 0 |

---

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE GENERACIÓN QR                        │
└─────────────────────────────────────────────────────────────────────┘

     Usuario ingresa texto
              │
              ▼
     ┌────────────────┐
     │  getBetterQR() │ ─── Selecciona versión y nivel de corrección
     └────────┬───────┘
              │
              ▼
     ┌────────────────┐
     │   new QR(...)  │ ─── Inicializa matriz y parámetros
     └────────┬───────┘
              │
              ▼
     ┌────────────────┐
     │   draw(ctx)    │ ─── Método principal de renderizado
     └────────┬───────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌──────────┐     ┌──────────────┐
│addPatterns│     │ getFinalForm │
│           │     │              │
│ - Finder  │     │ - dataEnc    │
│ - Align   │     │ - errorEnc   │
│ - Timing  │     │ - interleave │
│ - Dark    │     │ - remainder  │
└─────┬─────┘     └──────┬───────┘
      │                  │
      └────────┬─────────┘
               │
               ▼
        ┌──────────┐
        │ loadData │ ─── Coloca bits en la matriz
        └────┬─────┘
             │
             ▼
        ┌──────────┐
        │   mask   │ ─── Aplica patrón de máscara
        └────┬─────┘
             │
             ▼
      ┌────────────┐
      │ formatInfo │ ─── Añade información de formato/versión
      └─────┬──────┘
            │
            ▼
     Canvas renderiza matriz
```

---

## API y Uso

### Uso Básico

```javascript
// Crear instancia con parámetros específicos
const qr = new QR("Hello World", 2, "M", 1);
qr.draw(canvasContext);

// O usar selección automática de versión
const { version, lvlCorrection } = getBetterQR("Hello World");
const qr = new QR("Hello World", version, lvlCorrection, 1);
qr.draw(canvasContext);
```

### Parámetros del Constructor

| Parámetro     | Tipo   | Descripción                              |
| ------------- | ------ | ---------------------------------------- |
| text          | string | Texto a codificar                        |
| version       | number | Versión del QR (1-40)                    |
| lvlCorrection | string | Nivel de corrección ("L", "M", "Q", "H") |
| maskNumber    | number | Patrón de máscara (0-7)                  |

### Scripts npm

```bash
npm run tsc    # Compila TypeScript
npm run live   # Inicia servidor de desarrollo
npm run start  # Compila y ejecuta
npm run dev    # Desarrollo con hot-reload
```

---

## Análisis de Código

### Fortalezas

1. **Implementación completa**: Soporta todas las 40 versiones del estándar
2. **Sin dependencias externas**: El núcleo está implementado desde cero
3. **Código organizado**: Separación clara de responsabilidades en métodos
4. **Actualización en tiempo real**: El canvas se actualiza mientras el usuario escribe

### Áreas de Oportunidad

1. **Tipado débil**: Muchos parámetros usan `any` en lugar de tipos específicos
2. **Datos hardcodeados**: Tablas de capacidad/corrección repetidas en múltiples lugares
3. **Sin manejo de errores**: No hay validación robusta de entrada
4. **Sin tests**: No hay suite de pruebas unitarias
5. **Documentación en código**: Faltan comentarios JSDoc

---

## Elementos Faltantes

### 🔴 Críticos

| Elemento                        | Descripción                               | Impacto               |
| ------------------------------- | ----------------------------------------- | --------------------- |
| Selección automática de máscara | Evaluar las 8 máscaras y elegir la óptima | Mejora legibilidad    |
| Modos adicionales               | Numérico, Alfanumérico, Kanji             | Eficiencia de espacio |
| Validación de entrada           | Verificar caracteres no soportados        | Prevenir errores      |

### 🟡 Importantes

| Elemento                              | Descripción                              |
| ------------------------------------- | ---------------------------------------- |
| ECI (Extended Channel Interpretation) | Soporte para diferentes encodings        |
| Structured Append                     | Dividir datos en múltiples QRs           |
| FNC1                                  | Modo para aplicaciones específicas (GS1) |
| Micro QR                              | Versiones compactas del QR               |

### 🟢 Deseables

| Elemento               | Descripción                        |
| ---------------------- | ---------------------------------- |
| Exportar imagen        | Descargar como PNG/SVG             |
| Personalización visual | Colores, logos, bordes redondeados |
| API REST               | Endpoint para generar QRs          |
| PWA                    | Funcionamiento offline             |

---

## Mejoras Recomendadas

### 1. Tipado Estricto (Alta Prioridad)

```typescript
// Antes
constructor(text: string, version: number, lvlCorrection: string, maskNumber: number)

// Después
type CorrectionLevel = 'L' | 'M' | 'Q' | 'H';
type MaskNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

constructor(
    text: string,
    version: QRVersion,  // 1-40
    lvlCorrection: CorrectionLevel,
    maskNumber: MaskNumber
)
```

### 2. Centralizar Tablas de Datos

```typescript
// Crear archivo separado: src/qr-tables.ts
export const CAPACITY_TABLE = [...];
export const ECC_CODEWORDS = [...];
export const ALIGNMENT_PATTERNS = [...];
export const FORMAT_INFO = [...];
export const VERSION_INFO = [...];
```

### 3. Implementar Selección Automática de Máscara

```typescript
getBestMask(): number {
    let bestScore = Infinity;
    let bestMask = 0;

    for (let mask = 0; mask < 8; mask++) {
        const score = this.evaluateMask(mask);
        if (score < bestScore) {
            bestScore = score;
            bestMask = mask;
        }
    }
    return bestMask;
}

evaluateMask(maskNum: number): number {
    // Implementar las 4 reglas de penalización del estándar
    // N1: Grupos de 5+ módulos del mismo color
    // N2: Bloques 2x2 del mismo color
    // N3: Patrones similares a finders
    // N4: Proporción de módulos oscuros/claros
}
```

### 4. Agregar Manejo de Errores

```typescript
class QRError extends Error {
	constructor(
		message: string,
		public code: string,
	) {
		super(message);
		this.name = "QRError";
	}
}

// Validaciones
if (version < 1 || version > 40) {
	throw new QRError("Version must be between 1 and 40", "INVALID_VERSION");
}

if (text.length > this.capacity) {
	throw new QRError(
		`Text too long for version ${version}`,
		"CAPACITY_EXCEEDED",
	);
}
```

### 5. Agregar Tests Unitarios

```typescript
// tests/qr.test.ts
describe('QR Code Generator', () => {
    test('should encode "HELLO" correctly in mode 0100', () => {
        const qr = new QR("HELLO", 1, "L", 0);
        expect(qr.msgEncoding()).toBe("0100100001...");
    });

    test('should calculate correct error correction', () => {
        const qr = new QR("TEST", 1, "M", 0);
        const ecc = qr.getCorrection([1, 2, 3, 4]);
        expect(ecc).toEqual([...]);
    });
});
```

### 6. Exportar como Imagen

```typescript
exportAsPNG(filename: string = 'qrcode.png'): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

exportAsSVG(): string {
    // Generar SVG desde la matriz
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.d} ${this.d}">`;
    for (let i = 0; i < this.d; i++) {
        for (let j = 0; j < this.d; j++) {
            if (this.board[i][j] === 1 || this.board[i][j] === 4) {
                svg += `<rect x="${j}" y="${i}" width="1" height="1"/>`;
            }
        }
    }
    svg += '</svg>';
    return svg;
}
```

### 7. Actualizar Dependencias

```json
{
	"devDependencies": {
		"typescript": "^5.7.0",
		"vitest": "^4.0.0",
		"tsx": "^4.21.0"
	}
}
```

### 8. Mejorar tsconfig.json

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"module": "ESNext",
		"strict": true,
		"noImplicitAny": true,
		"strictNullChecks": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"declaration": true,
		"sourceMap": true
	}
}
```

### 9. Estructura de Proyecto Sugerida

```
qr-code-generator/
├── src/
│   ├── index.ts           # Entry point
│   ├── QRCode.ts          # Clase principal refactorizada
│   ├── encoder/
│   │   ├── ByteEncoder.ts
│   │   ├── NumericEncoder.ts
│   │   └── AlphanumericEncoder.ts
│   ├── correction/
│   │   └── ReedSolomon.ts
│   ├── patterns/
│   │   ├── FinderPattern.ts
│   │   ├── AlignmentPattern.ts
│   │   └── TimingPattern.ts
│   ├── mask/
│   │   └── MaskEvaluator.ts
│   ├── render/
│   │   ├── CanvasRenderer.ts
│   │   └── SVGRenderer.ts
│   └── constants/
│       └── tables.ts
├── tests/
│   ├── encoder.test.ts
│   └── reed-solomon.test.ts
├── demo/
│   └── basic-usage.html
└── dist/
```

---

## Guía de Contribución

### Configuración del Entorno

```bash
# Clonar repositorio
git clone <repo-url>
cd qr-code-generator

# Instalar dependencias
npm install

# Compilar TypeScript
npm run tsc

# Iniciar servidor de desarrollo
npm run live
```

### Convenciones de Código

1. Usar TypeScript estricto
2. Documentar funciones públicas con JSDoc
3. Nombrar variables en inglés
4. Usar PascalCase para clases, camelCase para funciones/variables
5. Mantener funciones pequeñas y con responsabilidad única

### Proceso de PR

1. Crear branch desde `main`
2. Implementar cambios con tests
3. Asegurar que pasan todos los tests
4. Crear Pull Request con descripción detallada

---

## Referencias

- [ISO/IEC 18004:2015](https://www.iso.org/standard/62021.html) - Especificación oficial QR Code
- [Thonky QR Code Tutorial](https://www.thonky.com/qr-code-tutorial/) - Tutorial detallado
- [Reed-Solomon Codes](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction) - Algoritmo de corrección

---

_Documentación generada el: Febrero 2026_
_Versión del proyecto: 1.0.0_
