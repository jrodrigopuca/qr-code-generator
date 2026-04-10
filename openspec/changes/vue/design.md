# Design: @qr-plus/vue — Vue 3 Wrapper

## Technical Approach

Port the `@qr-plus/react` package to Vue 3 using Composition API patterns. Each React source file maps 1:1 to a Vue equivalent. The core QR generation logic stays in `@qr-plus/core` — this package only wraps it with Vue reactivity and components.

Key mapping:
- React `useState` + `useRef` memoization → Vue `computed()` (built-in caching)
- React `useEffect` → Vue `watchEffect()` / `onMounted()` + `watch()`
- React `dangerouslySetInnerHTML` → Vue `v-html`
- React `children: React.ReactNode` → Vue default slot
- React JSX → Vue SFCs with `<script setup lang="ts">`

## Architecture Decisions

### Decision: Computed vs watchEffect for QR generation in useQRCode

**Choice**: Use `computed()` for svgString/svgDataURL derivation.
**Alternatives considered**: `watchEffect()` + `ref()` for storing the result.
**Rationale**: `computed()` is the idiomatic Vue way to derive values from reactive state. It provides built-in memoization (only re-evaluates when dependencies change), which replaces the manual ref-based caching in the React hook. The React version uses render-phase computation with `useRef` memoization — `computed()` achieves the same thing more elegantly.

### Decision: SFC (.vue) files vs TSX render functions

**Choice**: Use `.vue` SFCs with `<script setup lang="ts">` for components.
**Alternatives considered**: Plain `.ts` files with `defineComponent()` + render functions or TSX.
**Rationale**: SFCs are the canonical Vue pattern. They provide better template type inference with `defineProps`, are expected by Vue developers, and tooling (Volar/Vue Language Server) optimizes for them. tsup can handle `.vue` files via `unplugin-vue` or we can use `vue-tsc` for type checking. If SFC build proves problematic, the fallback is render functions — but this is unlikely with modern tsup.

### Decision: tsup with unplugin-vue for SFC compilation

**Choice**: Use `tsup` with the `unplugin-vue` plugin for `.vue` SFC compilation.
**Alternatives considered**: (1) Vite library mode, (2) Pre-compile SFCs with `vue/compiler-sfc` then feed to tsup, (3) Skip SFCs entirely and use `defineComponent` + `h()`.
**Rationale**: tsup is already used across the monorepo. Adding `unplugin-vue` integrates SFC compilation into the existing build pipeline. If plugin issues arise, **fallback**: write components as `.ts` files using `defineComponent()` with render functions (no template compilation needed). This fallback still uses `<script setup>` equivalent patterns via `defineComponent` + `setup()`.

### Decision: Reactive input signature — toValue() for flexibility

**Choice**: Accept `MaybeRefOrGetter<string>` for value and `MaybeRefOrGetter<UseQRCodeOptions>` for options.
**Alternatives considered**: Only accept plain strings/objects.
**Rationale**: Vue composables conventionally accept `MaybeRefOrGetter` so they work with both `ref()`, `computed()`, and plain values. This follows VueUse conventions and the Vue 3.4+ `toValue()` utility. If a user passes a plain string, `toValue()` just returns it. If they pass a ref, it unwraps it. Zero overhead, maximum flexibility.

### Decision: Props use defineProps with interface

**Choice**: Use `defineProps<QRCodeProps>()` with interface-based type declaration.
**Alternatives considered**: Runtime props declaration with `defineProps({ value: { type: String, required: true } })`.
**Rationale**: Type-based declaration provides better TypeScript inference, is more concise, and aligns with the TypeScript-heavy approach of the monorepo. Vue 3.3+ handles type-based defineProps well including defaults via `withDefaults()`.

### Decision: Slots for children content

**Choice**: Use Vue's default slot for `QRCodeDownload` button content.
**Alternatives considered**: A `label` prop.
**Rationale**: Slots are the Vue equivalent of React's `children` pattern. They allow arbitrary template content (not just strings), which is more flexible and idiomatic.

### Decision: Download helpers as standalone functions

**Choice**: Extract `downloadBlob()` and `svgToPngBlob()` as module-level utility functions (same as React).
**Alternatives considered**: Putting them inside the composable.
**Rationale**: These are pure functions with no Vue reactivity. Keeping them at module level makes them testable independently and mirrors the React implementation exactly.

## Data Flow

```
User Props/Refs
     │
     ▼
useQRCode(value, options)
     │
     ├─ computed(() => {
     │    QRCodeGenerator.generate(value)  ──→  matrix
     │    SVGRenderer.render(matrix, opts) ──→  svgString
     │    SVGRenderer.toDataURL(matrix)    ──→  svgDataURL
     │  })
     │
     ├─ download() function (closure over computed results)
     │    ├─ SVG: Blob download
     │    └─ PNG: SVG → Image → Canvas → PNG Blob → download
     │
     └─ Returns: { svgString, svgDataURL, download, isError, error }

<QRCode />           → useQRCode() → v-html="svgString"
<QRCodeCanvas />     → QRCodeGenerator + CanvasRenderer (via watchEffect + template ref)
<QRCodeDownload />   → useQRCode() → <button @click="download(...)"><slot /></button>
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/vue/package.json` | Create | Package manifest with vue ^3.4 peer dep, @qr-plus/core dep |
| `packages/vue/tsconfig.json` | Create | Extends ../../tsconfig.base.json, adds vue-specific compiler options |
| `packages/vue/tsup.config.ts` | Create | Dual CJS/ESM build, external vue, SFC plugin if needed |
| `packages/vue/vitest.config.ts` | Create | jsdom environment, test setup file |
| `packages/vue/src/index.ts` | Create | Barrel export: components, composable, types |
| `packages/vue/src/types.ts` | Create | Shared types (adapted from React — no React.ReactNode, add slot types) |
| `packages/vue/src/useQRCode.ts` | Create | Composable: computed-based QR generation + download |
| `packages/vue/src/QRCode.vue` | Create | SVG component: v-html with wrapper div |
| `packages/vue/src/QRCodeCanvas.vue` | Create | Canvas component: template ref + watchEffect |
| `packages/vue/src/QRCodeDownload.vue` | Create | Download button: slot-based content + click handler |
| `packages/vue/tests/setup.ts` | Create | Vitest setup (minimal — may not need jest-dom) |
| `packages/vue/tests/useQRCode.test.ts` | Create | Composable tests (mock core, test reactivity) |
| `packages/vue/tests/QRCode.test.ts` | Create | SVG component tests |
| `packages/vue/tests/QRCodeCanvas.test.ts` | Create | Canvas component tests |
| `packages/vue/tests/QRCodeDownload.test.ts` | Create | Download button tests |

## Interfaces / Contracts

### Types (packages/vue/src/types.ts)

```typescript
import type {
  ErrorCorrectionLevel,
  ModuleShape,
  QRCodeOptions,
  SVGRenderOptions,
  RenderOptions,
} from "@qr-plus/core";

// Same DOWNLOAD_FORMAT constant as React
const DOWNLOAD_FORMAT = { SVG: "svg", PNG: "png" } as const;
type DownloadFormat = (typeof DOWNLOAD_FORMAT)[keyof typeof DOWNLOAD_FORMAT];

// Core QR generation options (same as React)
interface QROptions {
  errorCorrectionLevel?: ErrorCorrectionLevel;
}

// Visual rendering options (same as React)
interface QRRenderOptions {
  size?: number;        // default 200
  margin?: number;      // default 4
  darkColor?: string;   // default "#000000"
  lightColor?: string;  // default "#ffffff"
  moduleShape?: ModuleShape;  // default "square"
  cornerRadius?: number;      // default 0.5
}

// Combined base props (same as React)
interface QRCodeBaseProps extends QROptions, QRRenderOptions {
  value: string;
}

// QRCode SVG component props (Vue: class instead of className, title for a11y)
interface QRCodeProps extends QRCodeBaseProps {
  class?: string;
  title?: string;
}

// QRCodeCanvas component props
interface QRCodeCanvasProps extends QRCodeBaseProps {
  class?: string;
}

// QRCodeDownload component props (Vue: slot replaces children prop)
interface QRCodeDownloadProps extends QRCodeBaseProps {
  fileName?: string;      // default "qrcode"
  format?: DownloadFormat; // default "svg"
  class?: string;
  disabled?: boolean;
}

// Composable options (same as React hook options)
interface UseQRCodeOptions extends QROptions, QRRenderOptions {}

// Composable return type — all reactive
interface UseQRCodeResult {
  svgString: ComputedRef<string>;
  svgDataURL: ComputedRef<string>;
  download: (fileName?: string, format?: DownloadFormat) => void;
  isError: ComputedRef<boolean>;
  error: ComputedRef<Error | null>;
}
```

### Composable Signature

```typescript
import type { MaybeRefOrGetter } from "vue";

function useQRCode(
  value: MaybeRefOrGetter<string>,
  options?: MaybeRefOrGetter<UseQRCodeOptions>,
): UseQRCodeResult;
```

### Component Props (defineProps)

```vue
<!-- QRCode.vue -->
<script setup lang="ts">
defineProps<QRCodeProps>();
</script>

<!-- QRCodeCanvas.vue -->
<script setup lang="ts">
defineProps<QRCodeCanvasProps>();
</script>

<!-- QRCodeDownload.vue -->
<script setup lang="ts">
const props = withDefaults(defineProps<QRCodeDownloadProps>(), {
  fileName: "qrcode",
  format: "svg",
});
</script>
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useQRCode` composable — generation, reactivity, memoization, errors, download | vitest + mock `@qr-plus/core`. Use a simple `withSetup()` helper or direct invocation in `setup()` context. |
| Unit | `<QRCode />` — rendering, a11y, class binding, error fallback | vitest + `@vue/test-utils` `mount()` + jsdom |
| Unit | `<QRCodeCanvas />` — canvas rendering, reactive updates, error handling | vitest + `@vue/test-utils` `mount()` + jsdom, mock CanvasRenderer |
| Unit | `<QRCodeDownload />` — click handler, slot rendering, disabled state | vitest + `@vue/test-utils` `mount()` + jsdom |
| Build | Package builds correctly | `pnpm --filter @qr-plus/vue build` in CI |
| Types | Type checking passes | `pnpm --filter @qr-plus/vue typecheck` in CI |

Mock strategy: Same as React — `vi.mock("@qr-plus/core")` with fake QRCode class and SVGRenderer/CanvasRenderer. This isolates tests from core logic changes.

## Migration / Rollout

No migration required. This is a new package. Consumers install it fresh:

```bash
pnpm add @qr-plus/vue
```

## Open Questions

- [x] SFC vs render functions — **Decided**: Try SFCs first, fallback to `defineComponent` + `h()` if tsup plugin issues arise.
- [x] Whether to accept `MaybeRefOrGetter` — **Decided**: Yes, follow Vue composable conventions.
