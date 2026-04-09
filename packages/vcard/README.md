# @qr-plus/vcard

vCard QR code string builder with validation. Generates standard-compliant vCard 3.0/4.0 content for QR code encoding.

## Features

- **Standard-compliant** — Generates valid vCard 3.0 (RFC 2426) and 4.0 (RFC 6350)
- **Validated** — Name presence, email format, phone format, URL format
- **Escaped** — Handles special characters (`\`, `;`, `,`, newlines) per vCard spec
- **Multiple entries** — Supports multiple phone numbers and email addresses with types
- **Address support** — Full structured address formatting (street, city, region, postal, country)
- **Typed** — Full TypeScript types with const-based enums
- **Zero dependencies** — No runtime dependencies
- **Framework agnostic** — Works with any QR code generator

## Installation

```bash
npm install @qr-plus/vcard
```

## Quick Start

```typescript
import { buildVCardString } from "@qr-plus/vcard";

const content = buildVCardString({
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1234567890",
});
```

## Usage with @qr-plus/core

```typescript
import { buildVCardString } from "@qr-plus/vcard";
import { renderToSVG } from "@qr-plus/core";

const svg = renderToSVG(
  buildVCardString({
    firstName: "John",
    lastName: "Doe",
    phone: "+1234567890",
  })
);
```

## Usage with @qr-plus/react

```tsx
import { buildVCardString } from "@qr-plus/vcard";
import { QRCode } from "@qr-plus/react";

function ContactQR() {
  const content = buildVCardString({
    firstName: "Jane",
    lastName: "Smith",
    organization: "Acme Inc",
    phone: "+1234567890",
    email: "jane@acme.com",
  });

  return <QRCode value={content} />;
}
```

## API

### `buildVCardString(config: VCardConfig): string`

Builds a vCard string from a configuration object.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `firstName` | `string` | ✅ | — | First name |
| `lastName` | `string` | — | — | Last name |
| `organization` | `string` | — | — | Company / organization |
| `title` | `string` | — | — | Job title |
| `phone` | `string \| PhoneEntry[]` | — | — | Phone number(s) |
| `email` | `string \| EmailEntry[]` | — | — | Email address(es) |
| `website` | `string` | — | — | Website URL (http/https) |
| `address` | `VCardAddress` | — | — | Physical address |
| `note` | `string` | — | — | Additional notes |
| `version` | `VCardVersion` | — | `"3.0"` | vCard version |

#### Phone types

| Constant | Value |
|----------|-------|
| `PHONE_TYPE.CELL` | `"CELL"` (default) |
| `PHONE_TYPE.WORK` | `"WORK"` |
| `PHONE_TYPE.HOME` | `"HOME"` |
| `PHONE_TYPE.FAX` | `"FAX"` |
| `PHONE_TYPE.PAGER` | `"PAGER"` |

#### Email types

| Constant | Value |
|----------|-------|
| `EMAIL_TYPE.INTERNET` | `"INTERNET"` (default) |
| `EMAIL_TYPE.WORK` | `"WORK"` |
| `EMAIL_TYPE.HOME` | `"HOME"` |

### Examples

#### Simple contact

```typescript
buildVCardString({
  firstName: "John",
  lastName: "Doe",
  phone: "+1234567890",
  email: "john@example.com",
});
```

#### Full contact with multiple entries

```typescript
import { PHONE_TYPE, EMAIL_TYPE } from "@qr-plus/vcard";

buildVCardString({
  firstName: "Jane",
  lastName: "Smith",
  organization: "Acme Inc",
  title: "Senior Engineer",
  phone: [
    { number: "+1234567890", type: PHONE_TYPE.CELL },
    { number: "+0987654321", type: PHONE_TYPE.WORK },
  ],
  email: [
    { address: "jane@acme.com", type: EMAIL_TYPE.WORK },
    { address: "jane@home.com", type: EMAIL_TYPE.HOME },
  ],
  website: "https://acme.com",
  address: {
    street: "123 Main St",
    city: "Springfield",
    region: "IL",
    postalCode: "62701",
    country: "USA",
  },
  note: "Met at conference 2026",
});
```

#### vCard 4.0

```typescript
import { VCARD_VERSION } from "@qr-plus/vcard";

buildVCardString({
  firstName: "John",
  version: VCARD_VERSION.V4,
});
```

## Error Handling

The function throws `VCardError` with specific error codes:

| Code | Condition |
|------|-----------|
| `EMPTY_NAME` | First name is empty or whitespace-only |
| `INVALID_EMAIL` | Email doesn't match basic format |
| `INVALID_PHONE` | Phone contains invalid characters |
| `INVALID_URL` | URL doesn't start with http:// or https:// |

```typescript
import { buildVCardString, VCardError, VCARD_ERROR_CODE } from "@qr-plus/vcard";

try {
  buildVCardString({ firstName: "", email: "bad-email" });
} catch (error) {
  if (error instanceof VCardError) {
    console.log(error.code); // "EMPTY_NAME"
  }
}
```

## Part of the @qr-plus ecosystem

| Package | Description |
|---------|-------------|
| [`@qr-plus/core`](https://www.npmjs.com/package/@qr-plus/core) | Zero-dependency QR code engine |
| [`@qr-plus/react`](https://www.npmjs.com/package/@qr-plus/react) | React components and hooks |
| [`@qr-plus/cli`](https://www.npmjs.com/package/@qr-plus/cli) | Terminal QR code generator |
| [`@qr-plus/wifi`](https://www.npmjs.com/package/@qr-plus/wifi) | WiFi QR string builder |
| **`@qr-plus/vcard`** | **vCard QR string builder** |

## License

MIT
