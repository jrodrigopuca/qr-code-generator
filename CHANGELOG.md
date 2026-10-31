# Changelog

Notable changes to the packages in this repository. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

Breaking changes come with steps in the [migration guide](docs/MIGRATION.md).

## [Unreleased]

Nothing here is on npm yet. These changes will ship together once Runa is stable
([ADR-0001](docs/adr/0001-publicar-juntos-con-runa-estable.md)).

### All published packages

Applies to `@qr-plus/core`, `react`, `vue`, `wifi`, `vcard`, `compress` and `cli`.

#### Changed

- **Breaking:** `engines` now requires Node 24 or later, up from Node 18.
- Type declarations were regenerated with TypeScript 6. The public API is the same.

### @qr-plus/cli

Planned as 2.0.0.

#### Changed

- **Breaking:** usage errors exit with code 2, not 1.
- **Breaking:** invalid `--format` and `--style` values are errors. They used to exit with 0.
- **Breaking:** `--output` fails when the format can't be determined or the format is `terminal`. It used to exit with 0 without writing a file.
- **Breaking:** `--dark-color` and `--light-color` only accept `#rrggbb` and `#rgb`, plus `transparent` for `--light-color` in SVG output.
- **Breaking:** error messages and `--help` have a new format.
- The CLI is built on `@runa-cmd/core` and `zod`, replacing `commander`.

#### Added

- `--no-invert` and `--invert=false`.
- Suggestions for mistyped flags.

#### Removed

- **Breaking:** the `-V` alias. Use `--version`.

#### Fixed

- `#rgb` colors produce the right color in PNG output.
- `--output svg` no longer treats a file named `svg` as having a `.svg` extension.
