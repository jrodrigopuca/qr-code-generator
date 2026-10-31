# @qr-plus/cli

[![npm](https://img.shields.io/npm/v/@qr-plus/cli)](https://www.npmjs.com/package/@qr-plus/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

CLI tool for generating QR codes from the terminal. Supports terminal, SVG, and PNG output.

Built on top of [`@qr-plus/core`](https://www.npmjs.com/package/@qr-plus/core).

## Installation

```bash
npm install -g @qr-plus/cli
```

Or use directly with `npx`:

```bash
npx @qr-plus/cli "Hello World"
```

## Usage

```bash
# Print QR code to terminal (default)
qr-plus "https://example.com"

# Save as SVG
qr-plus "Hello" -o hello.svg

# Save as PNG
qr-plus "Hello" -o hello.png

# Specify format explicitly
qr-plus "Hello" -f svg -o output.svg
```

## Options

| Option                | Description                             | Default    |
| --------------------- | --------------------------------------- | ---------- |
| `-o, --output <file>` | Output file path (format inferred)      | _(stdout)_ |
| `-f, --format <type>` | Output format: terminal, svg, png       | `terminal` |
| `-s, --size <preset>` | Size preset: small, medium, large       | `medium`   |
| `-e, --ecl <level>`   | Error correction: L, M, Q, H            | `M`        |
| `--dark-color <hex>`  | Dark module color                       | `#000000`  |
| `--light-color <hex>` | Light module color                      | `#ffffff`  |
| `--style <style>`     | Terminal style: unicode, compact, ascii | `unicode`  |
| `--invert`            | Invert colors (for dark terminals)      | `false`    |

## Size Presets

| Preset   | Scale | Margin | Example (21-module QR) |
| -------- | ----- | ------ | ---------------------- |
| `small`  | 4     | 2      | 100x100 px             |
| `medium` | 8     | 4      | 232x232 px             |
| `large`  | 12    | 6      | 396x396 px             |

## Examples

### Terminal Output

```bash
# Default unicode style
qr-plus "https://github.com"

# Compact style (half-height blocks)
qr-plus "https://github.com" --style compact

# Inverted for dark terminals
qr-plus "https://github.com" --invert
```

### SVG with Custom Colors

```bash
qr-plus "https://github.com" -o qr.svg --dark-color "#1a1a2e" --light-color "#e0e0e0"
```

Colors must be `#rrggbb` or `#rgb`. Keep the quotes: in bash, an unquoted `#` starts a comment.

### PNG with Size Control

```bash
# Small for thumbnails
qr-plus "https://github.com" -o qr.png -s small

# Large for print
qr-plus "https://github.com" -o qr.png -s large -e H
```

### Pipe SVG to stdout

```bash
qr-plus "Hello" -f svg > output.svg
```

## Format Detection

When using `-o`, the format is automatically detected from the file extension:

- `.svg` → SVG output
- `.png` → PNG output
- Other → use `-f svg` or `-f png`; without it, the command fails and writes nothing

Without `-o`, the default format is `terminal`. The `terminal` format cannot be written to a file, so `-f terminal -o <file>` is an error.

## Upgrading

Moving from 1.x to 2.0? See the [migration guide](https://github.com/jrodrigopuca/qr-code-generator/blob/master/docs/MIGRATION.md).

## License

MIT
