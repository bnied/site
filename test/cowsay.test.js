import { test } from "node:test";
import assert from "node:assert/strict";
import { cowsayText } from "../js/cowsay.js";

test("cowsayText wraps a message in a speech bubble", () => {
  const lines = cowsayText("hi");
  assert.equal(lines.length, 8);
  assert.equal(lines[0], "   ____");
  assert.equal(lines[1], "  < hi >");
  assert.equal(lines[2], "   ----");
  assert.ok(lines[4].includes("(oo)"));
});

test("cowsayText defaults to moo when empty", () => {
  assert.equal(cowsayText("")[1], "  < moo >");
  assert.equal(cowsayText()[1], "  < moo >");
});
