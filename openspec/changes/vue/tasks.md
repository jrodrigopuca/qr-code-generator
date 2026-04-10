# Tasks: @qr-plus/vue — Vue 3 Wrapper

## Phase 1: Package Scaffolding

- [ ] 1.1 Create `packages/vue/package.json` with name `@qr-plus/vue`, `vue ^3.4` peer dep, `@qr-plus/core` workspace dep, `@vue/test-utils` + `vitest` + `tsup` + `typescript` + `jsdom` + `vue` as dev deps. Mirror `exports` field structure from `packages/react/package.json`. Add scripts: `build`, `dev`, `typecheck`, `test`, `test:watch`, `prepublishOnly`.
- [ ] 1.2 Create `packages/vue/tsconfig.json` extending `../../tsconfig.base.json`. Set `module: "es2022"`, `moduleResolution: "bundler"`, `rootDir: "src"`, `outDir: "dist"`. Remove `jsx` config (not needed for Vue SFCs). Add `"types": ["vue/ref-macros"]` if needed for type inference.
- [ ] 1.3 Create `packages/vue/tsup.config.ts` with entry `["src/index.ts"]`, format `["cjs", "esm"]`, `dts: true`, `clean: true`, `sourcemap: true`, `external: ["vue"]`. If SFC compilation is needed, add `unplugin-vue` or use `.ts` components with `defineComponent` + `h()`.
- [ ] 1.4 Create `packages/vue/vitest.config.ts` with `environment: "jsdom"`, `globals: true`, `setupFiles: ["./tests/setup.ts"]`, `include: ["tests/**/*.test.{ts,tsx}"]`.
- [ ] 1.5 Create `packages/vue/tests/setup.ts` — minimal setup (import any needed test utilities).
- [ ] 1.6 Run `pnpm install` from monorepo root to install Vue dependencies and validate workspace resolution.

## Phase 2: Types & Helpers

- [ ] 2.1 Create `packages/vue/src/types.ts` — Port all types from `packages/react/src/types.ts`. Keep `DOWNLOAD_FORMAT`, `DownloadFormat`, `QROptions`, `QRRenderOptions`, `QRCodeBaseProps`, `UseQRCodeOptions`. Adapt component prop interfaces: replace `className` with `class` (Vue convention), remove `children: React.ReactNode` from `QRCodeDownloadProps` (will use slots), import `ComputedRef` from Vue for `UseQRCodeResult`. Keep `toQRCodeOptions()`, `toSVGRenderOptions()`, `toCanvasRenderOptions()` helper functions. Add `UseQRCodeResult` with `ComputedRef` types for reactive returns.

## Phase 3: Core Implementation

- [ ] 3.1 Create `packages/vue/src/useQRCode.ts` — Implement the composable. Accept `MaybeRefOrGetter<string>` for value and `MaybeRefOrGetter<UseQRCodeOptions>` for options. Use `computed()` for `svgString`, `svgDataURL`, `isError`, `error`. Implement `buildSVGOptions()` (same as React). Implement `downloadBlob()` and `svgToPngBlob()` helper functions (copy from React — pure JS, no framework dependency). Return `UseQRCodeResult` with computed refs.
- [ ] 3.2 Create `packages/vue/src/QRCode.vue` — SFC with `<script setup lang="ts">`. Use `defineProps<QRCodeProps>()`. Call `useQRCode()` internally. Template: `<div v-if="!isError && svgString" :class="props.class" role="img" :aria-label="props.title ?? 'QR Code'" v-html="svgString" />`. Return nothing on error.
- [ ] 3.3 Create `packages/vue/src/QRCodeCanvas.vue` — SFC with `<script setup lang="ts">`. Use `defineProps<QRCodeCanvasProps>()`. Use `ref<HTMLCanvasElement>()` as template ref. Use `watchEffect()` + `onMounted()` to call `QRCodeGenerator.generate()` and `CanvasRenderer.render()` / `CanvasRenderer.renderRounded()` based on moduleShape. Clear canvas on error. Template: `<canvas ref="canvasRef" :class="props.class" role="img" aria-label="QR Code" />`.
- [ ] 3.4 Create `packages/vue/src/QRCodeDownload.vue` — SFC with `<script setup lang="ts">`. Use `withDefaults(defineProps<QRCodeDownloadProps>(), { fileName: "qrcode", format: "svg" })`. Call `useQRCode()` internally. Template: `<button type="button" @click="handleClick" :class="props.class" :disabled="props.disabled ?? isError"><slot /></button>`.
- [ ] 3.5 Create `packages/vue/src/index.ts` — Barrel export. Export `QRCode`, `QRCodeCanvas`, `QRCodeDownload` components. Export `useQRCode` composable. Export all public types.

## Phase 4: Testing

- [ ] 4.1 Create `packages/vue/tests/useQRCode.test.ts` — Mock `@qr-plus/core` (same vi.mock strategy as React). Test: basic generation returns svgString + svgDataURL; options forwarding (errorCorrectionLevel, size/margin → scale computation, darkColor/lightColor/moduleShape/cornerRadius); defaults (size=200, margin=4); error handling (caught Error, non-Error throw wrapping); download SVG with xmlDeclaration; download skips on error. Test reactivity: changing value input ref triggers recomputation.
- [ ] 4.2 Create `packages/vue/tests/QRCode.test.ts` — Mock `@qr-plus/core`. Test: renders element with `role="img"`; injects SVG via v-html; default `aria-label="QR Code"`; custom title → aria-label; class binding; renders nothing on error; renders nothing on empty svgString; all options forwarded.
- [ ] 4.3 Create `packages/vue/tests/QRCodeCanvas.test.ts` — Mock `@qr-plus/core` (QRCode + CanvasRenderer). Test: renders canvas element; calls CanvasRenderer.render on mount; uses renderRounded when moduleShape="rounded"; canvas cleared on error; has role="img" and aria-label.
- [ ] 4.4 Create `packages/vue/tests/QRCodeDownload.test.ts` — Mock `@qr-plus/core`. Test: renders button element; slot content appears inside button; click triggers download; default fileName and format; disabled on error; explicit disabled prop overrides.

## Phase 5: Build Verification

- [ ] 5.1 Run `pnpm --filter @qr-plus/vue build` — Verify dist/ output contains `index.js`, `index.cjs`, `index.d.ts`. Fix any SFC compilation issues (fallback to `defineComponent` + `h()` if needed).
- [ ] 5.2 Run `pnpm --filter @qr-plus/vue typecheck` — Verify zero type errors.
- [ ] 5.3 Run `pnpm --filter @qr-plus/vue test` — Verify all tests pass.
- [ ] 5.4 Run `pnpm run check` (biome) from monorepo root — Verify linting/formatting passes for new files.
