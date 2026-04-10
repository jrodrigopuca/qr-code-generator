# Proposal: @qr-plus/vue — Vue 3 Wrapper

## Intent

The @qr-plus ecosystem currently supports React only. Vue is the second most popular component framework, and many teams need a Vue wrapper for QR code generation. This change creates `@qr-plus/vue` — a Vue 3 package that provides the same feature set as `@qr-plus/react`, adapted to idiomatic Vue patterns (Composition API, `<script setup>`, reactive refs, slots instead of children props).

## Scope

### In Scope
- `useQRCode()` composable — reactive QR generation with SVG string, data URL, download helper, and error state
- `<QRCode />` SFC — SVG-first QR code component (all module shapes supported)
- `<QRCodeCanvas />` SFC — Canvas-based QR rendering
- `<QRCodeDownload />` SFC — Download button using slots for content
- TypeScript types with `defineProps` — full type safety
- Package scaffolding: `package.json`, `tsup.config.ts`, `vitest.config.ts`, `tsconfig.json`
- Unit tests mirroring the React test suite (mock @qr-plus/core, test composable + components)
- Public API surface parity with `@qr-plus/react`

### Out of Scope
- Nuxt module/plugin (future work — separate package)
- Vue 2 support
- SSR-specific optimizations (the SVG-first approach is inherently SSR-friendly)
- Storybook or documentation site
- Canvas module shapes beyond square/rounded (core limitation, same as React)

## Approach

Port the `@qr-plus/react` package 1:1 to Vue 3 idioms:

1. **Types**: Reuse the same interface shapes (`QROptions`, `QRRenderOptions`, `QRCodeBaseProps`, etc.) but replace `React.ReactNode` with Vue slots and adapt prop conventions.
2. **Composable**: `useQRCode(value, options)` uses `computed()` for reactive SVG generation (equivalent to React's render-phase computation with ref-based memoization).
3. **Components**: Vue SFCs with `<script setup lang="ts">`, `defineProps`, and `defineSlots`. Components internally call `useQRCode()` just like React counterparts.
4. **Download**: Same client-side pipeline (SVG blob or SVG→Canvas→PNG), shared helper functions.
5. **Build**: tsup with `vue` as external, same dual CJS/ESM output.
6. **Tests**: vitest + @vue/test-utils + jsdom, same mock strategy as React.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/vue/` | New | Entire new package |
| `packages/vue/src/useQRCode.ts` | New | Composable (Composition API) |
| `packages/vue/src/QRCode.vue` | New | SVG component (SFC) |
| `packages/vue/src/QRCodeCanvas.vue` | New | Canvas component (SFC) |
| `packages/vue/src/QRCodeDownload.vue` | New | Download button component (SFC) |
| `packages/vue/src/types.ts` | New | Shared types (adapted from React) |
| `packages/vue/src/index.ts` | New | Public API barrel export |
| `packages/vue/tests/` | New | Unit tests |
| `packages/vue/package.json` | New | Package config |
| `packages/vue/tsup.config.ts` | New | Build config |
| `packages/vue/vitest.config.ts` | New | Test config |
| `packages/vue/tsconfig.json` | New | TypeScript config |
| `pnpm-workspace.yaml` | Unchanged | Already covers `packages/*` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| tsup SFC compilation issues | Medium | Use `unplugin-vue` or pre-compile SFCs. Alternatively, write components as TSX/render functions instead of `.vue` SFCs if build issues arise. |
| Canvas ref lifecycle differences | Low | Vue's `onMounted` + `watchEffect` maps cleanly to React's `useEffect`. Well-understood pattern. |
| Vue reactivity overhead on large QR data | Low | QR matrices are small (max ~177×177). Computed values handle this trivially. |
| Test utils API differences | Low | @vue/test-utils is mature. Mock strategy for @qr-plus/core is framework-agnostic. |

## Rollback Plan

This is a new package in an isolated directory. Rollback is trivial:
1. Remove `packages/vue/` directory
2. No other packages are affected (no cross-references yet)

## Dependencies

- `@qr-plus/core` — workspace dependency (same as React)
- `vue ^3.4` — peer dependency
- `@vue/test-utils` — dev dependency for testing
- `tsup ^8` — dev dependency for build
- `vitest ^4` — dev dependency for tests

## Success Criteria

- [ ] `pnpm --filter @qr-plus/vue build` succeeds with CJS + ESM + .d.ts output
- [ ] `pnpm --filter @qr-plus/vue test` passes all tests
- [ ] `pnpm --filter @qr-plus/vue typecheck` passes with no errors
- [ ] Public API matches React: `QRCode`, `QRCodeCanvas`, `QRCodeDownload`, `useQRCode`, all types
- [ ] All module shapes work: square, rounded, circle, dot (SVG), square/rounded (Canvas)
- [ ] Download works for both SVG and PNG formats
- [ ] Zero runtime dependencies (only `vue` as peer dep + `@qr-plus/core` as dep)
- [ ] Biome check passes with monorepo config
