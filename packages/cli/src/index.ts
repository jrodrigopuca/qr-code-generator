import { writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import {
  type ErrorCorrectionLevel,
  QRCode,
  SVGRenderer,
  TerminalRenderer,
} from "@qr-plus/core";
import type { TerminalStyle } from "@qr-plus/core";
import { CommandError, defineCommand, runCLI } from "@runa-cmd/core";
import { z } from "@runa-cmd/core/zod";
import { version } from "../package.json";

const SIZE_PRESETS = {
  small: { scale: 4, margin: 2 },
  medium: { scale: 8, margin: 4 },
  large: { scale: 12, margin: 6 },
} as const;

type SizePreset = keyof typeof SIZE_PRESETS;

// Defaults live in the command schema, so only these two can be absent.
interface CLIOptions {
  output?: string;
  format?: "terminal" | "svg" | "png";
  size: SizePreset;
  ecl: ErrorCorrectionLevel;
  darkColor: string;
  lightColor: string;
  style: TerminalStyle;
  invert: boolean;
}

function resolveFormat({
  format,
  output,
}: CLIOptions): "terminal" | "svg" | "png" {
  if (output === undefined) return format ?? "terminal";

  if (format === "terminal") {
    throw new CommandError(
      "--format terminal cannot write to a file: use svg or png, or drop --output",
      { exitCode: 2 },
    );
  }
  if (format) return format;

  const ext = extname(output).toLowerCase();
  if (ext === ".svg") return "svg";
  if (ext === ".png") return "png";

  throw new CommandError(
    `Cannot infer the format of '${output}': use a .svg or .png extension, or set --format`,
    { exitCode: 2 },
  );
}

function generateTerminal(content: string, options: CLIOptions): void {
  const qr = new QRCode(content, {
    errorCorrectionLevel: options.ecl,
  });
  const { matrix } = qr.generate();

  const output = TerminalRenderer.render(matrix, {
    style: options.style,
    invert: options.invert,
  });

  console.log(output);
}

function generateSVG(content: string, options: CLIOptions): void {
  const preset = SIZE_PRESETS[options.size];
  const qr = new QRCode(content, {
    errorCorrectionLevel: options.ecl,
  });
  const { matrix } = qr.generate();

  const svg = SVGRenderer.render(matrix, {
    scale: preset.scale,
    margin: preset.margin,
    darkColor: options.darkColor,
    lightColor: options.lightColor,
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
  const preset = SIZE_PRESETS[options.size];
  const qr = new QRCode(content, {
    errorCorrectionLevel: options.ecl,
  });
  const { matrix } = qr.generate();

  const size = matrix.length;
  const totalSize = (size + preset.margin * 2) * preset.scale;
  const darkColor = hexToRGB(options.darkColor);
  const lightColor = hexToRGB(options.lightColor);

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
  const digits = hex.slice(1);
  const h = digits.length === 3 ? digits.replace(/./g, "$&$&") : digits;
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

// Validated here because each renderer fails differently: PNG parses the digits
// into wrong colors, and SVG copies the value into the markup.
const hexColor = (flag: string) =>
  z
    .string()
    .regex(
      /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i,
      `${flag} must be a hex color such as #1a1a2e or #abc`,
    );

const generate = defineCommand({
  meta: {
    name: "qr-plus",
    version,
    description: "Generate QR codes from the terminal",
    options: {
      output: { alias: ["-o"], valueName: "file" },
      format: { alias: ["-f"] },
      size: { alias: ["-s"] },
      ecl: { alias: ["-e"] },
      darkColor: { valueName: "hex" },
      lightColor: { valueName: "hex" },
    },
  },
  args: {
    content: z.string().describe("Text or URL to encode"),
  },
  options: {
    output: z
      .string()
      .min(1, "--output cannot be empty")
      .optional()
      .describe("Output file path (format inferred from extension)"),
    format: z
      .enum(["terminal", "svg", "png"])
      .optional()
      .describe("Output format"),
    size: z
      .enum(["small", "medium", "large"])
      .default("medium")
      .describe("Size preset"),
    ecl: z
      .enum(["L", "M", "Q", "H"])
      .default("M")
      .describe("Error correction level"),
    darkColor: hexColor("--dark-color")
      .default("#000000")
      .describe("Dark module color"),
    lightColor: hexColor("--light-color")
      .default("#ffffff")
      .describe("Light module color"),
    style: z
      .enum(["unicode", "compact", "ascii"])
      .default("unicode")
      .describe("Terminal style"),
    invert: z
      .boolean()
      .default(false)
      .describe("Invert colors (for dark terminals)"),
  },
  run({ args: { content }, options }) {
    const format = resolveFormat(options);

    try {
      switch (format) {
        case "terminal":
          generateTerminal(content, options);
          break;
        case "svg":
          generateSVG(content, options);
          break;
        case "png":
          generatePNG(content, options);
          break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  },
});

runCLI(generate);
