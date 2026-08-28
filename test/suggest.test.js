import { test } from "node:test";
import assert from "node:assert/strict";
import { levenshtein, didYouMean } from "../js/suggest.js";

const CMDS = ["about", "skills", "experience", "projects", "education",
  "contact", "resume", "theme", "crt", "figlet", "lolcat", "help", "clear"];

test("levenshtein counts single edits", () => {
  assert.equal(levenshtein("about", "about"), 0);
  assert.equal(levenshtein("abut", "about"), 1);      // insertion
  assert.equal(levenshtein("aboutt", "about"), 1);    // deletion
  assert.equal(levenshtein("abour", "about"), 1);     // substitution
  assert.equal(levenshtein("", "about"), 5);
  assert.equal(levenshtein("about", ""), 5);
});

test("levenshtein handles transposition as two edits", () => {
  assert.equal(levenshtein("expierence", "experience"), 2);
});

test("didYouMean catches realistic typos", () => {
  assert.equal(didYouMean("expierence", CMDS), "experience");
  assert.equal(didYouMean("prjects", CMDS), "projects");
  assert.equal(didYouMean("abut", CMDS), "about");
  assert.equal(didYouMean("resmue", CMDS), "resume");
});

test("didYouMean is case-insensitive", () => {
  assert.equal(didYouMean("ABUT", CMDS), "about");
});

test("didYouMean stays quiet when nothing is close", () => {
  assert.equal(didYouMean("xyzzy", CMDS), null);
  assert.equal(didYouMean("", CMDS), null);
  assert.equal(didYouMean("supercalifragilistic", CMDS), null);
});

test("didYouMean uses a tighter budget for short tokens", () => {
  // 'crt' -> 'cat' is 1 edit and would be suggested; 'abc' is 2 from both
  // 'crt' and 'cat', which is too loose to be useful at this length.
  assert.equal(didYouMean("abc", CMDS), null);
  assert.equal(didYouMean("crf", CMDS), "crt");
});

test("didYouMean returns null on an exact match", () => {
  assert.equal(didYouMean("about", CMDS), null);
});
