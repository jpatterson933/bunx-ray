import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "bunx-ray-demo-"));

try {
  createExampleFiles(fixture);
  const setup =
    "Object.defineProperty(process.stdout, 'columns', {value: 80}); Object.defineProperty(process.stdout, 'rows', {value: 24});";
  const output = execFileSync(
    process.execPath,
    [
      "--import",
      `data:text/javascript,${encodeURIComponent(setup)}`,
      path.join(root, "dist/cli.js"),
      "./dist",
    ],
    {
      cwd: fixture,
      encoding: "utf8",
      env: { ...process.env, FORCE_COLOR: "3", NO_COLOR: undefined },
    },
  );
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/demo.svg"), renderTerminal(output));
  console.log("Saved docs/demo.svg from the built CLI's output.");
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}

function createExampleFiles(directory) {
  const files = {
    "assets/vendor-react.js": 172000,
    "assets/editor.js": 88000,
    "assets/app.js": 48000,
    "assets/styles.css": 26000,
    "fonts/inter.woff2": 18000,
    "index.html": 4100,
  };
  for (let i = 0; i < 24; i++) files[`assets/icons/icon-${i}.svg`] = 750;
  for (const [name, size] of Object.entries(files)) {
    const file = path.join(directory, "dist", name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.alloc(size));
  }
}

function renderTerminal(output) {
  const lines = ["$ bunx-ray ./dist", ...output.trimEnd().split("\n")];
  const width = 848;
  const height = 64 + lines.length * 20;
  const rows = lines
    .map((line, index) => renderLine(line, 24, 48 + index * 20))
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">bunx-ray terminal report</title>
  <desc id="desc">Actual CLI output for a sample directory. Numbered regions identify the largest files, and Other groups smaller files.</desc>
  <rect width="100%" height="100%" rx="12" fill="#11151b"/>
  <g font-family="Menlo, DejaVu Sans Mono, monospace" font-size="16" fill="#e6edf3">${rows}</g>
</svg>\n`;
}

function renderLine(line, x, y) {
  let color = "#e6edf3";
  let inverse = false;
  let column = 0;
  const spans = [];
  for (const part of line.split(/(\u001b\[[0-9;]*m)/)) {
    if (part.startsWith("\u001b[")) {
      const codes = part.slice(2, -1).split(";").map(Number);
      if (codes[0] === 38 && codes[1] === 2)
        color = `rgb(${codes.slice(2, 5).join(",")})`;
      if (codes.includes(39) || codes[0] === 0) color = "#e6edf3";
      if (codes[0] === 7) inverse = true;
      if (codes[0] === 27 || codes[0] === 0) inverse = false;
      continue;
    }
    if (!part) continue;
    const length = [...part].length;
    if (inverse)
      spans.push(
        `<rect x="${x + column * 10}" y="${y - 15}" width="${length * 10}" height="20" fill="#e6edf3"/>`,
      );
    spans.push(
      `<text xml:space="preserve" x="${x + column * 10}" y="${y}" fill="${inverse ? "#11151b" : color}" textLength="${length * 10}" lengthAdjust="spacingAndGlyphs">${escapeXml(part)}</text>`,
    );
    column += length;
  }
  return spans.join("");
}

function escapeXml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
