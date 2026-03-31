# FUTURE — Ecosistema y expansión de `qr-pure`

> Última actualización: 2026-03-21
> Estado: documento estratégico para evolución del proyecto

---

## 1. Propósito de este documento

Este archivo documenta posibles herramientas hermanas, paquetes complementarios y líneas de expansión para `qr-pure`.

La idea NO es convertir esto en una lista infinita de ideas lindas pero inútiles. La idea es identificar extensiones que:

1. aprovechen el core actual,
2. aumenten adopción,
3. creen un ecosistema coherente,
4. puedan ejecutarse por etapas.

`qr-pure` ya tiene una base fuerte:

- core QR sin dependencias runtime,
- soporte de generación real y estable,
- renderers para SVG, Canvas y terminal,
- testing sólido,
- documentación y build maduros.

Entonces la pregunta correcta no es “¿qué más podemos hacer?”.

La pregunta correcta es:

**¿qué piezas hermanas multiplican el valor del core sin romper su simplicidad?**

---

## 2. Principios para expandir el ecosistema

Antes de pensar nuevos paquetes, conviene fijar reglas.

### 2.1 El core debe seguir siendo pequeño

`qr-pure` debería seguir enfocado en:

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

### 2.2 Paquetes hermanos > core inflado

Mejor estrategia:

- `qr-pure` = motor,
- paquetes complementarios = adaptadores / DX / verticales.

Eso mantiene la librería principal limpia y a la vez abre camino a monetización, comunidad y especialización.

### 2.3 Priorizar por impacto real

No todas las ideas tienen el mismo valor.

Conviene priorizar lo que cumpla al menos uno de estos objetivos:

- aumentar adopción,
- resolver casos de uso frecuentes,
- mejorar DX,
- habilitar nuevos canales de distribución.

---

## 3. Visión del ecosistema

```text
                        ┌─────────────────────┐
                        │      qr-pure        │
                        │   zero-dep core     │
                        └──────────┬──────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
   │ qr-pure-cli  │        │ qr-pure-react│        │ qr-pure-server│
   └──────────────┘        └──────────────┘        └──────────────┘
          │                        │                        │
          ├──────────────┐         │         ┌──────────────┤
          ▼              ▼         ▼         ▼              ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ qr-pure-wifi │ │ qr-pure-vcard│ │ qr-pure-pdf  │ │ qr-pure-reader│
   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                                                          │
                                                          ▼
                                                   ┌──────────────┐
                                                   │ @qr-pure/    │
                                                   │ secure        │
                                                   └──────────────┘
```

---

## 4. Propuestas de herramientas hermanas

## 4.1 `qr-pure-cli`

### Objetivo

Ofrecer una interfaz de línea de comandos para generar QRs sin escribir código.

### Por qué tiene sentido

Esta es la expansión más natural.

El proyecto ya tiene:

- generación del QR,
- renderer terminal,
- renderer SVG,
- renderer Canvas.

O sea: el trabajo pesado ya existe. El CLI es un empaquetado inteligente de capacidades ya disponibles.

### Casos de uso

- generar un QR rápido desde terminal,
- exportar SVG para diseño,
- automatizar lotes,
- integrar en scripts shell,
- usarlo en CI o tooling interno.

### Ejemplos de uso

```bash
# Mostrar en terminal
npx qr-pure "https://example.com"

# Guardar SVG
npx qr-pure "Hello" --format svg --output qr.svg

# Elegir estilo terminal
npx qr-pure "Hello" --format terminal --style compact

# Más opciones
npx qr-pure "https://example.com" \
  --error-level H \
  --margin 2 \
  --scale 8 \
  --shape rounded

# Leer desde stdin
echo "secret-value" | npx qr-pure --stdin --format svg > secret.svg

# Lote desde archivo
npx qr-pure batch ./data/urls.txt --output-dir ./out --format svg
```

### API mental del producto

Comandos sugeridos:

```bash
qr-pure <content>
qr-pure batch <file>
qr-pure --stdin
qr-pure info <content>
```

### Flags sugeridas

- `--format <terminal|svg|png|json>`
- `--output <path>`
- `--output-dir <path>`
- `--error-level <L|M|Q|H>`
- `--version <auto|1..40>`
- `--mask <auto|0..7>`
- `--mode <auto|numeric|alphanumeric|byte>`
- `--scale <number>`
- `--margin <number>`
- `--dark-color <color>`
- `--light-color <color>`
- `--shape <square|rounded|circle|dot>`
- `--corner-radius <0..1>`
- `--style <unicode|compact|ascii>`
- `--invert`
- `--stdin`
- `--json`

### Outputs útiles

#### `terminal`

Render directo usando `TerminalRenderer`.

#### `svg`

Exportación directa de string SVG.

#### `png`

No conviene meter esto en el core. Puede resolverse:

- con un wrapper Node usando canvas externo,
- o en una segunda etapa del CLI.

#### `json`

Muy útil para automatización:

```json
{
	"version": 3,
	"size": 29,
	"mode": "byte",
	"maskPattern": 4,
	"errorCorrectionLevel": "M"
}
```

### Dependencias recomendadas

- parsing CLI: `commander` o `cac`
- color output opcional: `picocolors`
- para PNG futuro: dependencia separada, no obligatoria

### Complejidad

**Baja**.

### Impacto

**Alto**.

### Recomendación

Debería ser la **primera expansión real** del ecosistema.

---

## 4.2 `qr-pure-react`

### Objetivo

Crear una capa de integración idiomática para React.

### Por qué tiene sentido

El core resuelve generación. Lo que falta en React es DX:

- props limpias,
- rerender controlado,
- componentes listos,
- integración con SSR/CSR,
- posibilidad de descarga,
- posibilidad de usar SVG o canvas sin boilerplate.

### Casos de uso

- landing pages,
- dashboards,
- invitaciones,
- pagos,
- onboarding WiFi,
- shares de apps,
- paneles de admin.

### API sugerida

```tsx
import { QRCode } from "qr-pure-react";

<QRCode value="https://example.com" />

<QRCode
  value="https://example.com"
  renderer="svg"
  size={240}
  errorCorrectionLevel="H"
  moduleShape="rounded"
  cornerRadius={0.3}
  darkColor="#111827"
  lightColor="#ffffff"
/>
```

### Componentes posibles

#### `<QRCode />`

Componente principal.

#### `<QRCodeSVG />`

Siempre SVG.

#### `<QRCodeCanvas />`

Siempre Canvas.

#### `<QRCodeDownloadButton />`

Botón auxiliar para exportación.

### Props sugeridas

- `value: string`
- `renderer?: "svg" | "canvas" | "terminal"`
- `size?: number`
- `scale?: number`
- `margin?: number`
- `errorCorrectionLevel?: "L" | "M" | "Q" | "H"`
- `version?: number | "auto"`
- `mask?: number | "auto"`
- `mode?: "auto" | "numeric" | "alphanumeric" | "byte"`
- `moduleShape?: "square" | "rounded" | "circle" | "dot"`
- `cornerRadius?: number`
- `darkColor?: string`
- `lightColor?: string`
- `className?: string`
- `title?: string`

### Features futuras interesantes

- `downloadable`
- `fileName`
- `logo`
- `animate`
- `onGenerated`

### Riesgos

- no mezclar demasiada lógica visual dentro del paquete,
- evitar dependencia fuerte con una sola estrategia de styling,
- no inventar state innecesario.

### Complejidad

**Media**.

### Impacto

**Muy alto**.

### Recomendación

Es una gran segunda apuesta después del CLI.

---

## 4.3 `qr-pure-reader`

### Objetivo

Expandir el ecosistema hacia la lectura/decodificación de códigos QR.

### Por qué tiene sentido

Acá cerrás el ciclo completo:

- generar,
- renderizar,
- leer,
- validar.

Eso transforma `qr-pure` de una librería puntual a una plataforma QR más completa.

### Casos de uso

- escaneo desde webcam,
- validación de QRs emitidos por la propia librería,
- kioscos,
- apps internas,
- check-in de eventos,
- tools de testing.

### APIs posibles

```ts
import { readQRFromImage, readQRFromCanvas, QRScanner } from "qr-pure-reader";

const result = await readQRFromImage(file);

const result2 = readQRFromCanvas(canvas);

const scanner = new QRScanner(videoElement, {
	onScan(data) {
		console.log(data);
	},
});
scanner.start();
```

### Dos estrategias posibles

#### Estrategia A — wrapper sobre decoder existente

Usar algo como `jsQR` internamente.

**Pros:**

- salida rápida,
- bajo riesgo,
- foco en API y DX.

**Contras:**

- ya no sería zero-dependency,
- dependés de un tercero,
- diferenciación menor.

#### Estrategia B — decoder propio

Implementar pipeline propio de lectura.

**Pros:**

- control total,
- posible zero-dependency,
- gran valor técnico.

**Contras:**

- complejidad alta,
- mucho laburo matemático y de visión,
- testing bastante más duro.

### Recomendación

Si se encara, conviene arrancar como **wrapper estable sobre `jsQR`** y recién después evaluar decoder propio.

### Complejidad

**Alta**.

### Impacto

**Alto**.

---

## 4.4 `qr-pure-server`

### Objetivo

Ofrecer un microservicio HTTP para generación server-side.

### Por qué tiene sentido

Hay muchísimos equipos que no quieren integrar una librería: quieren un endpoint.

Ejemplo real:

- backend genera QRs para tickets,
- CMS genera SVGs bajo demanda,
- plataforma de marketing emite assets,
- sistemas legacy consumen una API.

### Endpoints sugeridos

```http
GET /qr?data=hello&format=svg
GET /qr?data=hello&format=json
POST /qr
POST /qr/batch
GET /health
```

### Contrato posible

#### `POST /qr`

```json
{
	"data": "https://example.com",
	"format": "svg",
	"errorCorrectionLevel": "H",
	"moduleShape": "rounded",
	"scale": 10
}
```

### Respuestas posibles

- `image/svg+xml`
- `application/json`
- `application/octet-stream`

### Features de plataforma

- rate limiting,
- caching,
- auth opcional,
- batch generation,
- Docker image,
- deploy templates para Railway / Fly / Render / Vercel.

### Stack sugerido

- `fastify` por performance y tipado,
- `zod` para validar payloads,
- `pino` para logs.

### Complejidad

**Media**.

### Impacto

**Medio**.

### Recomendación

Tiene sentido si querés abrir un camino B2B o self-hosted.

---

## 4.5 `qr-pure-pdf`

### Objetivo

Resolver generación de documentos PDF que contengan uno o múltiples QRs.

### Casos de uso

- hojas de etiquetas,
- credenciales,
- facturas,
- cupones,
- tickets,
- inventario y logística.

### API sugerida

```ts
import { generateQRSheet, generateInvoicePDF } from "qr-pure-pdf";

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

### Estrategia técnica

No meter PDF en el core. Nunca.

Este paquete debería usar:

- SVG como formato fuente,
- y una dependencia específica de PDF.

### Dependencias posibles

- `pdf-lib`
- `pdfkit`

### Complejidad

**Media**.

### Impacto

**Medio**.

### Recomendación

Interesante si aparece demanda real en operaciones, logística o ventas.

---

## 4.6 `qr-pure-wifi`

### Objetivo

Resolver correctamente el formato estándar de QRs para conexión WiFi.

### Por qué tiene sentido

Es uno de los formatos más usados en el mundo real y evita que cada usuario arme strings a mano.

### API sugerida

```ts
import { wifiQR, buildWifiString } from "qr-pure-wifi";

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

### Valor agregado

- validación de campos,
- escaping correcto,
- tipado,
- helpers listos para usar con `generateQR()` o `renderToSVG()`.

### Complejidad

**Baja**.

### Impacto

**Medio**.

### Recomendación

Gran candidato de corto plazo porque aporta valor con poco esfuerzo.

---

## 4.7 `qr-pure-vcard`

### Objetivo

Generar QRs de contacto con formato vCard válido.

### API sugerida

```ts
import { vcardQR, buildVCardString } from "qr-pure-vcard";

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

### Valor agregado

- formato estándar consistente,
- orden correcto de campos,
- sanitización,
- soporte para campos opcionales,
- helpers listos para render.

### Complejidad

**Baja** a **media**.

### Impacto

**Medio**.

### Recomendación

Muy buena dupla junto con `qr-pure-wifi`.

---

## 4.8 `qr-pure-analytics`

### Objetivo

Ofrecer QRs con tracking y capa analítica.

### Aclaración importante

Esto **no** es solo generar el QR. Acá entrás en terreno de producto:

- redirecciones,
- persistencia,
- dashboard,
- métricas,
- privacidad,
- fraude,
- links dinámicos.

### Por qué puede ser valioso

Porque los equipos de marketing no quieren solo un QR. Quieren saber:

- cuántas veces se escaneó,
- desde dónde,
- cuándo,
- si el destino convierte.

### Posible arquitectura

1. generar URL corta/trackeada,
2. esa URL redirige al destino real,
3. registrar evento,
4. mostrar métricas en panel.

### Complejidad

**Alta**.

### Impacto

**Alto**, pero mucho más producto que librería.

### Recomendación

No es de corto plazo. Conviene pensarlo recién cuando el core y los paquetes básicos estén consolidados.

---

## 4.9 `qr-pure-figma`

### Objetivo

Crear un plugin para diseñadores que use el motor de `qr-pure` dentro de Figma.

### Casos de uso

- posters,
- packaging,
- flyers,
- piezas para redes,
- credenciales,
- layouts para impresión.

### Features útiles

- generar QR desde texto o URL,
- personalizar colores,
- cambiar forma de módulos,
- actualizar el nodo sin recrearlo,
- presets visuales.

### Valor estratégico

Esto abre otro público:

- diseñadores,
- equipos de branding,
- agencias.

### Complejidad

**Media**.

### Impacto

**Medio**.

### Recomendación

Muy interesante como canal de adopción, pero no antes del CLI y React.

---

## 4.10 `@qr-pure/secure`

### Objetivo

Agregar capacidades de firma, verificación y eventualmente cifrado para casos donde el QR representa algo sensible.

### Casos de uso

- tickets,
- credenciales,
- invitaciones verificables,
- documentos emitidos,
- vouchers o cupones antifraude.

### Posible API

```ts
import { createSignedQR, verifySignedQR } from "@qr-pure/secure";

const token = createSignedQR({
	payload: {
		ticketId: "evt_123",
		seat: "A-12",
	},
	privateKey,
});

const verification = verifySignedQR(token, publicKey);
```

### Advertencia importante

Esto es delicado. Seguridad mal hecha es peor que no tener seguridad.

Si se hace, hay que hacerlo con:

- primitives serias,
- librerías auditadas,
- mensajes claros,
- documentación brutalmente precisa.

### Complejidad

**Alta**.

### Impacto

**Nicho**, pero muy valioso en verticales específicos.

### Recomendación

No es prioridad de corto plazo.

---

## 4.11 `qr-pure-design-system`

### Objetivo

Ofrecer presets visuales listos para usar sobre los renderers actuales.

### Por qué tiene sentido

Muchos devs quieren “que se vea lindo” pero no saben diseñar un QR custom sin romper legibilidad.

### Ejemplo de uso

```ts
import { presets } from "qr-pure-design-system";
import { SVGRenderer } from "qr-pure";

const svg = SVGRenderer.render(matrix, presets.modernRounded);
```

### Posibles presets

- `minimal`
- `modernRounded`
- `corporate`
- `playful`
- `highContrast`

### Valor agregado

- acelera adopción,
- mejora output visual,
- sirve como showcase del renderer SVG.

### Complejidad

**Baja**.

### Impacto

**Medio**.

### Recomendación

Buen complemento cuando exista más demanda de customización visual.

---

## 5. Otras integraciones posibles

Estas no son prioridad, pero vale documentarlas.

### 5.1 `qr-pure-vue`

- Wrapper idiomático para Vue.

### 5.2 `qr-pure-svelte`

- Wrapper idiomático para Svelte.

### 5.3 `qr-pure-solid`

- Wrapper idiomático para Solid.

### 5.4 `qr-pure-next`

- Helpers específicos para App Router, Server Components y generación edge/server.

### 5.5 `qr-pure-bench`

- Suite de benchmarks comparando `qr-pure` contra otras librerías del ecosistema.

---

## 6. Priorización sugerida

## 6.1 Matriz de valor

| Iniciativa              | Esfuerzo   | Impacto  | Horizonte           | Prioridad |
| ----------------------- | ---------- | -------- | ------------------- | --------- |
| `qr-pure-cli`           | Bajo       | Alto     | Corto plazo         | 1         |
| `qr-pure-react`         | Medio      | Muy alto | Corto plazo         | 2         |
| `qr-pure-wifi`          | Bajo       | Medio    | Corto plazo         | 3         |
| `qr-pure-vcard`         | Bajo/Medio | Medio    | Corto plazo         | 4         |
| `qr-pure-server`        | Medio      | Medio    | Mediano plazo       | 5         |
| `qr-pure-design-system` | Bajo       | Medio    | Mediano plazo       | 6         |
| `qr-pure-pdf`           | Medio      | Medio    | Mediano plazo       | 7         |
| `qr-pure-reader`        | Alto       | Alto     | Mediano/Largo plazo | 8         |
| `qr-pure-figma`         | Medio      | Medio    | Largo plazo         | 9         |
| `@qr-pure/secure`       | Alto       | Nicho    | Largo plazo         | 10        |
| `qr-pure-analytics`     | Alto       | Alto     | Largo plazo         | 11        |

---

## 7. Roadmap recomendado

## Fase A — Expansión inmediata

Objetivo: aumentar adopción con poco esfuerzo.

### Iniciativas

1. `qr-pure-cli`
2. `qr-pure-wifi`
3. `qr-pure-vcard`

### Resultado esperado

- más casos de uso reales,
- más facilidad de prueba,
- mejor posicionamiento del proyecto.

---

## Fase B — Integración con frontend

Objetivo: entrar de lleno al ecosistema de apps web.

### Iniciativas

1. `qr-pure-react`
2. presets visuales básicos o `qr-pure-design-system`

### Resultado esperado

- adopción en frontend,
- ejemplos más visibles,
- más comunidad alrededor del proyecto.

---

## Fase C — Plataforma

Objetivo: habilitar uso server-side y procesos documentales.

### Iniciativas

1. `qr-pure-server`
2. `qr-pure-pdf`

### Resultado esperado

- utilidad para equipos internos,
- uso empresarial más claro,
- posibilidad de self-hosted.

---

## Fase D — Expansión avanzada

Objetivo: convertir el ecosistema en una plataforma más completa.

### Iniciativas

1. `qr-pure-reader`
2. `@qr-pure/secure`
3. `qr-pure-analytics`
4. `qr-pure-figma`

---

## 8. Recomendación ejecutiva

Si hubiera que elegir **solo tres movimientos inteligentes** para el futuro próximo, deberían ser estos:

### 1. `qr-pure-cli`

Porque es el mayor retorno por menor esfuerzo.

### 2. `qr-pure-react`

Porque maximiza alcance y adopción.

### 3. `qr-pure-wifi` + `qr-pure-vcard`

Porque convierten el motor en soluciones concretas de uso diario.

Eso te arma un ecosistema inicial muy sano:

- core sólido,
- entrada por terminal,
- entrada por frontend,
- soluciones concretas de negocio.

Y eso, te digo la verdad, YA empieza a parecer una familia de productos y no solo una librería aislada.

---

## 9. Estado de decisión actual

Al día de hoy, la recomendación estratégica es:

- mantener `qr-pure` como motor central,
- evitar inflarlo con features ajenas al core,
- avanzar primero con paquetes satélite de alto impacto y bajo costo,
- postergar analytics, secure y reader hasta tener más señales de uso real.

---

## 10. Próximos pasos sugeridos

Cuando se retome este documento, el orden lógico sería:

1. convertir esta visión en issues o milestones,
2. definir naming oficial de paquetes,
3. decidir si será monorepo o repos separados,
4. arrancar por `qr-pure-cli`.

### Preguntas que conviene resolver antes de implementar

- ¿ecosistema en monorepo o multiprepo?
- ¿mantener zero-dependency estricto solo en el core?
- ¿qué paquetes pueden aceptar dependencias externas?
- ¿qué nivel de soporte se quiere para Node vs browser?
- ¿qué paquete tiene mejor relación esfuerzo/impacto para el próximo release?

---

Fin del documento.
