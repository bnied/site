import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeAttr, linkifyCommand } from "../js/cmdlink.js";

test("escapeAttr neutralizes attribute-breaking characters", () => {
  assert.equal(escapeAttr('a"b'), "a&quot;b");
  assert.equal(escapeAttr("<&>"), "&lt;&amp;&gt;");
});

test("linkifyCommand wraps the first occurrence and keeps the rest intact", () => {
  const out = linkifyCommand("  about         who I am", "about");
  assert.equal(
    out,
    '  <span class="cmd-link" data-cmd="about" title="run: about">about</span>         who I am'
  );
});

test("linkifyCommand preserves surrounding entities in trusted line HTML", () => {
  const out = linkifyCommand("  figlet &lt;text&gt; big ascii banner", "figlet");
  assert.ok(out.includes("&lt;text&gt;"));
  assert.ok(out.includes('data-cmd="figlet"'));
});

test("linkifyCommand only touches the first occurrence", () => {
  const out = linkifyCommand("theme and theme", "theme");
  assert.equal(out.match(/cmd-link/g).length, 1);
  assert.ok(out.endsWith("and theme"));
});

test("linkifyCommand passes text through when there is nothing to link", () => {
  assert.equal(linkifyCommand("  no command here", "about"), "  no command here");
  assert.equal(linkifyCommand("  about", ""), "  about");
  assert.equal(linkifyCommand("  about", undefined), "  about");
});

test("linkifyCommand can run something other than the visible word", () => {
  const out = linkifyCommand("green", "green", "theme green");
  assert.ok(out.includes('data-cmd="theme green"'));
  assert.ok(out.includes('title="run: theme green"'));
  assert.ok(out.includes(">green</span>"));
});

test("linkifyCommand escapes the data-cmd value", () => {
  const out = linkifyCommand('run "x"', '"x"');
  assert.ok(out.includes('data-cmd="&quot;x&quot;"'));
});
