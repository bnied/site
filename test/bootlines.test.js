import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBootLines, START_HERE } from "../js/bootlines.js";

const bios = [
  { text: "  SPACEDUCK BIOS", cls: "line-system" },
  { type: "countup", label: "  Memory Test : ", target: 65536, unit: "K OK", cls: "line-system", delay: 80 },
];
const asciiName = ["  BEN", "  NIED"];

test("buildBootLines concatenates bios, ascii, profile, and the login fortune", () => {
  const lines = buildBootLines({
    bios, asciiName, role: "Site Reliability Engineer",
    email: "bnied@spaceduck.org", fortune: "It was DNS.",
  });
  const texts = lines.map(l => l.text);
  // bios passed through (incl. the countup marker object)
  assert.ok(lines.some(l => l.type === "countup" && l.target === 65536));
  assert.ok(texts.includes("  SPACEDUCK BIOS"));
  // ascii name rendered as ascii-art
  assert.ok(lines.some(l => l.text === "  BEN" && l.cls === "ascii-art"));
  // profile
  assert.ok(texts.some(t => t.includes("Site Reliability Engineer")));
  assert.ok(texts.some(t => t.includes("bnied@spaceduck.org")));
  // login fortune sits on a line-accent line, between two separators
  const fIdx = lines.findIndex(l => l.text.includes("It was DNS."));
  assert.ok(fIdx > -1 && lines[fIdx].cls.split(" ").includes("line-accent"));
  assert.ok(lines[fIdx - 1].cls.split(" ").includes("line-separator"));
  assert.ok(lines[fIdx + 1].cls.split(" ").includes("line-separator"));
  // and the rules are cut to the fortune's width, overhanging it evenly:
  // the text is indented two columns, the rules start at column zero and run
  // two columns past the end of the text.
  const indent = lines[fIdx].text.length - lines[fIdx].text.trimStart().length;
  for (const rule of [lines[fIdx - 1], lines[fIdx + 1]]) {
    assert.equal(rule.text.length, lines[fIdx].text.length + indent);
  }
  // ends with the landing hint, the help fallback, then a blank
  assert.ok(texts.some(t => t.startsWith("  Start here:")));
  assert.ok(texts.includes("  or type 'help' to see everything."));
  assert.equal(texts[texts.length - 1], "");
});

test("buildBootLines makes every start-here command clickable", () => {
  const lines = buildBootLines({
    bios, asciiName, role: "SRE", email: "x@y.z", fortune: "It was DNS.",
  });
  const hint = lines.find(l => l.text.startsWith("  Start here:"));
  for (const cmd of START_HERE) {
    assert.ok(hint.text.includes(`data-cmd="${cmd}"`), `${cmd} should be clickable`);
  }
  // One link per command — no name matched inside another's injected markup.
  assert.equal(hint.text.match(/cmd-link/g).length, START_HERE.length);
});
