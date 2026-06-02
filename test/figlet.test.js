import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { figletText } from "../js/figlet.js";

const font = JSON.parse(
  readFileSync(new URL("../data/figlet-font.json", import.meta.url))
);

test("figletText returns font.height rows", () => {
  assert.equal(figletText("hi", font).length, font.height);
});

test("figletText folds input to uppercase", () => {
  assert.deepEqual(figletText("h", font), figletText("H", font));
});

test("figletText joins glyphs with a one-space gutter", () => {
  assert.equal(figletText("H", font)[0], font.glyphs.H[0]);
  assert.equal(figletText("HI", font)[0], font.glyphs.H[0] + " " + font.glyphs.I[0]);
});

test("figletText uses the fallback glyph for unknown characters", () => {
  const lines = figletText("~", font);
  assert.equal(lines.length, font.height);
  assert.equal(lines[0], font.fallback[0]);
});

test("figletText returns an empty array for empty input", () => {
  assert.deepEqual(figletText("", font), []);
});
