# @qr-plus — Estado del Proyecto

> Documento generado: Marzo 2026 (actualizado: Abril 2026)
> Versión actual: **core 1.1.0 · react 1.0.0 · vue 1.0.0 · cli 1.0.0 · wifi 1.0.0 · vcard 1.0.0 · compress 1.0.0**
> Estado: **Producción** (publicados en npm)

---

## Resumen Ejecutivo

**@qr-plus** es un ecosistema de generación de códigos QR escrito en TypeScript. El core (`@qr-plus/core`) no tiene dependencias runtime e implementa el estándar ISO/IEC 18004 completo (versiones 1-40).

| Métrica              | Valor                                                   |
| -------------------- | ------------------------------------------------------- |
| Paquetes publicados  | 7 (`core`, `react`, `vue`, `cli`, `wifi`, `vcard`, `compress`) |
| Dependencias runtime | 0 (core, wifi, vcard, compress), 0 peer-only (react, vue), 1 (cli) |
| Tests                | 638 (357 core + 48 react + 50 vue + 32 wifi + 45 vcard + 65 compress + 41 e2e) |
| Cobertura global     | ~96% statements (core)                                  |
| Build                | Dual CJS + ESM con tipos (tsup)                         |
| Licencia             | MIT                                                     |

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
| Unit tests           | ✅     | ~320 tests (core)            |
| Integration tests    | ✅     | ~37 tests (core)             |
| React tests          | ✅     | 48 tests                     |
| Vue tests            | ✅     | 50 tests                     |
| WiFi tests           | ✅     | 32 tests                     |
| vCard tests          | ✅     | 45 tests                     |
| Compress tests       | ✅     | 65 tests                     |
| E2E tests            | ✅     | 41 tests con jsQR            |
| Cobertura statements | ✅     | 95.81%                       |
| Cobertura branches   | ✅     | 90.88%                       |
| Cobertura functions  | ✅     | 96.61%                       |
| TypeScript strict    | ✅     | `strict: true`               |
| Biome                | ✅     | Linting + formatting         |
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
packages/
├── core/                  # @qr-plus/core — motor QR zero-dep
│   └── src/
│       ├── index.ts       # Entry point + helper functions
│       ├── QRCode.ts      # Clase principal (orquestador)
│       ├── errors.ts      # Custom errors tipados
│       ├── types/         # Interfaces y tipos
│       ├── encoder/       # Numeric, Alphanumeric, Byte, ModeDetector
│       ├── correction/    # GaloisField, ReedSolomon
│       ├── patterns/      # Finder, Alignment, Timing, FormatInfo
│       ├── mask/          # MaskEvaluator (8 patrones + scoring)
│       ├── renderer/      # Canvas, SVG, Terminal
│       ├── constants/     # Tablas del estándar ISO
│       └── utils/         # Utilidades binarias
├── react/                 # @qr-plus/react — React 19 components + hook
│   └── src/
│       ├── types.ts       # Shared types
│       ├── useQRCode.ts   # Hook principal
│       ├── QRCode.tsx     # SVG component
│       ├── QRCodeCanvas.tsx # Canvas component
│       ├── QRCodeDownload.tsx # Download button
│       └── index.ts       # Public API
├── vue/                   # @qr-plus/vue — Vue 3 components + composable
│   └── src/
│       ├── types.ts       # Shared types (class instead of className)
│       ├── useQRCode.ts   # Composable (computed, MaybeRefOrGetter)
│       ├── QRCode.ts      # SVG component (defineComponent + h)
│       ├── QRCodeCanvas.ts # Canvas component (ref + watch)
│       ├── QRCodeDownload.ts # Download button (slots)
│       └── index.ts       # Public API
├── cli/                   # @qr-plus/cli — terminal tool
│   └── src/
│       └── index.ts       # CLI with commander
├── wifi/                  # @qr-plus/wifi — WiFi QR string builder
│   └── src/
│       ├── types.ts       # WifiConfig, WifiEncryption
│       ├── errors.ts      # WifiError
│       ├── builder.ts     # buildWifiString()
│       └── index.ts       # Public API
├── vcard/                 # @qr-plus/vcard — vCard QR string builder
│   └── src/
│       ├── types.ts       # VCardConfig, PhoneEntry, EmailEntry
│       ├── errors.ts      # VCardError
│       ├── builder.ts     # buildVCardString()
│       └── index.ts       # Public API
├── compress/              # @qr-plus/compress — QR-optimized compression
│   └── src/
│       ├── types.ts       # CompressConfig, CompressResult, constants
│       ├── errors.ts      # CompressError
│       ├── base45.ts      # Base45 codec (RFC 9285)
│       ├── deflate.ts     # DEFLATE adapter (Node zlib / Web Streams)
│       ├── compress.ts    # compress(), decompress()
│       └── index.ts       # Public API
└── e2e-tests/             # E2E verification with jsQR
```

---

## Distribución

### npm Packages

| Package | Version | Peer deps |
| --- | --- | --- |
| `@qr-plus/core` | 1.1.0 | — |
| `@qr-plus/react` | 1.0.0 | react ^19, react-dom ^19 |
| `@qr-plus/vue` | 1.0.0 | vue ^3.4 |
| `@qr-plus/cli` | 1.0.0 | — |
| `@qr-plus/wifi` | 1.0.0 | — |
| `@qr-plus/vcard` | 1.0.0 | — |
| `@qr-plus/compress` | 1.0.0 | — |
| `qr-pure` | 3.0.0 | — (deprecated compat wrapper) |

### Build Output (por paquete)

```
dist/
├── index.js       # ESM (react, cli) / CJS (core)
├── index.cjs      # CJS
├── index.d.ts     # TypeScript declarations
├── index.d.cts    # CTS declarations
└── *.map          # Source maps
```

---

## Pendientes (Backlog)

### Alta prioridad

- [ ] CHANGELOG.md con historial de versiones (react, cli)
- [ ] CI multi-versión Node (18, 20, 22)

### Media prioridad

- [ ] CLI v1.1: `--shape`, `--corner-radius`
- [ ] `@qr-plus/design-system` — presets visuales
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
pnpm run build          # Build all packages (Turborepo)
pnpm run test           # Run all tests (core + react + e2e)
pnpm run typecheck      # Type check all packages
pnpm run check          # Biome lint + format check
pnpm run docs           # Generate API docs (TypeDoc)
```

---

## Enlaces

| Recurso      | URL                                                      |
| ------------ | -------------------------------------------------------- |
| npm (core)   | https://www.npmjs.com/package/@qr-plus/core              |
| npm (react)  | https://www.npmjs.com/package/@qr-plus/react             |
| npm (vue)    | https://www.npmjs.com/package/@qr-plus/vue               |
| npm (cli)    | https://www.npmjs.com/package/@qr-plus/cli               |
| npm (wifi)   | https://www.npmjs.com/package/@qr-plus/wifi              |
| npm (vcard)  | https://www.npmjs.com/package/@qr-plus/vcard             |
| npm (compress)| https://www.npmjs.com/package/@qr-plus/compress         |
| GitHub       | https://github.com/jrodrigopuca/qr-code-generator        |
| API Docs     | https://jrodrigopuca.github.io/qr-code-generator/        |
| Issues       | https://github.com/jrodrigopuca/qr-code-generator/issues |

---

## Historial de Versiones Recientes

| Paquete  | Versión | Fecha    | Cambios principales                                        |
| -------- | ------- | -------- | ---------------------------------------------------------- |
| vue      | 1.0.0   | Apr 2026 | Initial release — Vue 3 components, composable, SVG-first  |
| compress | 1.0.0   | Apr 2026 | Initial release — DEFLATE + Base45 QR compression          |
| wifi     | 1.0.0   | Apr 2026 | Initial release — WiFi QR string builder                   |
| vcard    | 1.0.0   | Apr 2026 | Initial release — vCard QR string builder                  |
| core    | 1.1.0   | Apr 2026 | Fix convenience functions option forwarding                |
| react   | 1.0.0   | Apr 2026 | Initial release — components, hook, SVG-first              |
| core    | 1.0.0   | Mar 2026 | Rename from qr-pure to @qr-plus/core                      |
| cli     | 1.0.0   | Mar 2026 | Initial release — terminal, SVG, PNG output                |
| core    | 3.0.0*  | Mar 2026 | Monorepo migration (as qr-pure)                            |
| core    | 2.1.0*  | Feb 2026 | TypeDoc API docs, GitHub Pages deployment                  |
| core    | 2.0.5*  | Feb 2026 | First npm release as qr-pure, complete rewrite             |

*Versions 2.x-3.x were published under the `qr-pure` package name.

---

_Última actualización: Abril 2026_
