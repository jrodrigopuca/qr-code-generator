# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project status documentation (`docs/PROJECT_STATUS.md`)

---

## [2.1.0] - 2026-02-18

### Added

- **TypeDoc API documentation** with automatic deployment to GitHub Pages
- API docs link badge in README
- Navigation links to GitHub and npm in generated docs

### Changed

- Exported internal types (`CapacityInfo`, `BlockInfo`, `BlocksConfig`) for advanced usage
- Updated documentation with API reference link

### Fixed

- VERSION constant now synchronized with package.json

---

## [2.0.5] - 2026-02-18

This was the first public release on npm. Major rewrite from the original 2020 codebase.

### Added

#### Core

- **Full ISO/IEC 18004 implementation** for QR code generation
- Support for all 40 QR versions (21x21 to 177x177 modules)
- 4 error correction levels: L (7%), M (15%), Q (25%), H (30%)
- 3 encoding modes with auto-detection:
  - **Numeric**: 10 bits per 3 digits
  - **Alphanumeric**: 11 bits per 2 characters
  - **Byte**: 8 bits per character (UTF-8 support)
- Automatic version selection based on data length and error correction level
- Automatic mask selection with penalty scoring (all 4 rules implemented)
- Reed-Solomon error correction over GF(2^8)

#### Renderers

- **CanvasRenderer**: HTML5 Canvas rendering with `render()`, `toDataURL()`, `toBlob()`
- **SVGRenderer**: SVG output with optimized paths and 4 module shapes:
  - `square` (default with path optimization)
  - `rounded` (configurable corner radius)
  - `circle`
  - `dot`
- **TerminalRenderer**: ASCII/Unicode output with 3 styles:
  - `unicode`: Full blocks for best contrast
  - `compact`: Half-height using half-block characters
  - `ascii`: Maximum compatibility with `##` characters
  - Supports `invert` option for dark terminal backgrounds

#### Helper Functions

- `generateQR()`: Simple QR generation
- `renderToCanvas()`: Direct canvas rendering
- `renderToSVG()`: SVG string output
- `renderToTerminal()`: Terminal text output

#### Developer Experience

- **Zero runtime dependencies**
- Dual build: CommonJS + ES Modules
- Full TypeScript declarations
- Source maps enabled
- JSDoc documentation on all public APIs
- Custom error class `QRCodeError` with typed error codes

#### Quality

- 350+ unit and integration tests
- E2E verification with jsQR decoder
- ~96% code coverage
- ESLint + Prettier configuration
- GitHub Actions CI pipeline:
  - Type checking
  - Linting
  - Tests with coverage
  - Build verification
  - E2E tests

#### Documentation

- Comprehensive README with usage examples
- Technical documentation (`docs/technical.md`)
- Project roadmap (`docs/roadmap.md`)
- Interactive demos (browser + Node.js)

### Changed

- Complete rewrite from original 2020 JavaScript implementation
- Renamed package to `qr-pure`
- Modular architecture with separated concerns:
  - `encoder/`: Encoding modes
  - `correction/`: Reed-Solomon implementation
  - `patterns/`: QR function patterns
  - `mask/`: Mask evaluation
  - `renderer/`: Output renderers
  - `constants/`: ISO standard tables

---

## [1.x] - 2020 (Pre-release)

Original implementation, never published to npm.

### Added

- Basic QR code generation
- Canvas rendering
- Mask patterns implementation

---

## Version History Summary

| Version | Date     | Highlights                                |
| ------- | -------- | ----------------------------------------- |
| 2.1.0   | Feb 2026 | TypeDoc API docs, GitHub Pages deployment |
| 2.0.5   | Feb 2026 | First npm release, complete rewrite       |
| 1.x     | Mar 2020 | Original implementation (unpublished)     |

---

[Unreleased]: https://github.com/jrodrigopuca/qr-code-generator/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/jrodrigopuca/qr-code-generator/compare/v2.0.5...v2.1.0
[2.0.5]: https://github.com/jrodrigopuca/qr-code-generator/releases/tag/v2.0.5
