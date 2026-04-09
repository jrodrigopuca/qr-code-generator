# FUTURE — Ecosistema y expansión de `@qr-plus`

> Última actualización: 2026-04-07
> Estado: documento estratégico para evolución del proyecto

---

## 1. Propósito de este documento

Este archivo documenta posibles herramientas hermanas, paquetes complementarios y líneas de expansión para `@qr-plus`.

La idea NO es convertir esto en una lista infinita de ideas lindas pero inútiles. La idea es identificar extensiones que:

1. aprovechen el core actual,
2. aumenten adopción,
3. creen un ecosistema coherente,
4. puedan ejecutarse por etapas.

`@qr-plus` ya tiene una base fuerte:

- core QR sin dependencias runtime (`@qr-plus/core`),
- soporte de generación real y estable (ISO/IEC 18004),
- renderers para SVG (con shapes), Canvas y terminal,
- CLI funcional con soporte SVG, PNG y terminal (`@qr-plus/cli`),
- monorepo con pnpm workspaces + Turborepo,
- testing sólido con Vitest,
- linting y formato con Biome,
- documentación y build maduros (tsup, TypeScript 6).

Entonces la pregunta correcta no es "¿qué más podemos hacer?".

La pregunta correcta es:

**¿qué piezas hermanas multiplican el valor del core sin romper su simplicidad?**

---

## 2. Decisiones ya tomadas

Antes de entrar a las propuestas, conviene documentar las decisiones estructurales que ya se resolvieron desde la primera versión de este documento.

### 2.1 Nombre y scope

El proyecto se renombró de `qr-pure` a **`@qr-plus`** (scope npm).

- `@qr-plus/core` — motor QR (antes `qr-pure`)
- `@qr-plus/cli` — herramienta CLI (antes propuesta como `qr-pure-cli`)
- `qr-pure` — paquete de compatibilidad que re-exporta `@qr-plus/core` (deprecated)

Todo paquete nuevo debería seguir la convención `@qr-plus/<nombre>`.

### 2.2 Monorepo

Se resolvió la pregunta monorepo vs multirepo: es **monorepo**.

- Workspace: pnpm workspaces (`packages/*`)
- Orquestación: Turborepo
- Build: tsup por paquete
- Testing: Vitest (core), Node.js vanilla (e2e)

### 2.3 Policy de dependencias

- **Core (`@qr-plus/core`)**: zero runtime dependencies. Esto no se negocia.
- **Paquetes satélite**: pueden tener dependencias, pero mínimas y justificadas.
- **CLI (`@qr-plus/cli`)**: solo `commander` como dependencia runtime.

### 2.4 Tooling

- Linting/formato: **Biome** (reemplazó ESLint + Prettier)
- TypeScript: **6.0.2**
- Build: **tsup**
- Testing: **Vitest 4**

---

## 3. Principios para expandir el ecosistema

### 3.1 El core debe seguir siendo pequeño

`@qr-plus/core` debería seguir enfocado en:

- generación de matriz QR,
- renderizado general,
- API estable y portable.

No conviene meter en el core cosas como:

- analytics,
- tracking,
- UI específica de frameworks,
- integraciones con servicios,
- lógica de negocio de formatos de dominio.

Eso pertenece a paquetes satélite.

### 3.2 Paquetes hermanos > core inflado

Mejor estrategia:

- `@qr-plus/core` = motor,
- paquetes complementarios = adaptadores / DX / verticales.

Eso mantiene la librería principal limpia y a la vez abre camino a monetización, comunidad y especialización.

### 3.3 Priorizar por impacto real

No todas las ideas tienen el mismo valor.

Conviene priorizar lo que cumpla al menos uno de estos objetivos:

- aumentar adopción,
- resolver casos de uso frecuentes,
- mejorar DX,
- habilitar nuevos canales de distribución.

---

## 4. Visión del ecosistema

```text
                        ┌─────────────────────┐
                        │   @qr-plus/core     │
                        │   zero-dep engine    │
                        └──────────┬──────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
   │ @qr-plus/cli │        │ @qr-plus/    │        │ @qr-plus/    │
   │   ✅ DONE     │        │   react      │        │   server     │
   └──────────────┘        │   ✅ DONE     │        └──────────────┘
                           └──────────────┘
          │                        │                        │
          ├──────────────┐         │         ┌──────────────┤
          ▼              ▼         ▼         ▼              ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ @qr-plus/    │ │ @qr-plus/    │ │ @qr-plus/    │ │ @qr-plus/    │
   │   wifi       │ │   vcard      │ │   pdf        │ │   reader     │
   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │ @qr-plus/    │
                                                    │   secure     │
                                                    └──────────────┘
```

---

## 5. Paquetes ya implementados

### 5.1 `@qr-plus/cli` — ✅ Completado

**Estado: publicado en npm v1.0.0**

El CLI fue la primera expansión del ecosistema, tal como recomendaba este documento.

#### Lo implementado

| Feature | Estado |
| --- | --- |
| Comando básico (`qr-plus <content>`) | ✅ |
| Format terminal | ✅ |
| Format SVG | ✅ |
| Format PNG (zero-dep encoder propio) | ✅ |
| Output a archivo (`--output`) | ✅ |
| Auto-detección de formato por extensión | ✅ |
| Error correction level (`--ecl`) | ✅ |
| Size presets (small/medium/large) | ✅ |
| Colores custom (`--dark-color`, `--light-color`) | ✅ |
| Terminal styles (unicode/compact/ascii) | ✅ |
| Invert (`--invert`) | ✅ |

#### Nota sobre PNG

El documento original sugería que PNG podría requerir "un wrapper Node usando canvas externo". En la práctica, se implementó un **encoder PNG zero-dependency** dentro del CLI (store-only deflate, CRC32, Adler32, chunks IHDR/IDAT/IEND). Esto mantiene al CLI ligero y sin dependencias de canvas nativo.

#### Lo pendiente del CLI (mejoras futuras)

Estas features estaban en la propuesta original y siguen siendo válidas para una v2:

| Feature | Prioridad |
| --- | --- |
| `--shape` (module shapes: rounded, circle, dot) | Media |
| `--corner-radius` | Media |
| `--version` (QR version manual) | Baja |
| `--mask` (mask pattern manual) | Baja |
| `--mode` (encoding mode manual) | Baja |
| `--json` (metadata output) | Media |
| `--stdin` (pipe input) | Media |
| `qr-plus batch <file>` (batch mode) | Media |
| `qr-plus info <content>` (QR info) | Baja |
| Scale/margin como valores numéricos directos | Baja |

---

### 5.2 `@qr-plus/react` — ✅ Completado

**Estado: publicado en npm v1.0.0**

El React wrapper fue la segunda expansión del ecosistema y la de mayor impacto potencial.

#### Decisiones de diseño

- **React 19 only** — peer dependency `react ^19.0.0`. No `forwardRef` (ref como prop), no `useMemo`/`useCallback` manual (React Compiler).
- **SVG-first** — `<QRCode />` renderiza SVG por defecto. Canvas es opt-in vía `<QRCodeCanvas />`.
- **Usa renderers directamente** — no usa las convenience functions (`renderToSVG`/`renderToCanvas`) porque necesita acceso a la matrix para caching, `toDataURL()`, y cálculo de `scale` a partir de `size`.
- **PNG download sin dependencias extra** — pipeline client-side: SVG → Blob → Image → Canvas offscreen → `canvas.toBlob("image/png")`.

#### Lo implementado

| Feature | Estado |
| --- | --- |
| `<QRCode />` — SVG component | ✅ |
| `<QRCodeCanvas />` — Canvas component | ✅ |
| `<QRCodeDownload />` — Download button | ✅ |
| `useQRCode()` hook | ✅ |
| Module shapes (square, rounded, circle, dot) | ✅ |
| Corner radius | ✅ |
| Custom colors | ✅ |
| Size → scale mapping (post-generation) | ✅ |
| SVG data URL output | ✅ |
| SVG download | ✅ |
| PNG download (client-side) | ✅ |
| Error handling | ✅ |
| Full TypeScript types | ✅ |
| 48 unit tests | ✅ |
| README con documentación completa | ✅ |

#### Lo pendiente de React (mejoras futuras v2)

| Feature | Prioridad |
| --- | --- |
| Logo/image overlay en el centro | Media |
| Animation support | Baja |
| `onGenerated` callback | Baja |
| React 18 compat (si hay demanda) | Baja |

---

## 6. Propuestas de herramientas hermanas

### 6.1 ~~`@qr-plus/react`~~ — ✅ Implementado

> Ver sección 5.2. Publicado como `@qr-plus/react` v1.0.0 en npm.
> La propuesta original se cumplió con ajustes: React 19 only (no 18), SVG-first (no `renderer` prop),
> componentes separados en vez de prop-switching, hook con download integrado.

---

### 6.2 `@qr-plus/wifi`

#### Objetivo

Resolver correctamente el formato estándar de QRs para conexión WiFi.

#### Por qué tiene sentido

Es uno de los formatos más usados en el mundo real y evita que cada usuario arme strings a mano.

#### API sugerida

```ts
import { wifiQR, buildWifiString } from "@qr-plus/wifi";

const result = wifiQR({
  ssid: "MyNetwork",
  password: "super-secret",
  encryption: "WPA",
  hidden: false,
});

const content = buildWifiString({
  ssid: "MyNetwork",
  password: "super-secret",
  encryption: "WPA",
});
```

#### Valor agregado

- validación de campos,
- escaping correcto,
- tipado,
- helpers listos para usar con `generateQR()` o `SVGRenderer.render()`.

#### Complejidad

**Baja**.

#### Impacto

**Medio**.

#### Recomendación

Gran candidato de corto plazo porque aporta valor con poco esfuerzo.

---

### 6.3 `@qr-plus/vcard`

#### Objetivo

Generar QRs de contacto con formato vCard válido.

#### API sugerida

```ts
import { vcardQR, buildVCardString } from "@qr-plus/vcard";

const qr = vcardQR({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1234567890",
  organization: "Acme Inc",
  title: "Engineer",
  website: "https://example.com",
});
```

#### Valor agregado

- formato estándar consistente,
- orden correcto de campos,
- sanitización,
- soporte para campos opcionales,
- helpers listos para render.

#### Complejidad

**Baja** a **media**.

#### Impacto

**Medio**.

#### Recomendación

Muy buena dupla junto con `@qr-plus/wifi`.

---

### 6.4 `@qr-plus/reader`

#### Objetivo

Expandir el ecosistema hacia la lectura/decodificación de códigos QR.

#### Por qué tiene sentido

Acá cerrás el ciclo completo:

- generar,
- renderizar,
- leer,
- validar.

Eso transforma `@qr-plus` de una librería puntual a una plataforma QR más completa.

#### Casos de uso

- escaneo desde webcam,
- validación de QRs emitidos por la propia librería,
- kioscos,
- apps internas,
- check-in de eventos,
- tools de testing.

#### APIs posibles

```ts
import { readQRFromImage, readQRFromCanvas, QRScanner } from "@qr-plus/reader";

const result = await readQRFromImage(file);

const result2 = readQRFromCanvas(canvas);

const scanner = new QRScanner(videoElement, {
  onScan(data) {
    console.log(data);
  },
});
scanner.start();
```

#### Dos estrategias posibles

##### Estrategia A — wrapper sobre decoder existente

Usar algo como `jsQR` internamente.

**Pros:**

- salida rápida,
- bajo riesgo,
- foco en API y DX.

**Contras:**

- ya no sería zero-dependency,
- dependés de un tercero,
- diferenciación menor.

##### Estrategia B — decoder propio

Implementar pipeline propio de lectura.

**Pros:**

- control total,
- posible zero-dependency,
- gran valor técnico.

**Contras:**

- complejidad alta,
- mucho laburo matemático y de visión,
- testing bastante más duro.

#### Recomendación

Si se encara, conviene arrancar como **wrapper estable sobre `jsQR`** y recién después evaluar decoder propio.

#### Complejidad

**Alta**.

#### Impacto

**Alto**.

---

### 6.5 `@qr-plus/server`

#### Objetivo

Ofrecer un microservicio HTTP para generación server-side.

#### Por qué tiene sentido

Hay muchísimos equipos que no quieren integrar una librería: quieren un endpoint.

Ejemplo real:

- backend genera QRs para tickets,
- CMS genera SVGs bajo demanda,
- plataforma de marketing emite assets,
- sistemas legacy consumen una API.

#### Endpoints sugeridos

```http
GET /qr?data=hello&format=svg
GET /qr?data=hello&format=json
POST /qr
POST /qr/batch
GET /health
```

#### Contrato posible

##### `POST /qr`

```json
{
  "data": "https://example.com",
  "format": "svg",
  "errorCorrectionLevel": "H",
  "moduleShape": "rounded",
  "scale": 10
}
```

#### Respuestas posibles

- `image/svg+xml`
- `application/json`
- `application/octet-stream`

#### Features de plataforma

- rate limiting,
- caching,
- auth opcional,
- batch generation,
- Docker image,
- deploy templates para Railway / Fly / Render / Vercel.

#### Stack sugerido

- `fastify` por performance y tipado,
- `zod` para validar payloads,
- `pino` para logs.

#### Complejidad

**Media**.

#### Impacto

**Medio**.

#### Recomendación

Tiene sentido si querés abrir un camino B2B o self-hosted.

---

### 6.6 `@qr-plus/pdf`

#### Objetivo

Resolver generación de documentos PDF que contengan uno o múltiples QRs.

#### Casos de uso

- hojas de etiquetas,
- credenciales,
- facturas,
- cupones,
- tickets,
- inventario y logística.

#### API sugerida

```ts
import { generateQRSheet, generateInvoicePDF } from "@qr-plus/pdf";

const pdf = await generateQRSheet({
  items: [
    { value: "SKU-001", label: "Producto 1" },
    { value: "SKU-002", label: "Producto 2" },
  ],
  layout: "avery-5160",
  qr: {
    errorCorrectionLevel: "M",
    moduleShape: "square",
  },
});
```

#### Estrategia técnica

No meter PDF en el core. Nunca.

Este paquete debería usar:

- SVG como formato fuente,
- y una dependencia específica de PDF.

#### Dependencias posibles

- `pdf-lib`
- `pdfkit`

#### Complejidad

**Media**.

#### Impacto

**Medio**.

#### Recomendación

Interesante si aparece demanda real en operaciones, logística o ventas.

---

### 6.7 `@qr-plus/design-system`

#### Objetivo

Ofrecer presets visuales listos para usar sobre los renderers actuales.

#### Por qué tiene sentido

Muchos devs quieren "que se vea lindo" pero no saben diseñar un QR custom sin romper legibilidad.

#### Ejemplo de uso

```ts
import { presets } from "@qr-plus/design-system";
import { SVGRenderer } from "@qr-plus/core";

const svg = SVGRenderer.render(matrix, presets.modernRounded);
```

#### Posibles presets

- `minimal`
- `modernRounded`
- `corporate`
- `playful`
- `highContrast`

#### Valor agregado

- acelera adopción,
- mejora output visual,
- sirve como showcase del renderer SVG.

#### Complejidad

**Baja**.

#### Impacto

**Medio**.

#### Recomendación

Buen complemento cuando exista más demanda de customización visual.

---

### 6.8 `@qr-plus/analytics`

#### Objetivo

Ofrecer QRs con tracking y capa analítica.

#### Aclaración importante

Esto **no** es solo generar el QR. Acá entrás en terreno de producto:

- redirecciones,
- persistencia,
- dashboard,
- métricas,
- privacidad,
- fraude,
- links dinámicos.

#### Por qué puede ser valioso

Porque los equipos de marketing no quieren solo un QR. Quieren saber:

- cuántas veces se escaneó,
- desde dónde,
- cuándo,
- si el destino convierte.

#### Posible arquitectura

1. generar URL corta/trackeada,
2. esa URL redirige al destino real,
3. registrar evento,
4. mostrar métricas en panel.

#### Complejidad

**Alta**.

#### Impacto

**Alto**, pero mucho más producto que librería.

#### Recomendación

No es de corto plazo. Conviene pensarlo recién cuando el core y los paquetes básicos estén consolidados.

---

### 6.9 `@qr-plus/figma`

#### Objetivo

Crear un plugin para diseñadores que use el motor de `@qr-plus` dentro de Figma.

#### Casos de uso

- posters,
- packaging,
- flyers,
- piezas para redes,
- credenciales,
- layouts para impresión.

#### Features útiles

- generar QR desde texto o URL,
- personalizar colores,
- cambiar forma de módulos,
- actualizar el nodo sin recrearlo,
- presets visuales.

#### Valor estratégico

Esto abre otro público:

- diseñadores,
- equipos de branding,
- agencias.

#### Complejidad

**Media**.

#### Impacto

**Medio**.

#### Recomendación

Muy interesante como canal de adopción, pero no antes del wrapper React.

---

### 6.10 `@qr-plus/secure`

#### Objetivo

Agregar capacidades de firma, verificación y eventualmente cifrado para casos donde el QR representa algo sensible.

#### Casos de uso

- tickets,
- credenciales,
- invitaciones verificables,
- documentos emitidos,
- vouchers o cupones antifraude.

#### Posible API

```ts
import { createSignedQR, verifySignedQR } from "@qr-plus/secure";

const token = createSignedQR({
  payload: {
    ticketId: "evt_123",
    seat: "A-12",
  },
  privateKey,
});

const verification = verifySignedQR(token, publicKey);
```

#### Advertencia importante

Esto es delicado. Seguridad mal hecha es peor que no tener seguridad.

Si se hace, hay que hacerlo con:

- primitives serias,
- librerías auditadas,
- mensajes claros,
- documentación brutalmente precisa.

#### Complejidad

**Alta**.

#### Impacto

**Nicho**, pero muy valioso en verticales específicos.

#### Recomendación

No es prioridad de corto plazo.

---

## 7. Otras integraciones posibles

Estas no son prioridad, pero vale documentarlas.

### 7.1 `@qr-plus/vue`

- Wrapper idiomático para Vue.

### 7.2 `@qr-plus/svelte`

- Wrapper idiomático para Svelte.

### 7.3 `@qr-plus/solid`

- Wrapper idiomático para Solid.

### 7.4 `@qr-plus/next`

- Helpers específicos para App Router, Server Components y generación edge/server.

### 7.5 `@qr-plus/bench`

- Suite de benchmarks comparando `@qr-plus/core` contra otras librerías del ecosistema.

---

## 8. Priorización sugerida

### 8.1 Matriz de valor

| Iniciativa | Esfuerzo | Impacto | Horizonte | Prioridad | Estado |
| --- | --- | --- | --- | --- | --- |
| `@qr-plus/cli` | Bajo | Alto | — | — | ✅ Completado |
| `@qr-plus/react` | Medio | Muy alto | — | — | ✅ Completado |
| `@qr-plus/wifi` | Bajo | Medio | Corto plazo | 1 | Pendiente |
| `@qr-plus/vcard` | Bajo/Medio | Medio | Corto plazo | 2 | Pendiente |
| `@qr-plus/server` | Medio | Medio | Mediano plazo | 3 | Pendiente |
| `@qr-plus/design-system` | Bajo | Medio | Mediano plazo | 4 | Pendiente |
| `@qr-plus/pdf` | Medio | Medio | Mediano plazo | 5 | Pendiente |
| `@qr-plus/reader` | Alto | Alto | Mediano/Largo plazo | 6 | Pendiente |
| `@qr-plus/figma` | Medio | Medio | Largo plazo | 7 | Pendiente |
| `@qr-plus/secure` | Alto | Nicho | Largo plazo | 8 | Pendiente |
| `@qr-plus/analytics` | Alto | Alto | Largo plazo | 9 | Pendiente |

---

## 9. Roadmap recomendado

### Fase A — Expansión inmediata (parcialmente completada)

Objetivo: aumentar adopción con poco esfuerzo.

#### Completado

1. ✅ `@qr-plus/cli` — publicado v1.0.0

#### Pendiente

2. `@qr-plus/wifi`
3. `@qr-plus/vcard`

#### Resultado esperado

- más casos de uso reales,
- más facilidad de prueba,
- mejor posicionamiento del proyecto.

---

### Fase B — Integración con frontend (completada)

Objetivo: entrar de lleno al ecosistema de apps web.

#### Completado

1. ✅ `@qr-plus/react` — publicado v1.0.0

#### Pendiente

2. presets visuales básicos o `@qr-plus/design-system`

---

### Fase C — Plataforma

Objetivo: habilitar uso server-side y procesos documentales.

#### Iniciativas

1. `@qr-plus/server`
2. `@qr-plus/pdf`

#### Resultado esperado

- utilidad para equipos internos,
- uso empresarial más claro,
- posibilidad de self-hosted.

---

### Fase D — Expansión avanzada

Objetivo: convertir el ecosistema en una plataforma más completa.

#### Iniciativas

1. `@qr-plus/reader`
2. `@qr-plus/secure`
3. `@qr-plus/analytics`
4. `@qr-plus/figma`

---

## 10. Recomendación ejecutiva

Si hubiera que elegir **los tres próximos movimientos inteligentes**, deberían ser estos:

### 1. `@qr-plus/wifi` + `@qr-plus/vcard`

Porque convierten el motor en soluciones concretas de uso diario. Quick wins con alto valor percibido.

### 2. `@qr-plus/cli` v2 (mejoras)

Porque exponer module shapes (`--shape`, `--corner-radius`), stdin y batch en el CLI ya existente es trabajo incremental con buen retorno.

### 3. `@qr-plus/design-system`

Presets visuales listos para usar. Complementa React y el CLI, y sirve como showcase del renderer SVG.

Eso te consolida un ecosistema creciente:

- core sólido y zero-dep,
- entrada por terminal (ya hecha),
- entrada por frontend (React),
- soluciones concretas de negocio (WiFi, vCard).

Y eso, te digo la verdad, YA empieza a parecer una familia de productos y no solo una librería aislada.

---

## 11. Estado de decisión actual

Al día de hoy, la recomendación estratégica es:

- mantener `@qr-plus/core` como motor central zero-dep,
- seguir evolucionando `@qr-plus/cli` con features incrementales (shapes, stdin, batch),
- ~~avanzar con `@qr-plus/react` como próxima prioridad~~ ✅ Completado v1.0.0,
- complementar con `@qr-plus/wifi` y `@qr-plus/vcard` como quick wins,
- postergar analytics, secure y reader hasta tener más señales de uso real,
- mantener el paquete `qr-pure` como compat wrapper hasta que la migración de usuarios se complete.

---

## 12. Próximos pasos sugeridos

Cuando se retome este documento, el orden lógico sería:

1. convertir las propuestas pendientes en issues o milestones en GitHub,
2. arrancar con `@qr-plus/wifi` y `@qr-plus/vcard` como quick wins,
3. agregar `--shape` y `--corner-radius` al CLI (v1.1),
4. evaluar `@qr-plus/design-system` como complemento visual.

### Preguntas que conviene resolver antes de implementar

- ¿WiFi y vCard deben exponer helpers puros (string builders) además del QR generado?
- ¿cuándo deprecar formalmente el paquete `qr-pure` compat?
- ¿qué paquete tiene mejor relación esfuerzo/impacto para el próximo release?

---

Fin del documento.
