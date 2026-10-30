import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  type ErrorCorrectionLevel,
  QRCode,
  SVGRenderer,
  TerminalRenderer,
} from "@qr-plus/core";
import type { TerminalStyle } from "@qr-plus/core";
import {
  CommandError,
  defineCLI,
  defineCommand,
  definePlugin,
} from "@runa-cmd/core";
import type { OptionSchema } from "@runa-cmd/core";
import { z } from "@runa-cmd/core/zod";
import { helpPlugin } from "@runa-cmd/help";
import type { RenderFnCtx } from "@runa-cmd/help";

const SIZE_PRESETS = {
  small: { scale: 4, margin: 2 },
  medium: { scale: 8, margin: 4 },
  large: { scale: 12, margin: 6 },
} as const;

type SizePreset = keyof typeof SIZE_PRESETS;

interface CLIOptions {
  output?: string;
  format?: "terminal" | "svg" | "png";
  size?: SizePreset;
  ecl?: ErrorCorrectionLevel;
  darkColor?: string;
  lightColor?: string;
  style?: TerminalStyle;
  invert?: boolean;
}

function resolveFormat(options: CLIOptions): "terminal" | "svg" | "png" {
  if (options.format) return options.format;
  if (options.output) {
    const ext = options.output.toLowerCase().split(".").pop();
    if (ext === "svg") return "svg";
    if (ext === "png") return "png";
  }
  return "terminal";
}

function generateTerminal(content: string, options: CLIOptions): void {
  const qr = new QRCode(content, {
    errorCorrectionLevel: options.ecl ?? "M",
  });
  const { matrix } = qr.generate();

  const output = TerminalRenderer.render(matrix, {
    style: options.style ?? "unicode",
    invert: options.invert ?? false,
  });

  console.log(output);
}

function generateSVG(content: string, options: CLIOptions): void {
  const preset = SIZE_PRESETS[options.size ?? "medium"];
  const qr = new QRCode(content, {
    errorCorrectionLevel: options.ecl ?? "M",
  });
  const { matrix } = qr.generate();

  const svg = SVGRenderer.render(matrix, {
    scale: preset.scale,
    margin: preset.margin,
    darkColor: options.darkColor ?? "#000000",
    lightColor: options.lightColor ?? "#ffffff",
  });

  if (options.output) {
    const filePath = resolve(process.cwd(), options.output);
    writeFileSync(filePath, svg, "utf-8");
    console.log(`✓ SVG saved to ${filePath}`);
  } else {
    process.stdout.write(svg);
  }
}

function generatePNG(content: string, options: CLIOptions): void {
  const preset = SIZE_PRESETS[options.size ?? "medium"];
  const qr = new QRCode(content, {
    errorCorrectionLevel: options.ecl ?? "M",
  });
  const { matrix } = qr.generate();

  const size = matrix.length;
  const totalSize = (size + preset.margin * 2) * preset.scale;
  const darkColor = hexToRGB(options.darkColor ?? "#000000");
  const lightColor = hexToRGB(options.lightColor ?? "#ffffff");

  const png = encodePNG(
    matrix,
    totalSize,
    preset.scale,
    preset.margin,
    darkColor,
    lightColor,
  );

  if (options.output) {
    const filePath = resolve(process.cwd(), options.output);
    writeFileSync(filePath, png);
    console.log(`✓ PNG saved to ${filePath} (${totalSize}x${totalSize}px)`);
  } else {
    process.stdout.write(png);
  }
}

// --- Minimal PNG encoder (zero dependencies) ---

function hexToRGB(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    Number.parseInt(h.substring(0, 2), 16),
    Number.parseInt(h.substring(2, 4), 16),
    Number.parseInt(h.substring(4, 6), 16),
  ];
}

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function adler32(buf: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function deflateRaw(data: Uint8Array): Uint8Array {
  // Store-only deflate (no compression, maximum compatibility)
  const blocks: Uint8Array[] = [];
  const maxBlock = 65535;

  for (let offset = 0; offset < data.length; offset += maxBlock) {
    const end = Math.min(offset + maxBlock, data.length);
    const chunk = data.subarray(offset, end);
    const isLast = end === data.length;

    const block = new Uint8Array(5 + chunk.length);
    block[0] = isLast ? 0x01 : 0x00;
    const len = chunk.length;
    block[1] = len & 0xff;
    block[2] = (len >> 8) & 0xff;
    block[3] = ~len & 0xff;
    block[4] = (~len >> 8) & 0xff;
    block.set(chunk, 5);
    blocks.push(block);
  }

  const totalLen = blocks.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLen);
  let pos = 0;
  for (const block of blocks) {
    result.set(block, pos);
    pos += block.length;
  }
  return result;
}

function zlibCompress(data: Uint8Array): Uint8Array {
  const deflated = deflateRaw(data);
  const checksum = adler32(data);

  const result = new Uint8Array(2 + deflated.length + 4);
  // zlib header (no compression)
  result[0] = 0x78;
  result[1] = 0x01;
  result.set(deflated, 2);
  // adler32 checksum (big-endian)
  const off = 2 + deflated.length;
  result[off] = (checksum >> 24) & 0xff;
  result[off + 1] = (checksum >> 16) & 0xff;
  result[off + 2] = (checksum >> 8) & 0xff;
  result[off + 3] = checksum & 0xff;
  return result;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);
  const crcData = chunk.subarray(4, 8 + data.length);
  view.setUint32(8 + data.length, crc32(crcData));
  return chunk;
}

function encodePNG(
  matrix: number[][],
  totalSize: number,
  scale: number,
  margin: number,
  dark: [number, number, number],
  light: [number, number, number],
): Uint8Array {
  const qrSize = matrix.length;

  // Build raw pixel data (filter byte + RGB per pixel per row)
  const rawData = new Uint8Array(totalSize * (1 + totalSize * 3));
  let pos = 0;

  for (let y = 0; y < totalSize; y++) {
    rawData[pos++] = 0; // filter: none
    const qrY = Math.floor(y / scale) - margin;

    for (let x = 0; x < totalSize; x++) {
      const qrX = Math.floor(x / scale) - margin;
      const isDark =
        qrY >= 0 &&
        qrY < qrSize &&
        qrX >= 0 &&
        qrX < qrSize &&
        matrix[qrY][qrX] === 1;
      const color = isDark ? dark : light;
      rawData[pos++] = color[0];
      rawData[pos++] = color[1];
      rawData[pos++] = color[2];
    }
  }

  const compressed = zlibCompress(rawData);

  // IHDR
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, totalSize); // width
  ihdrView.setUint32(4, totalSize); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = pngChunk("IHDR", ihdr);
  const idatChunk = pngChunk("IDAT", compressed);
  const iendChunk = pngChunk("IEND", new Uint8Array(0));

  const png = new Uint8Array(
    signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length,
  );
  let offset = 0;
  png.set(signature, offset);
  offset += signature.length;
  png.set(ihdrChunk, offset);
  offset += ihdrChunk.length;
  png.set(idatChunk, offset);
  offset += idatChunk.length;
  png.set(iendChunk, offset);

  return png;
}

// --- CLI setup ---

const VERSION = "1.0.0";

const generate = defineCommand({
  meta: {
    name: "qr-plus",
    description: "Generate QR codes from the terminal",
    options: {
      output: { alias: ["-o"], hint: "<file>" },
      format: { alias: ["-f"], hint: "<type>" },
      size: { alias: ["-s"], hint: "<preset>" },
      ecl: { alias: ["-e"], hint: "<level>" },
      "dark-color": { hint: "<hex>" },
      "light-color": { hint: "<hex>" },
      style: { hint: "<style>" },
    },
  },
  args: {
    // Optional here because `qr-plus -- -text` delivers the content through
    // ctx.rest; run() enforces that exactly one was given.
    content: z.string().optional().describe("Text or URL to encode"),
  },
  options: {
    output: z
      .string()
      .optional()
      .describe("Output file path (format inferred from extension)"),
    format: z
      .enum(["terminal", "svg", "png"])
      .optional()
      .describe("Output format: terminal, svg, png"),
    size: z
      .enum(["small", "medium", "large"])
      .default("medium")
      .describe("Size preset: small, medium, large"),
    ecl: z
      .enum(["L", "M", "Q", "H"])
      .default("M")
      .describe("Error correction: L, M, Q, H"),
    "dark-color": z
      .string()
      .default("#000000")
      .describe("Dark module color (hex)"),
    "light-color": z
      .string()
      .default("#ffffff")
      .describe("Light module color (hex)"),
    style: z
      .enum(["unicode", "compact", "ascii"])
      .default("unicode")
      .describe("Terminal style: unicode, compact, ascii"),
    invert: z
      .boolean()
      .default(false)
      .describe("Invert colors (for dark terminals)"),
  },
  run({ args, options, rest }) {
    const [content, ...extra] =
      args.content === undefined ? rest : [args.content, ...rest];

    if (content === undefined) {
      throw new CommandError("Missing required argument: <content>", {
        exitCode: 2,
      });
    }
    if (extra.length > 0) {
      throw new CommandError(`Unexpected argument: '${extra[0]}'`, {
        exitCode: 2,
      });
    }

    const opts: CLIOptions = {
      ...options,
      darkColor: options["dark-color"],
      lightColor: options["light-color"],
    };

    try {
      const format = resolveFormat(opts);

      switch (format) {
        case "terminal":
          generateTerminal(content, opts);
          break;
        case "svg":
          generateSVG(content, opts);
          break;
        case "png":
          generatePNG(content, opts);
          break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  },
});

const versionPlugin = definePlugin({
  meta: { name: "qr-plus-version", version: VERSION },
  capabilities: { addGlobalOptions: true },
  setup(api) {
    api.addGlobalOption(
      "version",
      z.boolean().default(false).describe("Show version"),
      { alias: ["-V"] },
    );
    api.hook("onGlobalFlags", (ctx) => {
      if (!ctx.globalOptions?.version) return;
      console.log(VERSION);
      ctx.shortCircuit?.();
    });
  },
});

function formatOption(option: OptionSchema): [string, string] {
  const flags = [...(option.alias ?? []), `--${option.name}`].join(", ");
  const hasDefault =
    option.defaultValue !== undefined && option.defaultValue !== false;
  return [
    option.hint ? `${flags} ${option.hint}` : flags,
    `${option.description ?? ""}${hasDefault ? ` (default: ${option.defaultValue})` : ""}`,
  ];
}

// Runa's default renderer lists commands, not the options of a single-command
// CLI, so the help is built here from the same schema.
const renderHelp = ({ schema }: RenderFnCtx): string => {
  const options =
    "commands" in schema
      ? [...(schema.commands[0]?.options ?? []), ...schema.globalOptions]
      : schema.options;
  const rows = options.map(formatOption);
  const width = Math.max(...rows.map(([flags]) => flags.length));

  return [
    "Usage: qr-plus [options] <content>",
    "",
    "Generate QR codes from the terminal",
    "",
    "Arguments:",
    "  content  Text or URL to encode",
    "",
    "Options:",
    ...rows.map(
      ([flags, text]) => `  ${flags.padEnd(width)}  ${text}`.trimEnd(),
    ),
  ].join("\n");
};

// In single-command mode Runa consumes a first token equal to the command key,
// so the key must be unreachable: `qr-plus qr-plus` has to encode "qr-plus".
const cli = defineCLI({
  meta: {
    name: "qr-plus",
    version: VERSION,
    description: "Generate QR codes from the terminal",
  },
  commands: { "\0qr-plus": generate },
  plugins: [helpPlugin({ render: renderHelp }), versionPlugin],
});

cli.run();
