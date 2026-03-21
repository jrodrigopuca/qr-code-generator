# QR-Pure — Estado del Proyecto

> Documento generado: Marzo 2026  
> Versión actual: **2.1.0**  
> Estado: **Producción** (publicado en npm)

---

## Resumen Ejecutivo

**qr-pure** es un generador de códigos QR escrito en TypeScript, sin dependencias para la funcionalidad core. Implementa el estándar ISO/IEC 18004 completo (versiones 1-40) y está publicado en npm.

| Métrica              | Valor                       |
| -------------------- | --------------------------- |
| Versión npm          | 2.1.0                       |
| Dependencias runtime | 0                           |
| Tests                | 352+ unit/integration + E2E |
| Cobertura global     | ~96% statements             |
| Build                | Dual CJS + ESM con tipos    |
| Licencia             | MIT                         |

---

## Estado por Componente

### Core (100% completado)

| Componente                   | Estado | Notas                                  |
| ---------------------------- | ------ | -------------------------------------- |
| Codificación Numeric         | ✅     | 10 bits / 3 dígitos                    |
| Codificación Alphanumeric    | ✅     | 11 bits / 2 caracteres                 |
| Codificación Byte            | ✅     | 8 bits / carácter                      |
| Detección automática de modo | ✅     | `ModeDetector`                         |
| Reed-Solomon (GF 2^8)        | ✅     | Niveles L/M/Q/H                        |
| Selección automática versión | ✅     | v1-40                                  |
| 8 máscaras + scoring         | ✅     | Selección automática                   |
| Patrones de función          | ✅     | Finder, Alignment, Timing, Dark module |
| Format info (15 bits BCH)    | ✅     |                                        |
| Version info (18 bits BCH)   | ✅     | v≥7                                    |

### Renderers (100% completado)

| Renderer         | Estado | Features                                                             |
| ---------------- | ------ | -------------------------------------------------------------------- |
| CanvasRenderer   | ✅     | `render()`, `toDataURL()`, `toBlob()`                                |
| SVGRenderer      | ✅     | Paths optimizados, 4 formas de módulo (square, rounded, circle, dot) |
| TerminalRenderer | ✅     | 3 estilos (unicode, compact, ascii), modo invertido                  |

### Calidad (95% completado)

| Aspecto              | Estado | Detalle                      |
| -------------------- | ------ | ---------------------------- |
| Unit tests           | ✅     | ~320 tests                   |
| Integration tests    | ✅     | ~32 tests                    |
| E2E tests            | ✅     | 41 tests con jsQR            |
| Cobertura statements | ✅     | 95.81%                       |
| Cobertura branches   | ✅     | 90.88%                       |
| Cobertura functions  | ✅     | 96.61%                       |
| TypeScript strict    | ✅     | `strict: true`               |
| ESLint               | ✅     | Configurado                  |
| Prettier             | ✅     | Configurado                  |
| JSDoc                | ✅     | 100% API pública documentada |

### CI/CD (100% completado)

| Pipeline                | Estado | Trigger       |
| ----------------------- | ------ | ------------- |
| Typecheck               | ✅     | Push/PR       |
| Lint                    | ✅     | Push/PR       |
| Tests + Coverage        | ✅     | Push/PR       |
| Build                   | ✅     | Push/PR       |
| E2E                     | ✅     | Push/PR       |
| API Docs → GitHub Pages | ✅     | Push a master |

### Documentación (90% completado)

| Documento               | Estado | URL                                                               |
| ----------------------- | ------ | ----------------------------------------------------------------- |
| README                  | ✅     | Actualizado con todos los renderers                               |
| API Reference (TypeDoc) | ✅     | [GitHub Pages](https://jrodrigopuca.github.io/qr-code-generator/) |
| Technical docs          | ✅     | `docs/technical.md`                                               |
| Roadmap                 | ✅     | `docs/roadmap.md`                                                 |
| CHANGELOG               | ⏸️     | Pendiente                                                         |
| CONTRIBUTING            | ⏸️     | Pendiente                                                         |

---

## Cobertura por Módulo

```
Módulo                  | Statements | Branches | Lines
------------------------|------------|----------|-------
src/constants/          |    100%    |   100%   | 100%
src/utils/binary.ts     |    100%    |   100%   | 100%
CanvasRenderer          |    100%    |   100%   | 100%
src/encoder/            |     99%    |    98%   |  99%
MaskEvaluator           |     99%    |    93%   |  99%
SVGRenderer             |     88%    |    88%   |  87%
TerminalRenderer        |    100%    |    92%   | 100%
GaloisField             |     77%    |    72%   |  77%
```

**Líneas sin cobertura notable:**

- `SVGRenderer`: métodos DOM (`createSVGElement`, `download`) — requieren browser real
- `GaloisField`: funciones de debug/utilidad no usadas en producción

---

## Arquitectura

```
src/
├── index.ts              # Entry point + helper functions
├── QRCode.ts             # Clase principal (orquestador)
├── errors.ts             # Custom errors tipados
├── types/                # Interfaces y tipos
├── encoder/              # Numeric, Alphanumeric, Byte, ModeDetector
├── correction/           # GaloisField, ReedSolomon
├── patterns/             # Finder, Alignment, Timing, FormatInfo
├── mask/                 # MaskEvaluator (8 patrones + scoring)
├── renderer/             # Canvas, SVG, Terminal
├── constants/            # Tablas del estándar ISO
└── utils/                # Utilidades binarias
```

---

## Distribución

### npm Package

```json
{
	"name": "qr-pure",
	"version": "2.1.0",
	"main": "dist/index.js", // CommonJS
	"module": "dist/index.mjs", // ES Module
	"types": "dist/index.d.ts" // TypeScript declarations
}
```

**Instalación:**

```bash
npm install qr-pure
```

**Unpacked size:** 889.2 kB (incluye sourcemaps)

### Build Output

```
dist/
├── index.js       # CJS
├── index.mjs      # ESM
├── index.d.ts     # Tipos CJS
├── index.d.mts    # Tipos ESM
└── *.map          # Source maps
```

---

## Pendientes (Backlog)

### Alta prioridad

- [ ] CHANGELOG.md con historial de versiones
- [ ] CONTRIBUTING.md con guía de contribución
- [ ] CI multi-versión Node (18, 20, 22)

### Media prioridad

- [ ] CLI tool (`npx qr-pure "text"`)
- [ ] Embedding de logo en el centro del QR
- [ ] Bundle size tracking con size-limit

### Baja prioridad (largo plazo)

- [ ] Modo Kanji (codificación Shift JIS)
- [ ] Codificación multi-modo optimizada
- [ ] ECI (Extended Channel Interpretation)
- [ ] Structured Append (múltiples QR enlazados)
- [ ] Micro QR (ISO/IEC 18004 Annex I)

---

## Scripts Disponibles

```bash
npm run build          # Build dual CJS + ESM
npm run typecheck      # Verificación de tipos
npm run test           # Tests unitarios + integración
npm run test:coverage  # Tests con cobertura
npm run lint           # ESLint
npm run format         # Prettier
npm run docs           # Generar API docs (TypeDoc)
npm run demo:node      # Demo en Node.js
npm run demo:browser   # Demo interactiva (Vite)
```

---

## Enlaces

| Recurso  | URL                                                      |
| -------- | -------------------------------------------------------- |
| npm      | https://www.npmjs.com/package/qr-pure                    |
| GitHub   | https://github.com/jrodrigopuca/qr-code-generator        |
| API Docs | https://jrodrigopuca.github.io/qr-code-generator/        |
| Issues   | https://github.com/jrodrigopuca/qr-code-generator/issues |

---

## Historial de Versiones Recientes

| Versión | Fecha    | Cambios principales                                        |
| ------- | -------- | ---------------------------------------------------------- |
| 2.1.0   | Feb 2026 | TypeDoc API docs, GitHub Pages deployment                  |
| 2.0.x   | Ene 2026 | Module shapes en SVG, TerminalRenderer, demos interactivas |
| 1.x     | -        | Desarrollo inicial, core QR generation                     |

---

_Última actualización: Marzo 2026_
