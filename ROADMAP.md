# 🗺️ Plan de Mejora: QR Code Generator → npm Library

## Objetivo

Transformar el proyecto actual en una **librería npm profesional y publicable** llamada `@juanqr/qr-generator` (o nombre similar disponible).

---

## 📅 Fases del Plan

| Fase | Nombre | Duración Estimada | Prioridad |
|------|--------|-------------------|-----------|
| 1 | Reestructuración del Proyecto | 2-3 días | 🔴 Crítica |
| 2 | Refactorización del Código | 3-4 días | 🔴 Crítica |
| 3 | Tipado Estricto y API Pública | 2-3 días | 🔴 Crítica |
| 4 | Testing y Calidad | 2-3 días | 🟡 Alta |
| 5 | Funcionalidades Adicionales | 3-5 días | 🟡 Alta |
| 6 | Documentación y Ejemplos | 2 días | 🟡 Alta |
| 7 | Build, Bundle y Publicación | 1-2 días | 🟢 Media |
| 8 | Extras y Mejoras Continuas | Ongoing | 🟢 Media |

**Total estimado: 15-22 días**

---

## 📋 Fase 1: Reestructuración del Proyecto

### 1.1 Nueva Estructura de Directorios

```
qr-code-generator/
├── src/
│   ├── index.ts                 # Entry point - exporta API pública
│   ├── QRCode.ts                # Clase principal refactorizada
│   ├── types/
│   │   └── index.ts             # Tipos e interfaces TypeScript
│   ├── encoder/
│   │   ├── index.ts
│   │   ├── ByteEncoder.ts       # Modo Byte (actual)
│   │   ├── NumericEncoder.ts    # Modo Numérico (nuevo)
│   │   ├── AlphanumericEncoder.ts # Modo Alfanumérico (nuevo)
│   │   └── BaseEncoder.ts       # Clase base abstracta
│   ├── correction/
│   │   ├── index.ts
│   │   ├── ReedSolomon.ts       # Algoritmo RS extraído
│   │   └── GaloisField.ts       # Aritmética GF(2^8)
│   ├── patterns/
│   │   ├── index.ts
│   │   ├── FinderPattern.ts
│   │   ├── AlignmentPattern.ts
│   │   ├── TimingPattern.ts
│   │   └── FormatInfo.ts
│   ├── mask/
│   │   ├── index.ts
│   │   ├── MaskPatterns.ts      # 8 patrones
│   │   └── MaskEvaluator.ts     # Evaluación automática (nuevo)
│   ├── renderer/
│   │   ├── index.ts
│   │   ├── BaseRenderer.ts      # Interfaz base
│   │   ├── CanvasRenderer.ts    # Renderizado Canvas
│   │   ├── SVGRenderer.ts       # Renderizado SVG (nuevo)
│   │   └── MatrixRenderer.ts    # Solo matriz de datos
│   ├── utils/
│   │   ├── index.ts
│   │   └── binary.ts            # Utilidades binarias
│   └── constants/
│       ├── index.ts
│       ├── capacity.ts          # Tablas de capacidad
│       ├── correction.ts        # Tablas de corrección
│       ├── alignment.ts         # Posiciones de alineación
│       └── format.ts            # Información de formato
├── tests/
│   ├── unit/
│   │   ├── encoder.test.ts
│   │   ├── reed-solomon.test.ts
│   │   ├── mask.test.ts
│   │   └── qrcode.test.ts
│   ├── integration/
│   │   └── full-generation.test.ts
│   └── fixtures/
│       └── test-data.ts
├── examples/
│   ├── browser/
│   │   ├── index.html
│   │   ├── style.css
│   │   └── app.js
│   └── node/
│       └── generate.js
├── dist/                        # Build output (gitignored)
├── docs/                        # Documentación generada
├── .github/
│   └── workflows/
│       ├── ci.yml               # GitHub Actions CI
│       └── publish.yml          # Auto-publish a npm
├── package.json
├── tsconfig.json
├── tsconfig.build.json          # Config para build de producción
├── vitest.config.ts             # Configuración de tests
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── LICENSE
├── README.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```

### 1.2 Tareas

- [ ] Crear nueva estructura de carpetas
- [ ] Mover código existente a ubicaciones apropiadas
- [ ] Configurar `.gitignore` apropiado
- [ ] Agregar archivo `LICENSE` (MIT recomendado)

---

## 📋 Fase 2: Refactorización del Código

### 2.1 Extraer Constantes y Tablas

**Archivo: `src/constants/capacity.ts`**
```typescript
export const BYTE_CAPACITY = [
  { L: 17, M: 14, Q: 11, H: 7 },
  { L: 32, M: 26, Q: 20, H: 14 },
  // ... todas las 40 versiones
] as const;

export const TOTAL_CODEWORDS = [
  { L: 19, M: 16, Q: 13, H: 9 },
  // ...
] as const;
```

### 2.2 Extraer Reed-Solomon

**Archivo: `src/correction/GaloisField.ts`**
```typescript
export class GaloisField {
  private static readonly ANTILOG: readonly number[] = [1, 2, 4, 8, ...];
  private static readonly LOG: readonly number[] = [...];
  
  static multiply(a: number, b: number): number { ... }
  static divide(a: number, b: number): number { ... }
  static power(base: number, exp: number): number { ... }
}
```

**Archivo: `src/correction/ReedSolomon.ts`**
```typescript
export class ReedSolomon {
  constructor(private eccCount: number) {}
  
  encode(data: number[]): number[] { ... }
  getGeneratorPolynomial(): number[] { ... }
}
```

### 2.3 Separar Patrones

**Archivo: `src/patterns/FinderPattern.ts`**
```typescript
export class FinderPattern {
  static draw(matrix: QRMatrix, size: number): void { ... }
  static getPositions(version: number): Position[] { ... }
}
```

### 2.4 Estándar JSDoc

Todas las funciones, clases y métodos públicos **deben** incluir JSDoc completo:

```typescript
/**
 * Calcula los codewords de corrección de errores usando Reed-Solomon.
 * 
 * @description Implementa el algoritmo Reed-Solomon sobre GF(2^8) para
 * generar codewords de corrección de errores según ISO/IEC 18004.
 * 
 * @param data - Array de codewords de datos a proteger
 * @returns Array de codewords de corrección de errores
 * 
 * @example
 * ```typescript
 * const rs = new ReedSolomon(10);
 * const ecc = rs.encode([32, 91, 11, 120]);
 * console.log(ecc); // [196, 35, 39, ...]
 * ```
 * 
 * @throws {QRCodeError} Si el array de datos está vacío
 * @see {@link https://www.thonky.com/qr-code-tutorial/error-correction-coding}
 */
encode(data: number[]): number[] {
  // ...
}
```

**Elementos obligatorios en JSDoc:**
- `@description` - Descripción detallada del propósito
- `@param` - Todos los parámetros con tipo y descripción
- `@returns` - Valor de retorno con tipo y descripción
- `@example` - Al menos un ejemplo de uso
- `@throws` - Excepciones que puede lanzar (si aplica)
- `@see` - Referencias relevantes (si aplica)

### 2.5 Tareas

- [ ] Crear `GaloisField` class con aritmética de campos finitos
- [ ] Extraer `ReedSolomon` a su propia clase
- [ ] Crear clases para cada tipo de patrón
- [ ] Extraer todas las tablas hardcodeadas a `constants/`
- [ ] Eliminar código duplicado (tablas aparecen 3+ veces)
- [ ] Agregar JSDoc completo a todas las funciones públicas
- [ ] Configurar ESLint rule `require-jsdoc` para enforcement

---

## 📋 Fase 3: Tipado Estricto y API Pública

### 3.1 Definir Tipos

**Archivo: `src/types/index.ts`**
```typescript
/** Nivel de corrección de errores */
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

/** Versión del QR (1-40) */
export type QRVersion = 1 | 2 | 3 | ... | 40;
// O usar: export type QRVersion = number & { __brand: 'QRVersion' };

/** Número de máscara (0-7) */
export type MaskPattern = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Modo de codificación */
export type EncodingMode = 'numeric' | 'alphanumeric' | 'byte' | 'kanji';

/** Opciones de configuración */
export interface QRCodeOptions {
  /** Texto a codificar */
  content: string;
  /** Versión específica (1-40) o 'auto' */
  version?: QRVersion | 'auto';
  /** Nivel de corrección de errores */
  errorCorrection?: ErrorCorrectionLevel;
  /** Patrón de máscara específico o 'auto' */
  mask?: MaskPattern | 'auto';
  /** Modo de codificación o 'auto' */
  mode?: EncodingMode | 'auto';
}

/** Opciones de renderizado */
export interface RenderOptions {
  /** Tamaño en píxeles (ancho = alto) */
  size?: number;
  /** Margen en módulos (quiet zone) */
  margin?: number;
  /** Color de módulos oscuros */
  darkColor?: string;
  /** Color de módulos claros */
  lightColor?: string;
  /** Color de fondo */
  backgroundColor?: string;
}

/** Matriz del QR */
export type QRMatrix = (0 | 1)[][];

/** Resultado de generación */
export interface QRCodeResult {
  /** Versión utilizada */
  version: QRVersion;
  /** Nivel de corrección utilizado */
  errorCorrection: ErrorCorrectionLevel;
  /** Máscara aplicada */
  mask: MaskPattern;
  /** Modo de codificación usado */
  mode: EncodingMode;
  /** Dimensión de la matriz */
  size: number;
  /** Matriz binaria del QR */
  matrix: QRMatrix;
}
```

### 3.2 API Pública

**Archivo: `src/index.ts`**
```typescript
export { QRCode } from './QRCode';
export { CanvasRenderer, SVGRenderer, MatrixRenderer } from './renderer';
export type {
  ErrorCorrectionLevel,
  QRVersion,
  MaskPattern,
  EncodingMode,
  QRCodeOptions,
  RenderOptions,
  QRMatrix,
  QRCodeResult,
} from './types';

// Función helper para uso simple
export function generateQR(content: string, options?: Partial<QRCodeOptions>): QRCodeResult {
  const qr = new QRCode({ content, ...options });
  return qr.generate();
}

// Función helper para Canvas
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  content: string,
  options?: Partial<QRCodeOptions & RenderOptions>
): void {
  const qr = new QRCode({ content, ...options });
  const renderer = new CanvasRenderer(canvas, options);
  renderer.render(qr.generate());
}

// Función helper para SVG
export function renderToSVG(
  content: string,
  options?: Partial<QRCodeOptions & RenderOptions>
): string {
  const qr = new QRCode({ content, ...options });
  const renderer = new SVGRenderer(options);
  return renderer.render(qr.generate());
}
```

### 3.3 Clase Principal Refactorizada

**Archivo: `src/QRCode.ts`**
```typescript
import type { QRCodeOptions, QRCodeResult, QRMatrix } from './types';

/**
 * Clase principal para generar códigos QR.
 * 
 * @description Implementa la generación completa de códigos QR según
 * el estándar ISO/IEC 18004, soportando versiones 1-40, niveles de
 * corrección L/M/Q/H, y los 8 patrones de máscara.
 * 
 * @example
 * ```typescript
 * const qr = new QRCode({ content: 'Hello World' });
 * const result = qr.generate();
 * console.log(result.matrix);
 * ```
 * 
 * @see {@link https://www.iso.org/standard/62021.html} ISO/IEC 18004:2015
 */
export class QRCode {
  private readonly options: Required<QRCodeOptions>;
  
  /**
   * Crea una nueva instancia del generador QR.
   * 
   * @param options - Opciones de configuración del código QR
   * @throws {QRCodeError} Si el contenido está vacío o excede la capacidad
   */
  constructor(options: QRCodeOptions) {
    this.options = this.normalizeOptions(options);
    this.validate();
  }
  
  /**
   * Genera el código QR completo.
   * 
   * @returns Resultado con la matriz del QR y metadatos
   * 
   * @example
   * ```typescript
   * const qr = new QRCode({ content: 'Test', errorCorrection: 'H' });
   * const { matrix, version, size } = qr.generate();
   * ```
   */
  generate(): QRCodeResult {
    const encoded = this.encode();
    const matrix = this.createMatrix(encoded);
    return {
      version: this.options.version as QRVersion,
      errorCorrection: this.options.errorCorrection,
      mask: this.options.mask as MaskPattern,
      mode: this.options.mode as EncodingMode,
      size: matrix.length,
      matrix,
    };
  }
  
  /** Obtiene solo la matriz */
  getMatrix(): QRMatrix {
    return this.generate().matrix;
  }
  
  private validate(): void {
    if (!this.options.content) {
      throw new QRCodeError('Content cannot be empty', 'EMPTY_CONTENT');
    }
    // Más validaciones...
  }
  
  private normalizeOptions(options: QRCodeOptions): Required<QRCodeOptions> {
    return {
      content: options.content,
      version: options.version ?? 'auto',
      errorCorrection: options.errorCorrection ?? 'M',
      mask: options.mask ?? 'auto',
      mode: options.mode ?? 'auto',
    };
  }
}
```

### 3.4 Tareas

- [ ] Crear archivo de tipos completo con JSDoc en interfaces
- [ ] Activar `strict: true` en tsconfig
- [ ] Refactorizar clase QR con tipos estrictos
- [ ] Crear clase de error personalizada `QRCodeError` con JSDoc
- [ ] Implementar validaciones de entrada
- [ ] Diseñar API pública limpia y consistente
- [ ] Documentar todos los tipos exportados con JSDoc
- [ ] Agregar `@example` en cada método público

---

## 📋 Fase 4: Testing y Calidad

### 4.1 Configurar Vitest

**Archivo: `vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'tests', 'examples'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

### 4.2 Tests Unitarios

**Archivo: `tests/unit/encoder.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { ByteEncoder } from '../../src/encoder/ByteEncoder';

describe('ByteEncoder', () => {
  it('should encode ASCII text correctly', () => {
    const encoder = new ByteEncoder();
    const result = encoder.encode('Hello');
    
    expect(result).toBe('0100100001100101011011000110110001101111');
  });
  
  it('should handle empty string', () => {
    const encoder = new ByteEncoder();
    expect(() => encoder.encode('')).toThrow('EMPTY_INPUT');
  });
  
  it('should calculate correct character count indicator', () => {
    const encoder = new ByteEncoder();
    const cci = encoder.getCharacterCountIndicator('Test', 1);
    
    expect(cci).toBe('00000100'); // 4 en 8 bits para v1-9
  });
});
```

**Archivo: `tests/unit/reed-solomon.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { ReedSolomon } from '../../src/correction/ReedSolomon';

describe('ReedSolomon', () => {
  it('should generate correct ECC for version 1-M', () => {
    const rs = new ReedSolomon(10); // 10 ECC codewords
    const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
    const ecc = rs.encode(data);
    
    expect(ecc).toHaveLength(10);
    expect(ecc).toEqual([196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
  });
  
  it('should generate correct generator polynomial', () => {
    const rs = new ReedSolomon(7);
    const poly = rs.getGeneratorPolynomial();
    
    expect(poly).toEqual([0, 87, 229, 146, 149, 238, 102, 21]);
  });
});
```

**Archivo: `tests/unit/mask.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { MaskEvaluator } from '../../src/mask/MaskEvaluator';

describe('MaskEvaluator', () => {
  it('should correctly apply mask pattern 0', () => {
    // (row + col) % 2 === 0
    const evaluator = new MaskEvaluator();
    
    expect(evaluator.shouldFlip(0, 0, 0)).toBe(true);
    expect(evaluator.shouldFlip(0, 0, 1)).toBe(false);
    expect(evaluator.shouldFlip(0, 1, 1)).toBe(true);
  });
  
  it('should select best mask based on penalty score', () => {
    const evaluator = new MaskEvaluator();
    const matrix = createTestMatrix();
    
    const bestMask = evaluator.findBestMask(matrix);
    expect(bestMask).toBeGreaterThanOrEqual(0);
    expect(bestMask).toBeLessThanOrEqual(7);
  });
});
```

### 4.3 Tests de Integración

**Archivo: `tests/integration/full-generation.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { QRCode, generateQR } from '../../src';

describe('QR Code Generation', () => {
  it('should generate valid QR for "Hello World"', () => {
    const result = generateQR('Hello World', { errorCorrection: 'M' });
    
    expect(result.version).toBe(1);
    expect(result.size).toBe(21);
    expect(result.matrix).toHaveLength(21);
    expect(result.matrix[0]).toHaveLength(21);
  });
  
  it('should auto-select appropriate version for long text', () => {
    const longText = 'A'.repeat(100);
    const result = generateQR(longText);
    
    expect(result.version).toBeGreaterThan(1);
  });
  
  it('should respect specified version', () => {
    const result = generateQR('Hi', { version: 5 });
    
    expect(result.version).toBe(5);
    expect(result.size).toBe(37); // (5-1)*4 + 21
  });
  
  // Test contra QR codes conocidos
  it('should match reference QR code for "01234567"', () => {
    const result = generateQR('01234567', {
      version: 1,
      errorCorrection: 'M',
      mask: 2,
      mode: 'numeric',
    });
    
    // Verificar módulos específicos conocidos
    expect(result.matrix[0][0]).toBe(1); // Finder pattern
    expect(result.matrix[6][6]).toBe(1); // Timing pattern
  });
});
```

### 4.4 Configurar ESLint y Prettier

**Archivo: `.eslintrc.js`**
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jsdoc'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:jsdoc/recommended-typescript',
    'prettier',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/strict-boolean-expressions': 'error',
    // JSDoc rules
    'jsdoc/require-jsdoc': ['error', {
      publicOnly: true,
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: false,
        FunctionExpression: false,
      },
    }],
    'jsdoc/require-description': 'error',
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-returns-description': 'error',
    'jsdoc/require-example': 'warn',
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-tag-names': 'error',
  },
};
```

**Archivo: `.prettierrc`**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 4.5 Tareas

- [ ] Instalar Vitest y configurar
- [ ] Escribir tests para encoder (≥90% coverage)
- [ ] Escribir tests para Reed-Solomon (≥90% coverage)
- [ ] Escribir tests para máscaras
- [ ] Escribir tests de integración
- [ ] Configurar ESLint con reglas TypeScript
- [ ] Instalar `eslint-plugin-jsdoc` y configurar reglas
- [ ] Configurar Prettier
- [ ] Agregar scripts de lint y format
- [ ] Configurar GitHub Actions para CI
- [ ] Verificar que JSDoc esté presente en todas las funciones públicas

---

## 📋 Fase 5: Funcionalidades Adicionales

### 5.1 Selección Automática de Máscara

**Archivo: `src/mask/MaskEvaluator.ts`**
```typescript
export class MaskEvaluator {
  /**
   * Encuentra la mejor máscara según el estándar ISO 18004
   */
  findBestMask(matrix: QRMatrix): MaskPattern {
    let bestMask: MaskPattern = 0;
    let lowestPenalty = Infinity;
    
    for (let mask = 0; mask < 8; mask++) {
      const maskedMatrix = this.applyMask(matrix, mask as MaskPattern);
      const penalty = this.calculatePenalty(maskedMatrix);
      
      if (penalty < lowestPenalty) {
        lowestPenalty = penalty;
        bestMask = mask as MaskPattern;
      }
    }
    
    return bestMask;
  }
  
  private calculatePenalty(matrix: QRMatrix): number {
    return (
      this.penaltyRule1(matrix) + // Grupos de 5+ mismo color
      this.penaltyRule2(matrix) + // Bloques 2x2
      this.penaltyRule3(matrix) + // Patrones similares a finder
      this.penaltyRule4(matrix)   // Proporción oscuro/claro
    );
  }
  
  /** N1: Penaliza grupos de 5+ módulos consecutivos del mismo color */
  private penaltyRule1(matrix: QRMatrix): number {
    let penalty = 0;
    const size = matrix.length;
    
    // Horizontal
    for (let row = 0; row < size; row++) {
      let count = 1;
      for (let col = 1; col < size; col++) {
        if (matrix[row][col] === matrix[row][col - 1]) {
          count++;
        } else {
          if (count >= 5) penalty += count - 2;
          count = 1;
        }
      }
      if (count >= 5) penalty += count - 2;
    }
    
    // Vertical (similar)
    // ...
    
    return penalty;
  }
  
  /** N2: Penaliza bloques 2x2 del mismo color */
  private penaltyRule2(matrix: QRMatrix): number {
    let penalty = 0;
    const size = matrix.length;
    
    for (let row = 0; row < size - 1; row++) {
      for (let col = 0; col < size - 1; col++) {
        const color = matrix[row][col];
        if (
          matrix[row][col + 1] === color &&
          matrix[row + 1][col] === color &&
          matrix[row + 1][col + 1] === color
        ) {
          penalty += 3;
        }
      }
    }
    
    return penalty;
  }
  
  /** N3: Penaliza patrones 1:1:3:1:1 similares a finder patterns */
  private penaltyRule3(matrix: QRMatrix): number {
    // Buscar patrón: 10111010000 o 00001011101
    // Penalización: 40 por cada ocurrencia
    // ...
  }
  
  /** N4: Penaliza desbalance en proporción oscuro/claro */
  private penaltyRule4(matrix: QRMatrix): number {
    const size = matrix.length;
    let darkCount = 0;
    
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (matrix[row][col] === 1) darkCount++;
      }
    }
    
    const totalModules = size * size;
    const percentDark = (darkCount / totalModules) * 100;
    const deviation = Math.abs(percentDark - 50);
    
    return Math.floor(deviation / 5) * 10;
  }
}
```

### 5.2 Modo Numérico y Alfanumérico

**Archivo: `src/encoder/NumericEncoder.ts`**
```typescript
export class NumericEncoder extends BaseEncoder {
  readonly mode = '0001';
  
  encode(text: string): string {
    this.validateNumeric(text);
    
    let result = '';
    
    // Codificar en grupos de 3 dígitos
    for (let i = 0; i < text.length; i += 3) {
      const group = text.slice(i, i + 3);
      const value = parseInt(group, 10);
      const bits = group.length === 3 ? 10 : group.length === 2 ? 7 : 4;
      result += this.toBinary(value, bits);
    }
    
    return result;
  }
  
  getCharacterCountBits(version: number): number {
    if (version <= 9) return 10;
    if (version <= 26) return 12;
    return 14;
  }
}
```

### 5.3 Renderizadores

**Archivo: `src/renderer/SVGRenderer.ts`**
```typescript
export class SVGRenderer implements Renderer {
  constructor(private options: RenderOptions = {}) {
    this.options = {
      size: 256,
      margin: 4,
      darkColor: '#000000',
      lightColor: '#ffffff',
      ...options,
    };
  }
  
  render(result: QRCodeResult): string {
    const { matrix, size: qrSize } = result;
    const { size, margin, darkColor, lightColor } = this.options;
    
    const moduleSize = size / (qrSize + margin * 2);
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
    svg += `<rect width="100%" height="100%" fill="${lightColor}"/>`;
    
    for (let row = 0; row < qrSize; row++) {
      for (let col = 0; col < qrSize; col++) {
        if (matrix[row][col] === 1) {
          const x = (col + margin) * moduleSize;
          const y = (row + margin) * moduleSize;
          svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}"/>`;
        }
      }
    }
    
    svg += '</svg>';
    return svg;
  }
  
  renderToDataURL(result: QRCodeResult): string {
    const svg = this.render(result);
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
}
```

### 5.4 Tareas

- [ ] Implementar `MaskEvaluator` con las 4 reglas de penalización
- [ ] Implementar `NumericEncoder`
- [ ] Implementar `AlphanumericEncoder`
- [ ] Implementar `SVGRenderer`
- [ ] Mejorar `CanvasRenderer` con opciones de estilo
- [ ] Agregar método `toDataURL()` para exportar imagen
- [ ] Agregar método `toBlob()` para descargas
- [ ] Agregar detección automática del mejor modo de codificación

---

## 📋 Fase 6: Documentación y Ejemplos

### 6.1 README.md Profesional

```markdown
# @your-scope/qr-generator

A zero-dependency QR code generator written in TypeScript.

[![npm version](https://badge.fury.io/js/@your-scope/qr-generator.svg)](...)
[![CI](https://github.com/.../workflows/ci/badge.svg)](...)
[![Coverage](https://codecov.io/gh/.../branch/main/graph/badge.svg)](...)

## Features

- 🚀 Zero dependencies
- 📦 Tiny bundle size (~8KB gzipped)
- 🎯 Full QR code spec compliance (ISO/IEC 18004)
- 🔧 Multiple output formats (Canvas, SVG, Matrix)
- 📝 Written in TypeScript with full type definitions
- ✅ 95%+ test coverage

## Installation

\`\`\`bash
npm install @your-scope/qr-generator
\`\`\`

## Quick Start

\`\`\`typescript
import { generateQR, renderToCanvas } from '@your-scope/qr-generator';

// Simple usage
const qr = generateQR('Hello World');
console.log(qr.matrix);

// Render to canvas
const canvas = document.getElementById('qr-canvas');
renderToCanvas(canvas, 'Hello World', {
  size: 256,
  errorCorrection: 'H',
});
\`\`\`

## API Reference
...
```

### 6.2 Ejemplos Funcionales

**Crear ejemplos en `/examples/`**
- Browser básico con Canvas
- Browser con SVG
- Node.js generando archivo
- React component wrapper
- Vue component wrapper

### 6.3 Configurar TypeDoc para Documentación API

**Archivo: `typedoc.json`**
```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs",
  "plugin": ["typedoc-plugin-markdown"],
  "readme": "README.md",
  "excludePrivate": true,
  "excludeProtected": true,
  "includeVersion": true,
  "categorizeByGroup": true,
  "navigation": {
    "includeCategories": true,
    "includeGroups": true
  }
}
```

TypeDoc generará documentación automáticamente desde los JSDoc:

```bash
npm run docs  # Genera docs/ desde JSDoc
```

### 6.4 Tareas

- [ ] Escribir README completo con badges
- [ ] Crear ejemplos funcionales
- [ ] Instalar y configurar TypeDoc
- [ ] Verificar que JSDoc genera documentación correcta
- [ ] Generar documentación API con TypeDoc
- [ ] Escribir CONTRIBUTING.md con guía de JSDoc
- [ ] Crear CHANGELOG.md
- [ ] Revisar que todos los exports tienen JSDoc completo

---

## 📋 Fase 7: Build, Bundle y Publicación

### 7.1 Configuración de Build

**Archivo: `tsconfig.build.json`**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.test.ts", "tests/**/*"]
}
```

**Archivo: `package.json` (actualizado)**
```json
{
  "name": "@your-scope/qr-generator",
  "version": "1.0.0",
  "description": "Zero-dependency QR code generator in TypeScript",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run lint && npm run test && npm run build"
  },
  "keywords": [
    "qr",
    "qrcode",
    "qr-code",
    "generator",
    "typescript",
    "zero-dependency"
  ],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/qr-generator"
  },
  "bugs": {
    "url": "https://github.com/your-username/qr-generator/issues"
  },
  "homepage": "https://github.com/your-username/qr-generator#readme",
  "engines": {
    "node": ">=16.0.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.50.0",
    "eslint-config-prettier": "^9.0.0",
    "prettier": "^3.1.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

### 7.2 GitHub Actions CI/CD

**Archivo: `.github/workflows/ci.yml`**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage
      
      - uses: codecov/codecov-action@v3
        if: matrix.node-version == 20

  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist
```

**Archivo: `.github/workflows/publish.yml`**
```yaml
name: Publish

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 7.3 Tareas

- [ ] Instalar tsup para bundling
- [ ] Configurar exports para ESM y CJS
- [ ] Configurar generación de .d.ts
- [ ] Crear workflows de GitHub Actions
- [ ] Configurar badges en README
- [ ] Crear cuenta npm / scope
- [ ] Publicar primera versión beta

---

## 📋 Fase 8: Extras y Mejoras Continuas

### 8.1 Funcionalidades Futuras

| Funcionalidad | Prioridad | Descripción |
|---------------|-----------|-------------|
| Logo en centro | Media | Insertar imagen en el QR |
| Bordes redondeados | Baja | Módulos con esquinas redondeadas |
| Gradientes | Baja | Colores en gradiente |
| Micro QR | Baja | Soporte para versiones M1-M4 |
| rQR Code | Baja | QR rectangular |
| WASM build | Baja | Compilación a WebAssembly |

### 8.2 Mantenimiento

- [ ] Semantic versioning estricto
- [ ] CHANGELOG automatizado con conventional commits
- [ ] Dependabot para actualizaciones
- [ ] Issue templates
- [ ] PR templates

---

## 🎯 Checklist Final de Publicación

Antes de publicar v1.0.0:

- [ ] ✅ Todos los tests pasan
- [ ] ✅ Coverage > 80%
- [ ] ✅ Sin errores de TypeScript
- [ ] ✅ Sin warnings de ESLint
- [ ] ✅ Build funciona correctamente
- [ ] ✅ Exports ESM y CJS funcionan
- [ ] ✅ Types se exportan correctamente
- [ ] ✅ README completo con ejemplos
- [ ] ✅ LICENSE presente
- [ ] ✅ CHANGELOG con versión inicial
- [ ] ✅ package.json metadata completa
- [ ] ✅ Probado en Node.js 18 y 20
- [ ] ✅ Probado en browser (Canvas y SVG)
- [ ] ✅ Verificado tamaño del bundle
- [ ] ✅ Nombre disponible en npm
- [ ] ✅ JSDoc presente en 100% de funciones públicas
- [ ] ✅ TypeDoc genera documentación sin errores

---

## 📊 Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Bundle size (gzipped) | < 10KB |
| Test coverage | > 85% |
| TypeScript strict | ✅ |
| JSDoc coverage | 100% funciones públicas |
| Lighthouse score (demo) | > 95 |
| Tiempo de generación (v1) | < 5ms |
| Tiempo de generación (v40) | < 50ms |

---

*Plan creado: Febrero 2026*
*Última actualización: Febrero 2026*
