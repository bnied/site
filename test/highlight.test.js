import { test } from "node:test";
import assert from "node:assert/strict";
import { highlightLiteral } from "../js/highlight.js";

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hl = (text, pattern) => highlightLiteral(text, pattern, esc);
const MARK = '<span class="line-heading">';

test("marks every occurrence, case-insensitively, keeping the original case", () => {
  assert.equal(hl("Kubernetes and kubernetes", "KUBER"),
    `${MARK}Kuber</span>netes and ${MARK}kuber</span>netes`);
});

test("metacharacters are literal, not regex — the old crash", () => {
  // Each of these threw a SyntaxError when the pattern was compiled to a RegExp.
  for (const p of ["(", ")", "*", "+", "?", "[", "a)b"]) {
    assert.doesNotThrow(() => hl("a.b(c)+d[e]", p), `pattern ${p} should not throw`);
  }
  assert.equal(hl("CKA (2020)", "("), `CKA ${MARK}(</span>2020)`);
});

test("a dot matches a dot, not every character", () => {
  assert.equal(hl("a.b", "."), `a${MARK}.</span>b`);
});

test("HTML in the text is escaped, in and out of the match", () => {
  assert.equal(hl("<b> & </b>", "&"), `&lt;b&gt; ${MARK}&amp;</span> &lt;/b&gt;`);
  assert.equal(hl("x<y", "<y"), `x${MARK}&lt;y</span>`);
});

test("no match returns the escaped line, empty pattern marks nothing", () => {
  assert.equal(hl("plain <text>", "zzz"), "plain &lt;text&gt;");
  assert.equal(hl("plain <text>", ""), "plain &lt;text&gt;");
});

test("adjacent and overlapping-looking runs advance past each match", () => {
  assert.equal(hl("aaaa", "aa"), `${MARK}aa</span>${MARK}aa</span>`);
});
