# Roadmap

Estado actual del proyecto y próximos pasos para publicar `qr-generator` en npm.

---

## Estado Actual (v2.0.5)

### Implementado

- **Codificación**: Numeric, Alphanumeric, Byte + detección automática de modo
- **Corrección de errores**: Reed-Solomon con GF(2^8), niveles L/M/Q/H
- **Matriz QR**: Finder, Alignment, Timing, Dark module, Format info, Version info (v≥7)
- **Máscaras**: 8 patrones + selección automática con scoring de penalización
- **Renderers**: Canvas (`render`, `toDataURL`, `toBlob`) y SVG (rects + optimized path)
- **Tests**: 201 unit/integration + E2E con jsQR
- **CI**: GitHub Actions (typecheck, lint, test, coverage, build, E2E)
- **Ejemplos**: Demo browser interactiva (Vite) + script Node.js
- **DX**: ESLint, Prettier, JSDoc en todo el código fuente, custom errors

---

## Fase 1: Preparar para publicación (Bloqueante)

Correcciones necesarias antes del primer `npm publish`.

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

### 2.1 CHANGELOG

Crear `CHANGELOG.md` con historial de versiones. Considerar [changesets](https://github.com/changesets/changesets) para automatizar.

### 2.2 Tests de renderers

`CanvasRenderer` y `SVGRenderer` no tienen tests. Agregar tests que verifiquen:

- Estructura SVG generada (parsear XML)
- Dimensiones y colores correctos
- Opciones de margen y tamaño

### 2.3 Cobertura al 80%+

Coverage actual configurado al 70%. Subir gradualmente a 80% en `vitest.config.ts`.

### 2.4 CI multi-versión

Agregar Node 18 y 20 a la matrix de GitHub Actions para garantizar compatibilidad con `engines: >=18`.

### 2.5 Workflow de publicación automática

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

### 3.1 Renderer de terminal (ASCII/Unicode)

Útil para Node.js CLI. Representar módulos con `██` / `  ` o caracteres Unicode de bloques.

```typescript
import { generateQR, TerminalRenderer } from "qr-generator";
const { matrix } = generateQR("hello");
console.log(TerminalRenderer.render(matrix));
```

### 3.2 Modo Kanji

El tipo `EncodingMode` ya incluye `kanji` y el mode indicator `"1000"` existe en constantes.
Falta implementar `KanjiEncoder` con codificación Shift JIS → 13 bits por carácter.

### 3.3 Módulos con formas personalizadas

Soporte para módulos redondeados, circulares o con puntos en el SVGRenderer:

```typescript
SVGRenderer.render(matrix, { moduleShape: "rounded" | "circle" | "dot" });
```

### 3.4 Embedding de logo

Insertar una imagen en el centro del QR aprovechando la redundancia de la corrección de errores (requiere nivel Q o H):

```typescript
SVGRenderer.render(matrix, { logo: { url: "logo.svg", size: 0.2 } });
```

### 3.5 Codificación multi-modo

Optimizar capacidad alternando modos dentro del mismo QR (ej: numérico + alfanumérico + byte) según el contenido.

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
[![npm](https://img.shields.io/npm/v/qr-generator)](https://www.npmjs.com/package/qr-generator)
[![CI](https://github.com/jrodrigopuca/qr-generator/actions/workflows/main.yml/badge.svg)](https://github.com/jrodrigopuca/qr-generator/actions)
[![codecov](https://codecov.io/gh/jrodrigopuca/qr-generator/branch/master/graph/badge.svg)](https://codecov.io/gh/jrodrigopuca/qr-generator)
```

---

## Fase 5: Avanzado (largo plazo)

Ideas que requieren investigación o cambios más significativos.

| Idea                                  | Complejidad | Notas                                                         |
| ------------------------------------- | ----------- | ------------------------------------------------------------- |
| ECI (Extended Channel Interpretation) | Alta        | Permite declarar charset explícito                            |
| Structured Append                     | Alta        | Dividir datos en múltiples QR enlazados                       |
| Micro QR                              | Alta        | Estándar ISO/IEC 18004 Annex I                                |
| CLI tool (`npx qr-generator "text"`)  | Baja        | Usar bin field en package.json + terminal renderer            |
| Bundle size tracking                  | Baja        | Integrar [size-limit](https://github.com/ai/size-limit) en CI |
| Benchmarks vs otras librerías         | Media       | Comparar con qrcode, qr-image, etc.                           |

---

## Resumen de prioridades

```
Publicar (Fase 1)  ████████████████████  Crítico — hacer primero
Calidad (Fase 2)   ███████████████░░░░░  Alta — inmediatamente después
Features (Fase 3)  ██████████░░░░░░░░░░  Media — incrementan adopción
Docs (Fase 4)      ████████░░░░░░░░░░░░  Media — incrementan confianza
Avanzado (Fase 5)  ████░░░░░░░░░░░░░░░░  Baja — según demanda
```
