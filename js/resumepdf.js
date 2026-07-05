// resumepdf.js — dependency-free PDF resume generator. Pure: no DOM.
//
// resumeModel() distills the site's section JSON (the same data the terminal
// renders) into a flat list of layout items, re-flowing the terminal's
// hard-wrapped bullet lines back into full sentences. resumePdf() typesets
// those items onto US-Letter pages using the PDF-native Helvetica fonts (no
// font embedding required) and serializes a complete PDF 1.4 file as a
// binary-safe string (every char code <= 0xFF).

// Glyph advance widths (per 1000 units) for chars 32..126, from the Adobe
// AFM metrics. Non-ASCII chars fall back to 556 (the width of most glyphs).
const W_HELV = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333,
  389, 584, 278, 333, 278, 278, 556, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 278, 278, 584, 584,
  584, 556, 1015, 667, 667, 722, 722, 667, 611, 778,
  722, 278, 500, 667, 556, 833, 722, 778, 667, 778,
  722, 667, 611, 722, 667, 944, 667, 667, 611, 278,
  278, 278, 469, 556, 333, 556, 556, 500, 556, 556,
  278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
  500, 334, 260, 334, 584,
];
const W_HELV_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333,
  389, 584, 278, 333, 278, 278, 556, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 333, 333, 584, 584,
  584, 611, 975, 722, 722, 722, 722, 667, 611, 778,
  722, 278, 556, 722, 611, 833, 722, 778, 667, 778,
  722, 667, 611, 722, 667, 944, 667, 667, 611, 333,
  278, 333, 584, 556, 333, 556, 611, 556, 611, 556,
  333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556,
  500, 389, 280, 389, 584,
];

// Unicode -> WinAnsi (CP-1252) code points for characters we actually use.
const WINANSI = {
  0x2022: 149, // bullet
  0x2013: 150, // en dash
  0x2014: 151, // em dash
  0x2018: 145, 0x2019: 146, 0x201c: 147, 0x201d: 148,
};

export function pdfEscape(s) {
  let out = "";
  for (const ch of s) {
    let c = ch.codePointAt(0);
    if (WINANSI[c]) c = WINANSI[c];
    if (ch === "(" || ch === ")" || ch === "\\") out += "\\" + ch;
    else if (c >= 32 && c <= 126) out += String.fromCharCode(c);
    else if (c >= 128 && c <= 255) out += "\\" + c.toString(8).padStart(3, "0");
    else out += "-";
  }
  return out;
}

export function textWidth(s, bold, size) {
  const table = bold ? W_HELV_BOLD : W_HELV;
  let w = 0;
  for (const ch of s) {
    let c = ch.codePointAt(0);
    if (WINANSI[c]) c = WINANSI[c];
    w += c >= 32 && c <= 126 ? table[c - 32] : 556;
  }
  return (w * size) / 1000;
}

// Greedy word wrap by measured width.
export function wrapText(s, bold, size, maxW) {
  const words = s.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? line + " " + word : word;
    if (line && textWidth(candidate, bold, size) > maxW) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ---------------------------------------------------------------------------
// Model: site JSON -> layout items
// ---------------------------------------------------------------------------

function plainText(t) {
  return t
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// Flatten a section block: strip HTML, drop separators/blanks, and merge the
// terminal's hard-wrapped continuation lines back into their parent entry.
function entries(block) {
  const out = [];
  for (const l of block || []) {
    const cls = l.cls || null;
    const raw = plainText(l.text);
    if (!raw.trim() || cls === "line-separator") continue;
    const text = raw.trim().replace(/\s+/g, " ");
    const prev = out[out.length - 1];
    const isContinuation =
      prev &&
      ((!cls && (prev.cls === "line-bullet" || prev.cls === null)) ||
        (cls === "line-comment" && prev.cls === "line-comment"));
    if (isContinuation) {
      prev.text += " " + text;
    } else {
      out.push({ cls, text });
    }
  }
  return out;
}

const DATES_RE = /^(.*?)\s+(\d{4}\s*-\s*(?:Present|\d{4}))$/;

export function resumeModel(sections, experienceDetail, expKeys) {
  const items = [];

  items.push({ t: "name", s: "BENJAMIN NIED" });
  items.push({ t: "title", s: "Site Reliability Engineer" });
  const bits = [];
  for (const e of entries(sections.contact)) {
    const m = e.text.match(/^(email|codeberg|github|linkedin)\s+(.+)$/i);
    if (m) bits.push(m[2]);
  }
  if (bits.length) items.push({ t: "contact", s: bits.join("   ·   ") });

  items.push({ t: "section", s: "SUMMARY" });
  for (const e of entries(sections.about)) {
    if (e.cls === "line-heading") continue;
    items.push({ t: "para", s: e.text });
  }

  items.push({ t: "section", s: "SKILLS" });
  let cat = null;
  let buf = [];
  const flushCat = () => {
    if (cat) items.push({ t: "labeled", label: cat, s: buf.join("; ") });
    cat = null;
    buf = [];
  };
  for (const e of entries(sections.skills)) {
    if (e.cls === "line-heading") continue;
    if (e.cls === "line-highlight") {
      flushCat();
      cat = e.text;
    } else if (e.cls === "line-bullet") {
      buf.push(e.text);
    }
  }
  flushCat();

  items.push({ t: "section", s: "EXPERIENCE" });
  for (const key of expKeys) {
    const es = entries(experienceDetail[key]);
    const head = es.find(e => e.cls === "line-heading");
    const hl = es.find(e => e.cls === "line-highlight");
    let role = hl ? hl.text : "";
    let dates = "";
    const m = role.match(DATES_RE);
    if (m) {
      role = m[1];
      dates = m[2];
    }
    items.push({ t: "sub", left: head ? head.text : key, right: dates });
    if (role) items.push({ t: "subline", s: role });
    for (const e of es) {
      if (e.cls === "line-bullet") items.push({ t: "bullet", s: e.text });
    }
    items.push({ t: "gap", h: 4 });
  }

  items.push({ t: "section", s: "OPEN SOURCE" });
  for (const e of entries(sections.projects)) {
    if (e.cls === "line-heading") {
      if (/contribution/i.test(e.text)) items.push({ t: "subhead", s: "Contributions" });
    } else if (e.cls === "line-accent") {
      items.push({ t: "sub", left: e.text, right: "" });
    } else if (e.cls === "line-link") {
      items.push({ t: "small", s: e.text });
    } else {
      items.push({ t: "para", s: e.text });
    }
  }

  items.push({ t: "section", s: "EDUCATION" });
  for (const e of entries(sections.education)) {
    if (e.cls === "line-heading") continue;
    if (e.cls === "line-accent") {
      const m2 = e.text.match(DATES_RE);
      items.push({ t: "sub", left: m2 ? m2[1] : e.text, right: m2 ? m2[2] : "" });
    } else if (e.cls === "line-comment") {
      items.push({ t: "small", s: e.text });
    } else {
      items.push({ t: "para", s: e.text });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Typesetter + serializer
// ---------------------------------------------------------------------------

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const TOP_Y = PAGE_H - 58;
const BOTTOM_Y = 64;
const CONTENT_W = PAGE_W - 2 * MARGIN;

const INK = "0.13";
const SOFT = "0.42";
const RULE = "0.75";

const fmt = n => String(Math.round(n * 100) / 100);

export function resumePdf(sections, experienceDetail, expKeys, dateStr) {
  const model = resumeModel(sections, experienceDetail, expKeys);

  const pages = [];
  let ops = null;
  let y = 0;

  function newPage() {
    ops = [];
    pages.push(ops);
    y = TOP_Y;
  }
  newPage();

  function ensure(h) {
    if (y - h < BOTTOM_Y) newPage();
  }
  function putText(x, yy, str, { bold = false, size = 9.5, gray = INK } = {}) {
    ops.push(`${gray} g BT /${bold ? "F2" : "F1"} ${size} Tf ${fmt(x)} ${fmt(yy)} Td (${pdfEscape(str)}) Tj ET`);
  }
  function putRule(yy, gray = RULE, w = 0.6) {
    ops.push(`${w} w ${gray} G ${MARGIN} ${fmt(yy)} m ${fmt(PAGE_W - MARGIN)} ${fmt(yy)} l S`);
  }
  function putPara(str, { x = MARGIN, w = CONTENT_W, size = 9.5, leading = 12.4, bold = false, gray = INK } = {}) {
    for (const line of wrapText(str, bold, size, w)) {
      ensure(leading);
      y -= leading;
      putText(x, y, line, { bold, size, gray });
    }
  }

  for (const it of model) {
    switch (it.t) {
      case "name":
        y -= 22;
        putText(MARGIN, y, it.s, { bold: true, size: 19 });
        break;
      case "title":
        y -= 15;
        putText(MARGIN, y, it.s, { size: 10.5, gray: SOFT });
        break;
      case "contact":
        y -= 13;
        putText(MARGIN, y, it.s, { size: 9, gray: SOFT });
        y -= 10;
        putRule(y, "0.55", 0.8);
        break;
      case "section":
        ensure(48);
        y -= 19;
        putText(MARGIN, y, it.s, { bold: true, size: 10.5 });
        y -= 4.5;
        putRule(y);
        y -= 3;
        break;
      case "subhead":
        ensure(30);
        y -= 14;
        putText(MARGIN, y, it.s, { bold: true, size: 9.5, gray: SOFT });
        break;
      case "sub": {
        ensure(36);
        y -= 14;
        putText(MARGIN, y, it.left, { bold: true, size: 10 });
        if (it.right) {
          const rw = textWidth(it.right, false, 9);
          putText(PAGE_W - MARGIN - rw, y, it.right, { size: 9, gray: SOFT });
        }
        break;
      }
      case "subline":
        y -= 11.5;
        putText(MARGIN, y, it.s, { size: 9, gray: SOFT });
        break;
      case "bullet": {
        const lines = wrapText(it.s, false, 9.5, CONTENT_W - 12);
        lines.forEach((line, i) => {
          ensure(12.4);
          y -= 12.4;
          if (i === 0) putText(MARGIN + 1, y, "•", { size: 9.5, gray: SOFT });
          putText(MARGIN + 12, y, line, { size: 9.5 });
        });
        break;
      }
      case "labeled":
        ensure(28);
        y -= 13.5;
        putText(MARGIN, y, it.label, { bold: true, size: 9.5 });
        putPara(it.s, { x: MARGIN + 10, w: CONTENT_W - 10, leading: 12 });
        break;
      case "para":
        putPara(it.s);
        break;
      case "small":
        y -= 11;
        putText(MARGIN, y, it.s, { size: 8, gray: SOFT });
        break;
      case "gap":
        y -= it.h;
        break;
    }
  }

  const total = pages.length;
  pages.forEach((pageOps, i) => {
    const left = `Benjamin Nied — generated from bnied.dev, ${dateStr}`;
    const right = `${i + 1}/${total}`;
    const rw = textWidth(right, false, 7.5);
    pageOps.push(`${SOFT} g BT /F1 7.5 Tf ${MARGIN} 40 Td (${pdfEscape(left)}) Tj ET`);
    pageOps.push(`${SOFT} g BT /F1 7.5 Tf ${fmt(PAGE_W - MARGIN - rw)} 40 Td (${pdfEscape(right)}) Tj ET`);
  });

  return serialize(pages);
}

function serialize(pages) {
  const objs = [];
  const kidIds = pages.map((_, i) => 5 + i * 2);
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  objs.push(`<< /Type /Pages /Kids [${kidIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  pages.forEach((pageOps, i) => {
    const stream = pageOps.join("\n");
    objs.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`
    );
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  let out = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((body, idx) => {
    offsets.push(out.length);
    out += `${idx + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefPos = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return out;
}
