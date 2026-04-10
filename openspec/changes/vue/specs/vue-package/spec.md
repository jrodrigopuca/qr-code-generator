# @qr-plus/vue Specification

## Purpose

Specification for the `@qr-plus/vue` package — a Vue 3 wrapper for the @qr-plus QR code ecosystem. Provides composables and components for QR code generation, rendering (SVG + Canvas), and download.

---

## Requirements

### Requirement: useQRCode Composable

The `useQRCode(value, options?)` composable MUST accept a reactive or plain string value and optional generation/rendering options. It MUST return an object with `svgString`, `svgDataURL`, `download`, `isError`, and `error` as reactive refs (or computed values).

#### Scenario: Basic QR generation

- GIVEN a value string "https://example.com"
- WHEN `useQRCode("https://example.com")` is called
- THEN `svgString` MUST contain a valid SVG markup string
- AND `svgDataURL` MUST contain a base64-encoded data URL starting with `data:image/svg+xml;base64,`
- AND `isError` MUST be `false`
- AND `error` MUST be `null`

#### Scenario: Reactive value changes

- GIVEN `useQRCode(value)` where `value` is a `ref("hello")`
- WHEN `value` changes to `"world"`
- THEN `svgString` and `svgDataURL` MUST recompute automatically
- AND the new SVG MUST encode "world"

#### Scenario: Reactive options changes

- GIVEN `useQRCode("test", options)` where options is reactive
- WHEN `options.errorCorrectionLevel` changes from `"M"` to `"H"`
- THEN `svgString` MUST recompute with the new error correction level

#### Scenario: Options forwarding

- GIVEN options with `errorCorrectionLevel`, `size`, `margin`, `darkColor`, `lightColor`, `moduleShape`, `cornerRadius`
- WHEN the composable generates the QR code
- THEN `errorCorrectionLevel` MUST be forwarded to `QRCode` constructor
- AND rendering options MUST be forwarded to `SVGRenderer.render()`
- AND `scale` MUST be computed as `size / (matrixSize + margin * 2)`

#### Scenario: Default values

- GIVEN no options provided
- WHEN `useQRCode("test")` is called
- THEN `size` MUST default to 200
- AND `margin` MUST default to 4

#### Scenario: Generation error

- GIVEN input that causes `@qr-plus/core` to throw
- WHEN `useQRCode(badInput)` is called
- THEN `isError` MUST be `true`
- AND `error` MUST contain the Error object
- AND `svgString` MUST be an empty string
- AND `svgDataURL` MUST be an empty string

#### Scenario: Non-Error throw handling

- GIVEN `@qr-plus/core` throws a non-Error value (e.g., a string)
- WHEN the composable catches it
- THEN `error` MUST be wrapped in an `Error` object with the string as message

#### Scenario: Memoization — same inputs

- GIVEN value and options have not changed
- WHEN Vue re-evaluates computed properties
- THEN the QR code MUST NOT be regenerated (cached result returned)

---

### Requirement: useQRCode Download Function

The composable MUST return a `download(fileName?, format?)` function that triggers a browser file download.

#### Scenario: SVG download

- GIVEN a successful QR generation
- WHEN `download("my-qr", "svg")` is called
- THEN a file named `my-qr.svg` MUST be downloaded
- AND the SVG content MUST include an XML declaration

#### Scenario: PNG download

- GIVEN a successful QR generation
- WHEN `download("my-qr", "png")` is called
- THEN a file named `my-qr.png` MUST be downloaded
- AND the PNG MUST be rasterized at the configured `size` pixels

#### Scenario: Default download parameters

- GIVEN no arguments to `download()`
- WHEN called
- THEN fileName MUST default to `"qrcode"`
- AND format MUST default to `"svg"`

#### Scenario: Download after generation error

- GIVEN a generation error occurred
- WHEN `download()` is called
- THEN nothing MUST happen (no download triggered, no exception thrown)

---

### Requirement: QRCode SVG Component

The `<QRCode />` component MUST render a QR code as inline SVG inside a wrapper element.

#### Scenario: Basic rendering

- GIVEN `<QRCode value="https://example.com" />`
- WHEN rendered
- THEN the output MUST contain an element with `role="img"`
- AND the inner HTML MUST contain SVG markup

#### Scenario: Accessibility — default label

- GIVEN no `title` prop
- WHEN rendered
- THEN `aria-label` MUST be `"QR Code"`

#### Scenario: Accessibility — custom title

- GIVEN `title="Scan to visit example.com"`
- WHEN rendered
- THEN `aria-label` MUST be `"Scan to visit example.com"`

#### Scenario: Class binding

- GIVEN `class="my-qr shadow-lg"`
- WHEN rendered
- THEN the wrapper element MUST have both classes applied

#### Scenario: Error fallback

- GIVEN generation fails
- WHEN the component renders
- THEN nothing MUST be rendered (empty output)

#### Scenario: All options forwarded

- GIVEN `size`, `margin`, `error-correction-level`, `dark-color`, `light-color`, `module-shape`, `corner-radius` props
- WHEN rendered
- THEN all options MUST be forwarded to the internal `useQRCode()` call

---

### Requirement: QRCodeCanvas Component

The `<QRCodeCanvas />` component MUST render a QR code on an HTML5 `<canvas>` element.

#### Scenario: Basic canvas rendering

- GIVEN `<QRCodeCanvas value="https://example.com" />`
- WHEN mounted
- THEN a `<canvas>` element MUST be in the DOM
- AND `CanvasRenderer.render()` MUST be called with the QR matrix

#### Scenario: Reactive updates

- GIVEN `value` changes from `"hello"` to `"world"`
- WHEN Vue triggers the watcher
- THEN the canvas MUST be re-rendered with the new QR matrix

#### Scenario: Rounded module shape

- GIVEN `module-shape="rounded"` and `corner-radius="0.4"`
- WHEN rendered
- THEN `CanvasRenderer.renderRounded()` MUST be called instead of `CanvasRenderer.render()`

#### Scenario: Canvas error handling

- GIVEN generation fails
- WHEN the component tries to render
- THEN the canvas MUST be cleared (no partial render)

#### Scenario: Accessibility

- GIVEN `<QRCodeCanvas value="test" />`
- WHEN rendered
- THEN the canvas element MUST have `role="img"` and `aria-label="QR Code"`

---

### Requirement: QRCodeDownload Component

The `<QRCodeDownload />` component MUST render a `<button>` that triggers QR code download on click.

#### Scenario: Basic download button

- GIVEN `<QRCodeDownload value="https://example.com">Download</QRCodeDownload>`
- WHEN rendered
- THEN a `<button>` element MUST be in the DOM
- AND the button content MUST come from the default slot

#### Scenario: Click triggers download

- GIVEN a rendered download button with `format="svg"`
- WHEN the button is clicked
- THEN the `download()` function MUST be called with the configured fileName and format

#### Scenario: Default props

- GIVEN no `fileName` or `format` specified
- WHEN clicked
- THEN `fileName` MUST default to `"qrcode"`
- AND `format` MUST default to `"svg"`

#### Scenario: PNG format

- GIVEN `format="png"` and `file-name="ticket-qr"`
- WHEN clicked
- THEN `download("ticket-qr", "png")` MUST be called

#### Scenario: Disabled state on error

- GIVEN generation fails
- WHEN the component renders and no explicit `disabled` prop is set
- THEN the button MUST be disabled

#### Scenario: Explicit disabled prop

- GIVEN `disabled` is set to `true`
- WHEN rendered
- THEN the button MUST be disabled regardless of generation state

#### Scenario: Slot content

- GIVEN `<QRCodeDownload value="x"><span>Custom Content</span></QRCodeDownload>`
- WHEN rendered
- THEN the button MUST contain the slot content (`<span>Custom Content</span>`)

---

### Requirement: TypeScript Types

The package MUST export all public types for consumers.

#### Scenario: Exported types

- GIVEN a consumer imports from `@qr-plus/vue`
- WHEN they import types
- THEN the following types MUST be available: `QRCodeProps`, `QRCodeCanvasProps`, `QRCodeDownloadProps`, `UseQRCodeOptions`, `UseQRCodeResult`, `DownloadFormat`, `QROptions`, `QRRenderOptions`

#### Scenario: defineProps type inference

- GIVEN a consumer uses `<QRCode />` in a template
- WHEN they pass props
- THEN TypeScript MUST provide autocomplete and type checking for all props

---

### Requirement: Package Build

The package MUST build to dual CJS/ESM format with TypeScript declarations.

#### Scenario: Build output

- GIVEN `pnpm --filter @qr-plus/vue build` is run
- WHEN the build completes
- THEN `dist/index.js` (ESM), `dist/index.cjs` (CJS), and `dist/index.d.ts` MUST exist

#### Scenario: External dependencies

- GIVEN the build configuration
- WHEN tsup bundles the package
- THEN `vue` MUST be marked as external (not bundled)
- AND `@qr-plus/core` MUST be a regular dependency (resolved by consumer's package manager)

#### Scenario: Package exports

- GIVEN a consumer's bundler resolves `@qr-plus/vue`
- WHEN it reads `package.json` exports
- THEN ESM imports MUST resolve to `dist/index.js` with types `dist/index.d.ts`
- AND CJS requires MUST resolve to `dist/index.cjs` with types `dist/index.d.cts`

---

### Requirement: Zero Runtime Dependencies

The package MUST NOT introduce any runtime dependencies beyond `vue` (peer) and `@qr-plus/core` (dependency).

#### Scenario: Dependency audit

- GIVEN the `package.json` of `@qr-plus/vue`
- WHEN inspecting `dependencies`
- THEN only `@qr-plus/core` MUST be listed
- AND `peerDependencies` MUST only contain `vue: ^3.4`

---

### Requirement: Vue Idiom Compliance

Components and composables MUST follow Vue 3 Composition API idioms.

#### Scenario: Script setup

- GIVEN any `.vue` SFC in the package
- WHEN inspected
- THEN it MUST use `<script setup lang="ts">`

#### Scenario: Props convention

- GIVEN component props like `errorCorrectionLevel`
- WHEN used in templates
- THEN kebab-case (`error-correction-level`) MUST work due to Vue's automatic camelCase-to-kebab conversion
- AND camelCase (`errorCorrectionLevel`) MUST also work in script

#### Scenario: Slots over children

- GIVEN `QRCodeDownload` needs child content
- WHEN the Vue version is implemented
- THEN it MUST use Vue slots (not a `children` prop)
