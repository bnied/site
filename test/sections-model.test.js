import { test } from "node:test";
import assert from "node:assert/strict";
import { reflow, entries } from "../js/sections-model.js";

test("reflow folds hard-wrapped prose into one line and marks it flowable", () => {
  const out = reflow([
    { text: "SEP", cls: "line-separator" },
    { text: "  ABOUT", cls: "line-heading" },
    { text: "" },
    { text: "  Site Reliability Engineer with over a decade of" },
    { text: "  professional experience building and operating" },
    { text: "  infrastructure at scale." },
    { text: "" },
    { text: "  Experienced. Independent.", cls: "line-accent" },
  ]);
  const texts = out.map(l => l.text);
  // separators, headings and blanks survive — the block stays renderable
  assert.deepEqual(texts.slice(0, 3), ["SEP", "  ABOUT", ""]);
  assert.equal(texts[3],
    "  Site Reliability Engineer with over a decade of professional experience " +
    "building and operating infrastructure at scale.");
  assert.equal(out[3].flow, true);
  // the parent keeps its indent; only the continuations are trimmed
  assert.ok(out[3].text.startsWith("  S"));
  // and the blank still separates the next paragraph
  assert.deepEqual(texts.slice(4), ["", "  Experienced. Independent."]);
});

test("reflow merges bullet continuations but not consecutive bullets", () => {
  const out = reflow([
    { text: "Wrote a daemon to watch pods,", cls: "line-bullet" },
    { text: "    replacing the broken ones" },
    { text: "Wrote another one", cls: "line-bullet" },
  ]);
  assert.deepEqual(out.map(l => l.text), [
    "Wrote a daemon to watch pods, replacing the broken ones",
    "Wrote another one",
  ]);
  assert.ok(out.every(l => l.cls === "line-bullet" && l.flow));
});

test("reflow leaves aligned rows and links alone", () => {
  const rows = [
    { text: "  APPLE                     2018 - Present", cls: "line-accent" },
    { text: "  SRE // ASE Cassandra      2021 - Present", cls: "line-highlight" },
    { text: '  <a href="https://x.test">x.test</a>', cls: "line-link" },
  ];
  const out = reflow(rows);
  assert.deepEqual(out.map(l => l.text), rows.map(l => l.text));
  // column-aligned rows and links must not hang-indent, which would wrap them
  assert.ok(out.every(l => l.flow === undefined));
});

test("reflow does not run two blank-separated paragraphs together", () => {
  const out = reflow([
    { text: "  first para" },
    { text: "" },
    { text: "  second para" },
  ]);
  assert.deepEqual(out.map(l => l.text), ["  first para", "", "  second para"]);
});

test("entries still flattens a reflowed block to the same result", () => {
  const block = [
    { text: "SEP", cls: "line-separator" },
    { text: "  Prose that was split" },
    { text: "  across two lines" },
  ];
  // reflow is upstream of the PDF/HTML model: flattening either form matches
  assert.deepEqual(entries(reflow(block)), entries(block));
});
