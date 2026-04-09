# @qr-plus/wifi

WiFi QR code string builder with validation. Generates properly formatted WiFi configuration strings following the [ZXing standard](https://github.com/zxing/zxing/wiki/Barcode-Contents#wi-fi-network-config-android-ios-11).

## Features

- **Standard-compliant** — Follows the `WIFI:` URI scheme used by Android and iOS 11+
- **Validated** — SSID presence, password requirements, encryption type validation
- **Escaped** — Handles special characters (`;`, `:`, `,`, `"`, `\`) in SSID and password
- **Typed** — Full TypeScript types with const-based enums
- **Zero dependencies** — No runtime dependencies
- **Framework agnostic** — Works with any QR code generator

## Installation

```bash
npm install @qr-plus/wifi
```

## Quick Start

```typescript
import { buildWifiString } from "@qr-plus/wifi";

const content = buildWifiString({
  ssid: "MyNetwork",
  password: "super-secret",
  encryption: "WPA",
});
// => "WIFI:T:WPA;S:MyNetwork;P:super-secret;;"
```

## Usage with @qr-plus/core

```typescript
import { buildWifiString } from "@qr-plus/wifi";
import { renderToSVG } from "@qr-plus/core";

const svg = renderToSVG(
  buildWifiString({
    ssid: "MyNetwork",
    password: "super-secret",
  })
);
```

## Usage with @qr-plus/react

```tsx
import { buildWifiString } from "@qr-plus/wifi";
import { QRCode } from "@qr-plus/react";

function WifiQR() {
  const content = buildWifiString({
    ssid: "GuestWiFi",
    password: "welcome123",
  });

  return <QRCode value={content} />;
}
```

## API

### `buildWifiString(config: WifiConfig): string`

Builds a WiFi QR code content string from a configuration object.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ssid` | `string` | ✅ | — | Network name (SSID) |
| `password` | `string` | For WPA/WEP | — | Network password |
| `encryption` | `WifiEncryption` | — | `"WPA"` | Encryption type |
| `hidden` | `boolean` | — | `false` | Whether the network is hidden |

#### Encryption types

| Constant | Value | Description |
|----------|-------|-------------|
| `WIFI_ENCRYPTION.WPA` | `"WPA"` | WPA/WPA2/WPA3 (recommended) |
| `WIFI_ENCRYPTION.WEP` | `"WEP"` | WEP (legacy) |
| `WIFI_ENCRYPTION.NONE` | `"nopass"` | Open network |

### Examples

#### WPA network (default)

```typescript
buildWifiString({
  ssid: "MyNetwork",
  password: "super-secret",
});
// => "WIFI:T:WPA;S:MyNetwork;P:super-secret;;"
```

#### Hidden network

```typescript
buildWifiString({
  ssid: "HiddenNet",
  password: "pass123",
  hidden: true,
});
// => "WIFI:T:WPA;S:HiddenNet;P:pass123;H:true;;"
```

#### Open network

```typescript
import { WIFI_ENCRYPTION } from "@qr-plus/wifi";

buildWifiString({
  ssid: "FreeWiFi",
  encryption: WIFI_ENCRYPTION.NONE,
});
// => "WIFI:T:nopass;S:FreeWiFi;;"
```

#### Special characters

```typescript
buildWifiString({
  ssid: "My;Network",
  password: "p:ass",
});
// => "WIFI:T:WPA;S:My\;Network;P:p\:ass;;"
```

## Error Handling

The function throws `WifiError` with specific error codes:

| Code | Condition |
|------|-----------|
| `EMPTY_SSID` | SSID is empty or whitespace-only |
| `PASSWORD_REQUIRED` | Password missing for WPA or WEP encryption |
| `INVALID_ENCRYPTION` | Unrecognized encryption type |

```typescript
import { buildWifiString, WifiError, WIFI_ERROR_CODE } from "@qr-plus/wifi";

try {
  buildWifiString({ ssid: "" });
} catch (error) {
  if (error instanceof WifiError) {
    console.log(error.code); // "EMPTY_SSID"
    console.log(error.message); // "SSID must be a non-empty string."
  }
}
```

## Part of the @qr-plus ecosystem

| Package | Description |
|---------|-------------|
| [`@qr-plus/core`](https://www.npmjs.com/package/@qr-plus/core) | Zero-dependency QR code engine |
| [`@qr-plus/react`](https://www.npmjs.com/package/@qr-plus/react) | React components and hooks |
| [`@qr-plus/cli`](https://www.npmjs.com/package/@qr-plus/cli) | Terminal QR code generator |
| **`@qr-plus/wifi`** | **WiFi QR string builder** |
| [`@qr-plus/vcard`](https://www.npmjs.com/package/@qr-plus/vcard) | vCard QR string builder |

## License

MIT
