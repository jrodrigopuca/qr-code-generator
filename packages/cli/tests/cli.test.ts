import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import {
	type ErrorCorrectionLevel,
	QRCode,
	SVGRenderer,
	TerminalRenderer,
} from "@qr-plus/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// These tests run the built binary: `pnpm test` builds it first. The expected
// output comes from @qr-plus/core, so a failure means an option got lost on its
// way through the CLI, not that the QR encoder changed.
const CLI = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const { version } = JSON.parse(
	readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
);

let workDir: string;

beforeEach(() => {
	workDir = mkdtempSync(join(tmpdir(), "qr-plus-cli-"));
});

afterEach(() => {
	rmSync(workDir, { recursive: true, force: true });
});

function run(...args: string[]) {
	const result = spawnSync(process.execPath, [CLI, ...args], {
		cwd: workDir,
		env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: undefined },
		maxBuffer: Number.POSITIVE_INFINITY,
	});
	return {
		exit: result.status,
		stdout: result.stdout,
		text: result.stdout.toString(),
		stderr: result.stderr.toString(),
	};
}

function matrixOf(content: string, ecl: ErrorCorrectionLevel = "M") {
	return new QRCode(content, { errorCorrectionLevel: ecl }).generate().matrix;
}

function terminalOf(content: string, ecl: ErrorCorrectionLevel = "M") {
	const output = TerminalRenderer.render(matrixOf(content, ecl), {
		style: "unicode",
		invert: false,
	});
	return `${output}\n`;
}

function svgOf(content: string, ecl: ErrorCorrectionLevel = "M") {
	return SVGRenderer.render(matrixOf(content, ecl), {
		scale: 8,
		margin: 4,
		darkColor: "#000000",
		lightColor: "#ffffff",
	});
}

/** Decodes the RGB PNG the CLI writes: an incomplete file fails to inflate. */
function readPNG(file: Buffer) {
	expect(file.subarray(0, 8)).toEqual(
		Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
	);

	const width = file.readUInt32BE(16);
	const height = file.readUInt32BE(20);
	const data: Buffer[] = [];
	let offset = 8;
	while (offset < file.length) {
		const length = file.readUInt32BE(offset);
		if (file.toString("latin1", offset + 4, offset + 8) === "IDAT") {
			data.push(file.subarray(offset + 8, offset + 8 + length));
		}
		offset += length + 12;
	}

	const pixels = inflateSync(Buffer.concat(data));
	const pixel = (x: number, y: number) => {
		const start = y * (1 + width * 3) + 1 + x * 3;
		return [...pixels.subarray(start, start + 3)];
	};
	return { width, height, pixel };
}

describe("terminal output", () => {
	it("is the default format", () => {
		const result = run("hola");

		expect(result.exit).toBe(0);
		expect(result.text).toBe(terminalOf("hola"));
	});

	it.each(["ascii", "compact"] as const)("renders the %s style", (style) => {
		const result = run("hola", "--style", style);

		expect(result.text).toBe(
			`${TerminalRenderer.render(matrixOf("hola"), { style, invert: false })}\n`,
		);
	});

	it("inverts the colors", () => {
		const result = run("hola", "--style", "compact", "--invert");

		expect(result.text).toBe(
			`${TerminalRenderer.render(matrixOf("hola"), { style: "compact", invert: true })}\n`,
		);
	});

	it("can turn --invert off explicitly", () => {
		expect(run("hola", "--no-invert").text).toBe(terminalOf("hola"));
	});

	it.each([
		["-e", "H"],
		["--ecl", "Q"],
	] as const)("applies the error correction level from %s", (flag, ecl) => {
		expect(run("hola", flag, ecl).text).toBe(terminalOf("hola", ecl));
	});
});

describe("SVG output", () => {
	it("goes to stdout when there is no output file", () => {
		const result = run("hola", "-f", "svg");

		expect(result.exit).toBe(0);
		expect(result.text).toBe(svgOf("hola"));
	});

	it.each([
		["small", 4, 2],
		["medium", 8, 4],
		["large", 12, 6],
	] as const)("applies the %s preset", (size, scale, margin) => {
		const result = run("hola", "--format", "svg", "--size", size);

		expect(result.text).toBe(
			SVGRenderer.render(matrixOf("hola"), {
				scale,
				margin,
				darkColor: "#000000",
				lightColor: "#ffffff",
			}),
		);
	});

	it("applies both colors", () => {
		const result = run(
			"hola",
			"-f",
			"svg",
			"-s",
			"large",
			"--dark-color",
			"#112233",
			"--light-color",
			"#ffeeff",
		);

		expect(result.text).toBe(
			SVGRenderer.render(matrixOf("hola"), {
				scale: 12,
				margin: 6,
				darkColor: "#112233",
				lightColor: "#ffeeff",
			}),
		);
	});
});

describe("PNG output", () => {
	it("draws the QR matrix with the size preset", () => {
		const matrix = matrixOf("hola");
		const scale = 4;
		const margin = 2;

		const result = run("hola", "--format", "png", "--size", "small");
		const png = readPNG(result.stdout);

		expect(result.exit).toBe(0);
		expect(png.width).toBe((matrix.length + margin * 2) * scale);
		expect(png.height).toBe(png.width);
		expect(png.pixel(0, 0)).toEqual([255, 255, 255]);
		matrix.forEach((row, y) => {
			row.forEach((module, x) => {
				expect(png.pixel((x + margin) * scale, (y + margin) * scale)).toEqual(
					module === 1 ? [0, 0, 0] : [255, 255, 255],
				);
			});
		});
	});

	it("applies both colors", () => {
		const margin = 4;
		const scale = 8;

		const result = run(
			"hola",
			"-f",
			"png",
			"--dark-color",
			"#112233",
			"--light-color",
			"#ffeeff",
		);
		const png = readPNG(result.stdout);

		// The top-left module of a QR code is always dark.
		expect(png.pixel(margin * scale, margin * scale)).toEqual([
			0x11, 0x22, 0x33,
		]);
		expect(png.pixel(0, 0)).toEqual([0xff, 0xee, 0xff]);
	});

	it("writes a large image to a pipe in full", () => {
		const result = run("x".repeat(2000), "-f", "png", "-s", "large");

		expect(result.exit).toBe(0);
		expect(result.stdout.length).toBeGreaterThan(1024 * 1024);
		expect(() => readPNG(result.stdout)).not.toThrow();
	});
});

describe("output files", () => {
	it("infers SVG from the extension", () => {
		const result = run("hola", "-o", "qr.svg");

		expect(result.exit).toBe(0);
		expect(readFileSync(join(workDir, "qr.svg"), "utf-8")).toBe(svgOf("hola"));
		expect(result.text).toContain("qr.svg");
	});

	it("infers PNG from the extension, ignoring its case", () => {
		const result = run("hola", "--output", "qr.PNG");

		expect(result.exit).toBe(0);
		expect(
			readPNG(readFileSync(join(workDir, "qr.PNG"))).width,
		).toBeGreaterThan(0);
	});

	it("lets --format win over the extension", () => {
		run("hola", "-f", "svg", "-o", "qr.png");

		expect(readFileSync(join(workDir, "qr.png"), "utf-8")).toBe(svgOf("hola"));
	});

	it("fails when the file cannot be written", () => {
		const result = run("hola", "-o", "missing/qr.svg");

		expect(result.exit).toBe(1);
		expect(result.stderr).toMatch(/^Error: /);
		expect(existsSync(join(workDir, "missing"))).toBe(false);
	});
});

describe("arguments", () => {
	it.each([
		["options before the content", ["-e", "L", "hola"], "hola", "L"],
		["the = form", ["hola", "--ecl=H"], "hola", "H"],
		[
			"the last value of a repeated flag",
			["hola", "-e", "L", "-e", "H"],
			"hola",
			"H",
		],
		[
			"a URL",
			["https://example.com/a?b=1&c=2"],
			"https://example.com/a?b=1&c=2",
			"M",
		],
		["content with =", ["a=b"], "a=b", "M"],
		[
			"content that looks like a flag, after --",
			["--", "--dash"],
			"--dash",
			"M",
		],
		["options before --", ["-e", "H", "--", "-x"], "-x", "H"],
		["a trailing --", ["hola", "--"], "hola", "M"],
	] as const)("accepts %s", (_name, args, content, ecl) => {
		const result = run(...args);

		expect(result.exit).toBe(0);
		expect(result.text).toBe(terminalOf(content, ecl));
	});

	// The CLI has no subcommands: these words are data to encode.
	it.each(["qr-plus", "help", "version"])("encodes the word %s", (word) => {
		const result = run(word);

		expect(result.exit).toBe(0);
		expect(result.text).toBe(terminalOf(word));
	});

	it("encodes the CLI name when options follow it", () => {
		expect(run("qr-plus", "-f", "svg").text).toBe(svgOf("qr-plus"));
	});
});

describe("--help and --version", () => {
	it.each(["-h", "--help"])("%s documents every option", (flag) => {
		const result = run(flag);

		expect(result.exit).toBe(0);
		expect(result.text).toContain("<content>");
		for (const option of [
			"-o, --output",
			"-f, --format",
			"-s, --size",
			"-e, --ecl",
			"--dark-color",
			"--light-color",
			"--style",
			"--invert",
			"--help",
			"--version",
		]) {
			expect(result.text).toContain(option);
		}
	});

	it("shows the help instead of encoding", () => {
		expect(run("hola", "--help").text).toBe(run("--help").text);
	});

	it("reports the version of the package", () => {
		const result = run("--version");

		expect(result.exit).toBe(0);
		expect(result.text.trim()).toBe(version);
	});
});

describe("usage errors", () => {
	// Wording belongs to Runa: only the exit code, the empty stdout and what
	// the message points at are this CLI's contract.
	it.each([
		["no content", [], /content/],
		["no content after --", ["--"], /content/],
		["an empty value for a flag", ["hola", "-e"], /--ecl/],
		["an unknown flag", ["hola", "--nope"], /--nope/],
		["the unsupported -V", ["-V"], /-V/],
		["a second argument", ["hola", "chau"], /chau/],
		["a second argument after --", ["hola", "--", "chau"], /chau/],
		["an invalid format", ["hola", "-f", "nope"], /--format/],
		["an invalid error correction level", ["hola", "-e", "Z"], /--ecl/],
		["an invalid size", ["hola", "-f", "svg", "-s", "huge"], /--size/],
		["an invalid style", ["hola", "--style", "nope"], /--style/],
	])("rejects %s", (_name, args, message) => {
		const result = run(...args);

		expect(result.exit).toBe(2);
		expect(result.stdout).toHaveLength(0);
		expect(result.stderr).toMatch(message);
	});
});

describe("generation errors", () => {
	it.each([
		["empty content", ""],
		["content too long for a QR code", "x".repeat(8000)],
	])("exits with 1 on %s", (_name, content) => {
		const result = run(content);

		expect(result.exit).toBe(1);
		expect(result.stdout).toHaveLength(0);
		expect(result.stderr).toMatch(/^Error: /);
	});
});
