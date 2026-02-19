# Roadmap

Estado actual del proyecto y próximos pasos para publicar `qr-pure` en npm.

---

## Estado Actual (v2.0.5)

### Implementado

- **Codificación**: Numeric, Alphanumeric, Byte + detección automática de modo
- **Corrección de errores**: Reed-Solomon con GF(2^8), niveles L/M/Q/H
- **Matriz QR**: Finder, Alignment, Timing, Dark module, Format info, Version info (v≥7)
- **Máscaras**: 8 patrones + selección automática con scoring de penalización
- **Renderers**: Canvas (`render`, `toDataURL`, `toBlob`) y SVG (rects + optimized path)
- **Tests**: 290 unit/integration (201 originales + 64 renderers + 25 utils) + E2E con jsQR
- **CI**: GitHub Actions (typecheck, lint, test, coverage, build, E2E)
- **Ejemplos**: Demo browser interactiva (Vite) + script Node.js
- **DX**: ESLint, Prettier, JSDoc en todo el código fuente, custom errors
- **Build dual CJS + ESM**: tsup configurado, genera ambos formatos con tipos
- **VERSION sincronizada**: constante `VERSION` alineada con `package.json`
- **Source maps**: habilitados en build
- **Publicado en npm**: primer `npm publish` realizado ✅

---

## ~~Fase 1: Preparar para publicación~~ ✅ Completada

~~Correcciones necesarias antes del primer `npm publish`.~~

### 1.1 Build dual CJS + ESM

`package.json` declara `"module": "dist/index.mjs"` pero solo se genera CJS con `tsc`.
Configurar **tsup** o **esbuild** para producir ambos formatos.

```bash
npm install -D tsup
```

```jsonc
// package.json
"scripts": {
  "build": "tsup src/index.ts --format cjs,esm --dts --clean"
}
```

**Prioridad**: Crítica — sin esto, los consumidores ESM reciben un import roto.

### 1.2 Sincronizar constante VERSION

`src/index.ts` exporta `VERSION = "1.0.0-alpha"` pero `package.json` dice `2.0.5`.
Usar un script de build o importar desde `package.json` para mantenerlo sincronizado.

### 1.3 Source maps

Habilitar `sourceMap: true` en tsconfig (o en tsup) para que los consumidores puedan depurar.

### 1.4 Verificar el paquete antes de publicar

```bash
npm pack --dry-run   # revisar qué archivos se incluirían
npx publint          # detectar errores comunes de packaging
npx are-the-types-wrong --pack .  # verificar que las declaraciones de tipos funcionen
```

### 1.5 Primer publish

```bash
npm login
npm publish --access public
```

---

## Fase 2: Calidad y confianza

### 2.1 CHANGELOG _(postergado)_

~~Crear `CHANGELOG.md` con historial de versiones.~~ Revisar en el futuro si adoptar [changesets](https://github.com/changesets/changesets) o un formato manual. No es bloqueante para las demás tareas.

### ~~2.2 Tests de renderers~~ ✅ Completado

64 tests agregados en `tests/unit/svg-renderer.test.ts` y `tests/unit/canvas-renderer.test.ts`:

- Estructura SVG (namespace, viewBox, dimensiones, rect de fondo)
- Colores dark/light en posición correcta
- Paths optimizados vs rects individuales
- Posicionamiento con margen y escala
- `toDataURL()`, `toBlob()` y manejo de errores
- `renderRounded()`: esquinas, cornerRadius, clamping
- `CanvasRenderer`: `calculateSize()`, `fillStyle` verificado, argumentos de `toDataURL`/`toBlob`

### 2.3 Cobertura al 80%+ _(en progreso)_

Cobertura actual tras agregar tests de renderers y `binary.ts` (threshold configurado en 70%):

| Módulo                | Statements | Branches | Lines    |
| --------------------- | ---------- | -------- | -------- |
| `CanvasRenderer`      | **100%**   | **100%** | **100%** |
| `src/utils/binary.ts` | **100%**   | **100%** | **100%** |
| `SVGRenderer`         | 82%        | 83%      | 81%      |
| `src/encoder`         | 99%        | 98%      | 99%      |
| `src/mask`            | 99%        | 93%      | 99%      |

Pendiente para alcanzar el 80% global:

- `SVGRenderer.createSVGElement()` y `SVGRenderer.download()` sin cubrir (líneas 213-216, 284-292) — requieren DOM real o E2E

Cuando se alcance el 80%, subir threshold en `vitest.config.ts`:

```ts
thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 }
```

### 2.4 CI multi-versión _(postergado)_

~~Agregar Node 18 y 20 a la matrix de GitHub Actions para garantizar compatibilidad con `engines: >=18`.~~

### 2.5 Workflow de publicación automática _(postergado)_

```yaml
# .github/workflows/publish.yml
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
          node-version: 22
          registry-url: https://registry.npmjs.org
      - run: npm ci && npm run build && npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Fase 3: Funcionalidades adicionales

Mejoras que aumentan el valor de la librería sin romper la API existente.

### ~~3.1 Renderer de terminal (ASCII/Unicode)~~ ✅ Completado

`TerminalRenderer` implementado con 3 estilos de renderizado:

- **unicode**: Bloques `██` / `  ` — mejor contraste
- **compact**: Medio bloque `▀▄█ ` — mitad de altura
- **ascii**: Caracteres `##` / `  ` — máxima compatibilidad

Opciones: `style`, `margin`, `invert` (para terminales con fondo oscuro).
Helper function `renderToTerminal()` agregada. 33 unit tests.

```typescript
import { generateQR, TerminalRenderer } from "qr-pure";
const { matrix } = generateQR("hello");
console.log(TerminalRenderer.render(matrix));
console.log(
	TerminalRenderer.render(matrix, { style: "compact", invert: true }),
);
```

### 3.2 Modo Kanji _(postergado)_

~~El tipo `EncodingMode` ya incluye `kanji` y el mode indicator `"1000"` existe en constantes.
Falta implementar `KanjiEncoder` con codificación Shift JIS → 13 bits por carácter.~~

### ~~3.3 Módulos con formas personalizadas~~ ✅ Completado

Soporte para 4 formas de módulos en `SVGRenderer` via `moduleShape`:

- **square** (default): Cuadrado estándar con paths optimizados
- **rounded**: Rectángulos con esquinas redondeadas (`cornerRadius` 0-1)
- **circle**: Círculos inscritos (radio = 50% del módulo)
- **dot**: Puntos más pequeños (radio = 40% del módulo)

Tipo `ModuleShape` y opción `cornerRadius` exportados. 29 unit tests.
Demo browser actualizada con selector de forma (auto-switch a SVG).

```typescript
SVGRenderer.render(matrix, { moduleShape: "rounded", cornerRadius: 0.3 });
SVGRenderer.render(matrix, { moduleShape: "circle" });
SVGRenderer.render(matrix, { moduleShape: "dot" });
```

### 3.4 Embedding de logo _(próximamente)_

Insertar una imagen en el centro del QR aprovechando la redundancia de la corrección de errores (requiere nivel Q o H):

```typescript
SVGRenderer.render(matrix, { logo: { url: "logo.svg", size: 0.2 } });
```

### 3.5 Codificación multi-modo _(postergado)_

~~Optimizar capacidad alternando modos dentro del mismo QR (ej: numérico + alfanumérico + byte) según el contenido.~~

---

## Fase 4: Documentación y comunidad

### 4.1 Actualizar `docs/technical.md`

El documento técnico aún referencia la arquitectura monolítica original (`src/qr.ts`, `js/canvas.js`).
Actualizar para reflejar la estructura modular actual.

### 4.2 Generación de API docs

Configurar [TypeDoc](https://typedoc.org) para generar documentación a partir de JSDoc:

```bash
npm install -D typedoc
npx typedoc src/index.ts --out docs/api
```

Publicar en GitHub Pages.

### 4.3 CONTRIBUTING.md

Guía de contribución con:

- Cómo levantar el proyecto
- Convenciones de código
- Proceso de PR
- Cómo correr los tests

### 4.4 Badges en README

```markdown
[![npm](https://img.shields.io/npm/v/qr-pure)](https://www.npmjs.com/package/qr-pure)
[![CI](https://github.com/jrodrigopuca/qr-code-generator/actions/workflows/main.yml/badge.svg)](https://github.com/jrodrigopuca/qr-code-generator/actions)
[![codecov](https://codecov.io/gh/jrodrigopuca/qr-code-generator/branch/master/graph/badge.svg)](https://codecov.io/gh/jrodrigopuca/qr-code-generator)
```

---

## Fase 5: Avanzado (largo plazo)

Ideas que requieren investigación o cambios más significativos.

| Idea                                  | Complejidad | Notas                                                         |
| ------------------------------------- | ----------- | ------------------------------------------------------------- |
| ECI (Extended Channel Interpretation) | Alta        | Permite declarar charset explícito                            |
| Structured Append                     | Alta        | Dividir datos en múltiples QR enlazados                       |
| Micro QR                              | Alta        | Estándar ISO/IEC 18004 Annex I                                |
| CLI tool (`npx qr-pure "text"`)       | Baja        | Usar bin field en package.json + terminal renderer            |
| Bundle size tracking                  | Baja        | Integrar [size-limit](https://github.com/ai/size-limit) en CI |
| Benchmarks vs otras librerías         | Media       | Comparar con qrcode, qr-image, etc.                           |

---

## Resumen de prioridades

```
~~Publicar (Fase 1)  ████████████████████  Crítico — ✅ COMPLETADO~~
Calidad (Fase 2)   ███████████████░░░░░  Alta — inmediatamente después
Features (Fase 3)  ██████████░░░░░░░░░░  Media — incrementan adopción
Docs (Fase 4)      ████████░░░░░░░░░░░░  Media — incrementan confianza
Avanzado (Fase 5)  ████░░░░░░░░░░░░░░░░  Baja — según demanda
```
