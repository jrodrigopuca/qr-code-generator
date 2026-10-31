# Migration guide

How to move between versions with breaking changes. The full list of changes is in the [changelog](../CHANGELOG.md).

- [`@qr-plus/cli` 1.x to 2.0](#qr-pluscli-1x-to-20)
- [Node 18 to Node 24](#node-18-to-node-24)
- [`qr-pure` to `@qr-plus/core`](#qr-pure-to-qr-pluscore)

## `@qr-plus/cli` 1.x to 2.0

> **Not released yet.** npm still serves `@qr-plus/cli` 1.0.0. This section describes the code in `master`.

QR codes don't change: for the same valid arguments, stdout and the generated files are identical to 1.0.0. If you run the CLI by hand, you only need Node 24 and to replace `-V` with `--version`.

Scripts need more care, because several mistakes that used to pass now fail:

1. Install Node 24 or later.
2. Replace `-V` with `--version`.
3. Handle exit code 2 if your script checks for 1.
4. Check every `--output`: its extension must be `.svg` or `.png`, unless you also pass `--format svg` or `--format png`.
5. Check every color: it must be `#rrggbb` or `#rgb`.
6. Stop parsing `--help` or error messages, if you do.

### Exit codes

Usage errors now exit with 2. Errors while generating or writing the QR code still exit with 1.

| Case | 1.0.0 | 2.0 |
|---|---|---|
| Valid command | 0 | 0 |
| Missing `<content>` | 1 | 2 |
| Second positional argument | 1 | 2 |
| Unknown flag | 1 | 2 |
| Flag without its value | 1 | 2 |
| Invalid `--ecl` or `--size` | 1 | 2 |
| Invalid `--format` | 0, with no output | 2 |
| Invalid `--style` | 0, using `unicode` | 2 |
| Empty content or content too long | 1 | 1 |
| File can't be written | 1 | 1 |

### Output files

In 1.0.0, these commands exited with 0 and created no file. A script could not tell that the file was missing. They now exit with 2.

| Command | What to do |
|---|---|
| `qr-plus hola -o qr.txt` | Use `.svg` or `.png`, or add `-f svg` or `-f png` |
| `qr-plus hola -o qr` | Same |
| `qr-plus hola -f terminal -o qr.svg` | Drop `-f terminal`, or drop `-o` |
| `qr-plus hola -o ""` | Pass a path |

`-o svg` and `-o png` used to create a file with that name, taking the name as its extension. They now fail in the same way. Use `-o qr.svg`, or `-f svg -o svg` to keep that name.

`--format` still wins over the extension: `-f png -o qr.dat` writes a PNG.

### Colors

`--dark-color` and `--light-color` accept `#rrggbb` and `#rgb`, in either case. Anything else exits with 2.

| Value | 1.0.0 | 2.0 | What to do |
|---|---|---|---|
| `#abc` in PNG | Wrong color | `#aabbcc` | Nothing |
| `112233` | Worked in PNG, invalid in SVG | Error | Add the `#` |
| Invalid value in PNG, such as `nothex` | Wrong color | Error | Use a hex color |
| Named color in SVG, such as `red` | Worked | Error | Use its hex value: `#ff0000` |
| Other CSS values in SVG, such as `transparent` or `rgb(0,0,0)` | Passed to the SVG | Error | Use a hex color. A transparent background has no replacement |

Keep the quotes around colors. In bash, an unquoted `#` starts a comment:

```bash
qr-plus "Hello" -o qr.svg --dark-color "#1a1a2e"
```

### Flags and messages

| 1.0.0 | 2.0 |
|---|---|
| `-V` | `--version` |
| `--no-invert` is an error | Turns `--invert` off, and so does `--invert=false` |
| Errors start with `error:` | New wording, followed by a pointer to `--help` for most usage errors |
| `--help` in `commander` format | New layout, which lists the allowed values next to each flag |

## Node 18 to Node 24

All published packages require Node 24 or later, up from Node 18: `@qr-plus/core`, `react`, `vue`, `wifi`, `vcard`, `compress` and `cli`.

> **Not released yet.** The versions on npm still declare Node 18.

The libraries have no API changes, so your code doesn't need to change. If you can't upgrade Node, stay on your current version.

## `qr-pure` to `@qr-plus/core`

`qr-pure` is deprecated: it only re-exports `@qr-plus/core`. Install `@qr-plus/core` and change your import. The API is the same.

```diff
- import { generateQR } from "qr-pure";
+ import { generateQR } from "@qr-plus/core";
```
