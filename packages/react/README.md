# @qr-plus/react

[![npm](https://img.shields.io/npm/v/@qr-plus/react)](https://www.npmjs.com/package/@qr-plus/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

React components and hooks for QR code generation. SVG-first, zero-config, fully typed.

Built on top of [`@qr-plus/core`](https://www.npmjs.com/package/@qr-plus/core).

## Installation

```bash
npm install @qr-plus/react
```

**Peer dependencies:** React 19+

## Quick Start

```tsx
import { QRCode } from "@qr-plus/react";

function App() {
  return <QRCode value="https://example.com" />;
}
```

## Components

### `<QRCode />`

Renders a QR code as inline SVG. This is the primary component.

```tsx
<QRCode
  value="https://example.com"
  size={240}
  errorCorrectionLevel="H"
  moduleShape="rounded"
  cornerRadius={0.3}
  darkColor="#111827"
  lightColor="#ffffff"
  className="shadow-lg"
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
| `className` | `string` | — | CSS class for the wrapper element |
| `title` | `string` | `"QR Code"` | Accessible label |

### `<QRCodeCanvas />`

Renders a QR code on an HTML5 canvas. Use when you need pixel-level control.

```tsx
<QRCodeCanvas
  value="https://example.com"
  size={300}
  errorCorrectionLevel="H"
  className="border rounded"
/>
```

> **Note:** Canvas only supports `square` and `rounded` shapes. For `circle`/`dot`, use `<QRCode />`.

### `<QRCodeDownload />`

Button that downloads a QR code. Does NOT render the QR visually.

```tsx
<QRCodeDownload value="https://example.com" fileName="my-qr" format="svg">
  Download QR
</QRCodeDownload>
```

#### Additional Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `fileName` | `string` | `"qrcode"` | File name (without extension) |
| `format` | `"svg" \| "png"` | `"svg"` | Download format |
| `children` | `ReactNode` | *required* | Button content |
| `disabled` | `boolean` | — | Disable the button |

All QR props (`value`, `size`, `moduleShape`, etc.) are also accepted.

## Hook

### `useQRCode(value, options?)`

For custom rendering or programmatic usage.

```tsx
import { useQRCode } from "@qr-plus/react";

function CustomQR() {
  const { svgString, svgDataURL, download, isError, error } = useQRCode(
    "https://example.com",
    { errorCorrectionLevel: "H", moduleShape: "rounded" }
  );

  if (isError) return <p>Error: {error.message}</p>;

  return (
    <div>
      {/* As inline SVG */}
      <div dangerouslySetInnerHTML={{ __html: svgString }} />

      {/* As image */}
      <img src={svgDataURL} alt="QR Code" />

      {/* Download buttons */}
      <button onClick={() => download("my-qr")}>Download SVG</button>
      <button onClick={() => download("my-qr", "png")}>Download PNG</button>
    </div>
  );
}
```

#### Return Value

| Property | Type | Description |
| --- | --- | --- |
| `svgString` | `string` | Full SVG markup |
| `svgDataURL` | `string` | Base64 data URL for `<img src>` |
| `download` | `(fileName?, format?) => void` | Trigger file download |
| `isError` | `boolean` | Whether generation failed |
| `error` | `Error \| null` | Error object if failed |

## Examples

### Shared Props

```tsx
const qrProps = {
  value: "https://example.com",
  errorCorrectionLevel: "H" as const,
  moduleShape: "rounded" as const,
};

<div>
  <QRCode {...qrProps} size={240} />
  <QRCodeDownload {...qrProps} fileName="my-qr">
    Download SVG
  </QRCodeDownload>
</div>
```

### Module Shapes

```tsx
<QRCode value="hello" moduleShape="square" />
<QRCode value="hello" moduleShape="rounded" cornerRadius={0.3} />
<QRCode value="hello" moduleShape="circle" />
<QRCode value="hello" moduleShape="dot" />
```

## Roadmap

- [ ] Logo/image overlay support (v2)
- [ ] Animation support
- [ ] `onGenerated` callback

## License

MIT
