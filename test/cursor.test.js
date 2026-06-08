import { test } from "node:test";
import assert from "node:assert/strict";
import { cursorSizerText } from "../js/cursor.js";

test("cursorSizerText mirrors the text up to the caret, not the whole value", () => {
  assert.equal(cursorSizerText("hello", 5), "hello");  // caret at end
  assert.equal(cursorSizerText("hello", 2), "he");     // caret mid-text → cursor follows
  assert.equal(cursorSizerText("hello", 0), "");       // caret at start
});

test("cursorSizerText falls back to the full value when caret is unknown", () => {
  assert.equal(cursorSizerText("hello", null), "hello");
  assert.equal(cursorSizerText("hello", undefined), "hello");
});
