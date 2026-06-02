// Pure block-ASCII text renderer. No DOM/fetch — the font data is injected
// (browser passes state.DATA.figletFont; tests pass the parsed JSON). Folds
// input to uppercase, looks up each character's glyph (fallback for unknown
// chars), and concatenates row-by-row with a one-space gutter between glyphs.

export function figletText(text, font) {
  const chars = String(text).toUpperCase().split("");
  if (chars.length === 0) return [];
  const glyphs = chars.map(ch => font.glyphs[ch] || font.fallback);
  const rows = [];
  for (let r = 0; r < font.height; r++) {
    rows.push(glyphs.map(g => g[r]).join(" "));
  }
  return rows;
}
