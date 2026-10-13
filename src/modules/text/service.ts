const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function textWidth(text: string): number {
  return segments(text).reduce(
    (width, part) => width + characterWidth(part),
    0,
  );
}

export function fitText(text: string, width: number): string {
  if (width <= 0) return "";
  if (textWidth(text) <= width) return text;
  return takeWidth(text, width - 1) + "…";
}

export function fitPath(filePath: string, width: number): string {
  const clean = filePath.replace(/[\x00-\x1f\x7f-\x9f]/g, "?");
  if (textWidth(clean) <= width) return clean;
  if (width < 5) return fitText(clean, width);
  const parts = clean.split(/[\\/]/);
  const basename = parts.at(-1)!;
  if (parts.length > 1 && textWidth(basename) + 2 <= width) {
    return takeWidth(clean, width - textWidth(basename) - 2) + "…/" + basename;
  }
  const startWidth = Math.ceil((width - 1) / 2);
  return (
    takeWidth(clean, startWidth) +
    "…" +
    takeWidth(clean, width - startWidth - 1, true)
  );
}

export function padText(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - textWidth(text)));
}

function takeWidth(text: string, width: number, fromEnd = false): string {
  const parts = segments(text);
  if (fromEnd) parts.reverse();
  let result = "";
  let used = 0;
  for (const part of parts) {
    const size = characterWidth(part);
    if (used + size > width) break;
    result = fromEnd ? part + result : result + part;
    used += size;
  }
  return result;
}

function segments(text: string): string[] {
  return Array.from(graphemes.segment(text), ({ segment }) => segment);
}

function characterWidth(character: string): number {
  if (/^[\p{Mark}\p{Control}\p{Format}]+$/u.test(character)) return 0;
  if (
    /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(character)
  )
    return 2;
  const code = character.codePointAt(0)!;
  if (
    code >= 0x1100 &&
    (code <= 0x115f ||
      code === 0x2329 ||
      code === 0x232a ||
      (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe19) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff01 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x20000 && code <= 0x3fffd))
  )
    return 2;
  return 1;
}
