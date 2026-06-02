import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBootLines } from "../js/bootlines.js";

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
  assert.ok(fIdx > -1 && lines[fIdx].cls === "line-accent");
  assert.equal(lines[fIdx - 1].cls, "line-separator");
  assert.equal(lines[fIdx + 1].cls, "line-separator");
  // ends with the help line then a blank
  assert.ok(texts.includes("  Type 'help' for available commands."));
});
