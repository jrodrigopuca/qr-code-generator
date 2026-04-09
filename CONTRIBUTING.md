# Contributing to @qr-plus

## Prerequisites

- Node.js >= 18
- pnpm >= 10

## Setup

```bash
git clone https://github.com/jrodrigopuca/qr-code-generator.git
cd qr-code-generator
pnpm install
```

## Development Workflow

### Building

```bash
pnpm run build              # Build all packages (via Turborepo)
pnpm --filter @qr-plus/core build   # Build core only
pnpm --filter @qr-plus/cli build    # Build CLI only
```

### Testing

```bash
pnpm run test               # Run all tests (352 unit + 41 E2E)
pnpm run e2e                # Run E2E tests only
pnpm run typecheck          # Type-check all packages
```

### Linting & Formatting

This project uses [Biome](https://biomejs.dev/) (not ESLint + Prettier).

```bash
pnpm run check              # Lint + format check (dry run)
pnpm run check:fix          # Lint + format with auto-fix
pnpm run lint               # Lint only
pnpm run format             # Format only (with write)
pnpm run format:check       # Format check (dry run)
```

> **Note:** Biome uses **tabs** for indentation. If your editor saves with spaces, run `pnpm run check:fix` before committing.

### Documentation

```bash
pnpm run docs               # Generate TypeDoc API docs
```

## Pre-Commit Checklist

Before committing, make sure everything passes:

```bash
pnpm run build && pnpm run test && pnpm run typecheck && pnpm run check
```

## Publishing to npm

All packages in the `@qr-plus` npm organization require **OTP (2FA)** — npm will prompt for browser authorization on each publish.

### Publish a package

```bash
# Core library
pnpm --filter @qr-plus/core publish --access public

# CLI tool
pnpm --filter @qr-plus/cli publish --access public

# React
pnpm --filter @qr-plus/react publish --access public

# Wifi
pnpm --filter @qr-plus/wifi publish --access public

# VCard
pnpm --filter @qr-plus/vcard publish --access public


# Compatibility wrapper (deprecated, only if needed)
pnpm --filter qr-pure publish --access public
```

### Publish checklist

1. **Update the version** in the package's `package.json`
2. **Update `CHANGELOG.md`** if the package has one
3. **Run the full check suite:**
   ```bash
   pnpm run build && pnpm run test && pnpm run typecheck && pnpm run check
   ```
4. **Commit and push** the version bump
5. **Publish:**
   ```bash
   pnpm --filter <package-name> publish --access public
   ```
6. **Authorize** the OTP prompt in your browser

### Important notes

- The `--access public` flag is required for scoped packages (`@qr-plus/*`) on the first publish. Subsequent publishes work without it, but it doesn't hurt to include it.
- Inter-package dependencies use `workspace:^` in `package.json`. pnpm automatically replaces this with the real version (e.g., `^1.0.0`) at publish time.
- The `--filter` flag uses the `name` field from `package.json`, not the directory name. For example, `--filter qr-pure` targets `packages/qr-pure-compat/` because its name is `qr-pure`.

### Deprecating versions

To deprecate a specific version or range on npm:

```bash
npm deprecate <package>@"<version-range>" "<message>"
```

Example:

```bash
npm deprecate qr-pure@"*" "This package has been renamed to @qr-plus/core. Install @qr-plus/core instead."
```

## Project Structure

```
qr-plus/
├── packages/
│   ├── core/              ← @qr-plus/core (QR engine, zero dependencies)
│   ├── cli/               ← @qr-plus/cli (CLI tool, depends on core + commander)
│   ├── qr-pure-compat/    ← qr-pure (deprecated wrapper, re-exports core)
│   └── e2e-tests/         ← E2E test suite (verifies QR readability with jsQR)
├── docs/                  ← Ecosystem documentation
├── turbo.json             ← Turborepo pipeline config
├── biome.json             ← Biome linter/formatter config
├── tsconfig.base.json     ← Shared TypeScript config (strict, ES2015)
├── pnpm-workspace.yaml    ← Workspace: packages/*
└── package.json           ← Root monorepo (private, scripts + devDeps)
```

## Architecture Rules

- **`@qr-plus/core` must remain zero-dependency.** This is a hard rule — no exceptions.
- Satellite packages (CLI, future integrations) CAN have dependencies.
- TypeScript 6.0.2 is used — any package using tsup for DTS generation needs `"ignoreDeprecations": "6.0"` in its `tsconfig.json`.

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add new encoding mode
fix(cli): handle empty input gracefully
chore: update dependencies
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
