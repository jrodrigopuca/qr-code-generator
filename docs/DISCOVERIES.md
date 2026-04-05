# DISCOVERIES — Hallazgos durante la implementación de `@qr-plus/react`

> Fecha: 2026-04-05
> Contexto: Implementación del paquete `@qr-plus/react` (componentes + hook para React 19)

---

## Propósito

Este documento registra descubrimientos técnicos que surgieron al construir `@qr-plus/react` sobre `@qr-plus/core`. No son opiniones — son hallazgos verificados en el código que afectaron decisiones de diseño y que requieren acción.

---

## 1. 🐛 BUG: Funciones de conveniencia del core no forwardean opciones de renderer

### Qué pasa

Las funciones helper `renderToSVG()` y `renderToCanvas()` en `@qr-plus/core/src/index.ts` **no forwardean** las opciones específicas de sus respectivos renderers.

### Evidencia

#### `renderToSVG()` — líneas 185-205 de `packages/core/src/index.ts`

```typescript
// La firma acepta QRCodeOptions & RenderOptions
// PERO SVGRenderer.render() acepta SVGRenderOptions (que extiende RenderOptions)
export function renderToSVG(
  content: string,
  options?: QRCodeOptions & RenderOptions, // ← tipo incorrecto
): string {
  const renderOptions: RenderOptions = {
    scale: options?.scale,
    margin: options?.margin,
    darkColor: options?.darkColor,
    lightColor: options?.lightColor,
    // ❌ FALTAN: moduleShape, cornerRadius, xmlDeclaration, optimizePaths
  };
  return SVGRenderer.render(result.matrix, renderOptions);
}
```

**Opciones perdidas:**
- `moduleShape` — forma de módulos (square, rounded, circle, dot)
- `cornerRadius` — radio de esquinas para 'rounded'
- `xmlDeclaration` — inclusión de declaración XML
- `optimizePaths` — optimización de paths para 'square'

#### `renderToCanvas()` — líneas 144-165 de `packages/core/src/index.ts`

```typescript
// Misma situación: solo forwardea RenderOptions base
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  content: string,
  options?: QRCodeOptions & RenderOptions, // ← tipo incorrecto
): void {
  const renderOptions: RenderOptions = {
    scale: options?.scale,
    margin: options?.margin,
    darkColor: options?.darkColor,
    lightColor: options?.lightColor,
    // ❌ No hay forma de acceder a CanvasRenderer.renderRounded()
  };
  CanvasRenderer.render(canvas, result.matrix, renderOptions);
}
```

**Funcionalidad inaccesible:**
- `renderRounded()` — no hay forma de activar el modo rounded desde la función helper
- El usuario que use `renderToCanvas()` está limitado a módulos cuadrados

### Impacto

- Un usuario que use `renderToSVG("hello", { moduleShape: "rounded" })` **no obtiene módulos redondeados**. TypeScript ni siquiera permite pasar la opción porque el tipo es `RenderOptions`, no `SVGRenderOptions`.
- Un usuario que quiera canvas con esquinas redondeadas **no puede** usar `renderToCanvas()` — tiene que usar `CanvasRenderer.renderRounded()` directamente.
- Esto es particularmente confuso porque el JSDoc de las funciones dice que son helpers para "uso simple", pero el uso simple de módulos redondeados no funciona.

### Workaround actual

En `@qr-plus/react`, se usa `SVGRenderer.render()` y `CanvasRenderer.render()`/`CanvasRenderer.renderRounded()` directamente, bypaseando las funciones de conveniencia.

### Fix recomendado

1. **`renderToSVG()`**: Cambiar la firma a `QRCodeOptions & SVGRenderOptions` y forwardear todas las opciones SVG.
2. **`renderToCanvas()`**: Agregar soporte para `moduleShape` y `cornerRadius`. Cuando `moduleShape === "rounded"`, llamar a `CanvasRenderer.renderRounded()` internamente.
3. Agregar tests para las opciones faltantes.

### Severidad

**Media-Alta**. Es un bug funcional silencioso — el código no falla, simplemente ignora opciones. El usuario no recibe feedback de que sus opciones no están siendo aplicadas.

### Issue

Pendiente de creación en GitHub.

---

## 2. Canvas renderer tiene shapes limitados vs SVG

### Qué pasa

`CanvasRenderer` solo soporta 2 shapes de módulo:
- **square** — vía `CanvasRenderer.render()`
- **rounded** — vía `CanvasRenderer.renderRounded()` (método separado)

`SVGRenderer` soporta 4 shapes:
- **square**, **rounded**, **circle**, **dot**

### Impacto en diseño

Por esto `@qr-plus/react` es **SVG-first** — es el renderer más completo. El componente `<QRCodeCanvas />` documenta explícitamente la limitación: "For circle/dot shapes, use `<QRCode />` (SVG)."

### Nota adicional

El `renderRounded()` no es una opción de `render()` sino un método completamente separado. Esto obligó a un `if (moduleShape === "rounded")` en `QRCodeCanvas.tsx` para decidir qué método llamar.

### Acción futura

Considerar unificar la API de `CanvasRenderer` para que `render()` acepte `moduleShape` como opción (al menos para los shapes que soporta), en vez de tener dos métodos separados.

---

## 3. El mapeo `size` → `scale` requiere post-generación

### Qué pasa

Los usuarios piensan en **píxeles** (`size={300}`), pero los renderers del core trabajan con **scale** (píxeles por módulo). La fórmula de conversión es:

```
scale = size / (matrixSize + margin * 2)
```

El problema: `matrixSize` solo se conoce **después** de generar el QR (depende de la versión, que puede ser auto-detectada).

### Impacto en diseño

El hook `useQRCode` ejecuta la generación primero, obtiene `result.size`, y recién entonces calcula `scale`. Esto oculta el concepto de "módulos" completamente del usuario de React.

```typescript
// En useQRCode.ts
const result = qr.generate();
const svgOptions = buildSVGOptions(options, result.size);
// buildSVGOptions calcula: scale = size / (result.size + margin * 2)
```

### Nota

Este no es un bug del core — es una consecuencia natural de la API. Pero es un patrón que cualquier wrapper va a necesitar implementar, así que vale documentarlo.

---

## 4. PNG download sin dependencias extra

### Qué pasa

La descarga como PNG se implementó client-side con un pipeline 100% browser API:

```
SVG string → Blob → URL.createObjectURL() → Image.onload → Canvas offscreen → canvas.toBlob("image/png")
```

### Por qué importa

- Cero dependencias adicionales para PNG en el paquete React
- No se necesitó `canvas` (node-canvas) ni ningún binario nativo
- Funciona en cualquier browser moderno

### Limitación

Este approach solo funciona en el browser. Para server-side PNG generation, se necesitaría otra estrategia (como el encoder zero-dep que usa `@qr-plus/cli`).

---

## 5. `SVGRenderer.toDataURL()` existe y es útil

### Qué pasa

El core ya expone `SVGRenderer.toDataURL(matrix, options)` que devuelve un data URL base64 listo para usar como `src` de un `<img>`. Esto no estaba mencionado en la documentación principal del core pero es extremadamente útil para el hook.

### Cómo se usa

```typescript
const svgDataURL = SVGRenderer.toDataURL(matrix, svgOptions);
// Resultado: "data:image/svg+xml;base64,PHN2Zy..."
// Usable como: <img src={svgDataURL} alt="QR Code" />
```

---

## Resumen de acciones pendientes

| # | Hallazgo | Tipo | Acción |
|---|---|---|---|
| 1 | Funciones de conveniencia no forwardean opciones | Bug | Fix en core + tests |
| 2 | Canvas shapes limitados vs SVG | Limitación conocida | Documentar + considerar API unificada |
| 3 | Mapeo size→scale post-generación | Patrón de diseño | Documentar para wrappers futuros |
| 4 | PNG download sin deps extra | Descubrimiento positivo | — |
| 5 | `SVGRenderer.toDataURL()` disponible | Descubrimiento positivo | Mejorar docs del core |
