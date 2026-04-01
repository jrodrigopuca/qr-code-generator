# qr-pure (DEPRECATED)

> **This package has been renamed to [`@qr-plus/core`](https://www.npmjs.com/package/@qr-plus/core).**

This package now simply re-exports `@qr-plus/core` for backward compatibility. Please update your imports:

```diff
- npm install qr-pure
+ npm install @qr-plus/core

- import { generateQR } from "qr-pure";
+ import { generateQR } from "@qr-plus/core";
```

All future development happens in `@qr-plus/core`.
