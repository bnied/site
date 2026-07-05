import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pdfEscape, textWidth, wrapText, resumeModel, resumePdf } from "../js/resumepdf.js";

const sections = JSON.parse(readFileSync(new URL("../data/sections.json", import.meta.url)));
const expData = JSON.parse(readFileSync(new URL("../data/experience.json", import.meta.url)));
const expKeys = Object.keys(expData);

test("pdfEscape handles delimiters, WinAnsi specials, and exotic chars", () => {
  assert.equal(pdfEscape("a(b)c\\d"), "a\\(b\\)c\\\\d");
  assert.equal(pdfEscape("•"), "\\225");
  assert.equal(pdfEscape("—"), "\\227");
  assert.equal(pdfEscape("中"), "-");
  // output is pure ASCII
  assert.ok([...pdfEscape("héllo — •")].every(c => c.charCodeAt(0) < 128));
});

test("wrapText fits measured widths and loses no words", () => {
  const text = "the quick brown fox jumps over the lazy dog again and again";
  const lines = wrapText(text, false, 10, 100);
  assert.ok(lines.length > 1);
  assert.ok(lines.every(l => textWidth(l, false, 10) <= 100));
  assert.equal(lines.join(" "), text);
});

test("resumeModel distills site data with re-flowed bullets", () => {
  const model = resumeModel(sections, expData, expKeys);
  assert.equal(model[0].t, "name");
  const sectionTitles = model.filter(i => i.t === "section").map(i => i.s);
  assert.deepEqual(sectionTitles, ["SUMMARY", "SKILLS", "EXPERIENCE", "OPEN SOURCE", "EDUCATION"]);
  // dates split out of the role line, right-aligned
  const cassandra = model.find(i => i.t === "sub" && /Cassandra/.test(i.left));
  assert.equal(cassandra.right, "2021 - Present");
  // hard-wrapped terminal bullets are re-flowed into single strings
  const daemon = model.find(i => i.t === "bullet" && i.s.startsWith("Wrote daemon to monitor Cassandra"));
  assert.ok(daemon.s.endsWith("past pre-configured durations"));
  // no HTML, no leftover entities anywhere
  for (const item of model) {
    const s = (item.s || "") + (item.left || "") + (item.label || "");
    assert.ok(!/<|&lt;|&amp;/.test(s), `clean text: ${s}`);
  }
});

test("resumePdf emits a structurally valid, binary-safe PDF", () => {
  const pdf = resumePdf(sections, expData, expKeys, "2026-07-04");
  assert.ok(pdf.startsWith("%PDF-1.4\n"));
  assert.ok(pdf.endsWith("%%EOF\n"));
  assert.ok([...pdf].every(c => c.charCodeAt(0) <= 0xff), "single-byte chars only");
  assert.ok(pdf.includes("(BENJAMIN NIED)"));
  // page count in /Pages matches the number of page objects
  const count = Number(pdf.match(/\/Count (\d+)/)[1]);
  const pageObjs = pdf.match(/\/Type \/Page[^s]/g).length;
  assert.equal(count, pageObjs);
  assert.ok(count >= 2, "a full resume should span multiple pages");
  // xref offsets point at the objects they claim to
  const xrefPos = Number(pdf.match(/startxref\n(\d+)/)[1]);
  assert.ok(pdf.slice(xrefPos).startsWith("xref"));
  const offsets = [...pdf.matchAll(/^(\d{10}) 00000 n /gm)].map(m => Number(m[1]));
  offsets.forEach((off, i) => {
    assert.ok(pdf.slice(off).startsWith(`${i + 1} 0 obj`), `offset ${i + 1} valid`);
  });
});
