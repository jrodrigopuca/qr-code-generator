# @qr-plus/vue

[![npm](https://img.shields.io/npm/v/@qr-plus/vue)](https://www.npmjs.com/package/@qr-plus/vue)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Vue 3 components and composables for QR code generation. SVG-first, zero-config, fully typed.

Built on top of [`@qr-plus/core`](https://www.npmjs.com/package/@qr-plus/core).

## Installation

```bash
npm install @qr-plus/vue
```

**Peer dependencies:** Vue 3.4+

## Quick Start

```vue
<script setup>
import { QRCode } from "@qr-plus/vue";
</script>

<template>
  <QRCode value="https://example.com" />
</template>
```

## Components

### `<QRCode />`

Renders a QR code as inline SVG. This is the primary component.

```vue
<QRCode
  value="https://example.com"
  :size="240"
  error-correction-level="H"
  module-shape="rounded"
  :corner-radius="0.3"
  dark-color="#111827"
  light-color="#ffffff"
  class="shadow-lg"
  title="Example QR"
/>
```

#### Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | *required* | Text or URL to encode |
| `size` | `number` | `200` | QR code size in pixels |
| `errorCorrectionLevel` | `"L" \| "M" \| "Q" \| "H"` | `"M"` | Error correction level |
| `moduleShape` | `"square" \| "rounded" \| "circle" \| "dot"` | `"square"` | Shape of individual modules |
| `cornerRadius` | `number` | `0.5` | Corner radius for "rounded" shape (0-1) |
| `margin` | `number` | `4` | Quiet zone margin in modules |
| `darkColor` | `string` | `"#000000"` | Dark module color (hex) |
| `lightColor` | `string` | `"#ffffff"` | Light module color (hex) |
| `class` | `string` | — | CSS class for the wrapper element |
| `title` | `string` | `"QR Code"` | Accessible label |

### `<QRCodeCanvas />`

Renders a QR code on an HTML5 canvas. Use when you need pixel-level control.

```vue
<QRCodeCanvas
  value="https://example.com"
  :size="300"
  error-correction-level="H"
  class="border rounded"
/>
```

> **Note:** Canvas only supports `square` and `rounded` shapes. For `circle`/`dot`, use `<QRCode />`.

### `<QRCodeDownload />`

Button that downloads a QR code. Does NOT render the QR visually.

```vue
<QRCodeDownload value="https://example.com" file-name="my-qr" format="svg">
  Download QR
</QRCodeDownload>
```

#### Additional Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `fileName` | `string` | `"qrcode"` | File name (without extension) |
| `format` | `"svg" \| "png"` | `"svg"` | Download format |
| `disabled` | `boolean` | — | Disable the button |

Button content is passed via the default slot. All QR props (`value`, `size`, `moduleShape`, etc.) are also accepted.

## Composable

### `useQRCode(value, options?)`

For custom rendering or programmatic usage. Accepts refs, getters, or plain values for maximum flexibility.

```vue
<script setup>
import { ref } from "vue";
import { useQRCode } from "@qr-plus/vue";

const url = ref("https://example.com");

const { svgString, svgDataURL, download, isError, error } = useQRCode(
  url,
  { errorCorrectionLevel: "H", moduleShape: "rounded" }
);
</script>

<template>
  <p v-if="isError">Error: {{ error?.message }}</p>
  <template v-else>
    <!-- As inline SVG -->
    <div v-html="svgString" />

    <!-- As image -->
    <img :src="svgDataURL" alt="QR Code" />

    <!-- Download buttons -->
    <button @click="download('my-qr')">Download SVG</button>
    <button @click="download('my-qr', 'png')">Download PNG</button>
  </template>
</template>
```

#### Return Value

| Property | Type | Description |
| --- | --- | --- |
| `svgString` | `ComputedRef<string>` | Full SVG markup |
| `svgDataURL` | `ComputedRef<string>` | Base64 data URL for `<img :src>` |
| `download` | `(fileName?, format?) => void` | Trigger file download |
| `isError` | `ComputedRef<boolean>` | Whether generation failed |
| `error` | `ComputedRef<Error \| null>` | Error object if failed |

#### Input Types

The composable accepts `MaybeRefOrGetter<string>` for `value` and `MaybeRefOrGetter<UseQRCodeOptions>` for `options`. This means you can pass:

- Plain strings/objects: `useQRCode("hello", { size: 200 })`
- Refs: `useQRCode(myRef, optionsRef)`
- Getters: `useQRCode(() => computedValue, () => computedOptions)`
- Computed values: `useQRCode(computedUrl)`

All inputs are automatically unwrapped and tracked reactively.

## Examples

### Shared Props

```vue
<script setup>
import { QRCode, QRCodeDownload } from "@qr-plus/vue";

const qrProps = {
  value: "https://example.com",
  errorCorrectionLevel: "H" as const,
  moduleShape: "rounded" as const,
};
</script>

<template>
  <div>
    <QRCode v-bind="qrProps" :size="240" />
    <QRCodeDownload v-bind="qrProps" file-name="my-qr">
      Download SVG
    </QRCodeDownload>
  </div>
</template>
```

### Module Shapes

```vue
<QRCode value="hello" module-shape="square" />
<QRCode value="hello" module-shape="rounded" :corner-radius="0.3" />
<QRCode value="hello" module-shape="circle" />
<QRCode value="hello" module-shape="dot" />
```

## Roadmap

- [ ] Logo/image overlay support (v2)
- [ ] Animation support
- [ ] `onGenerated` event

## License

MIT
