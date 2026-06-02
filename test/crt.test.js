import { test } from "node:test";
import assert from "node:assert/strict";
import { crtLevelFromArg, CRT_LEVELS } from "../js/crt.js";

test("CRT_LEVELS are off/on/max in order", () => {
  assert.deepEqual(CRT_LEVELS, ["off", "on", "max"]);
});

test("crtLevelFromArg normalizes valid levels (case/space-insensitive)", () => {
  assert.equal(crtLevelFromArg("off"), "off");
  assert.equal(crtLevelFromArg("ON"), "on");
  assert.equal(crtLevelFromArg("  Max "), "max");
});

test("crtLevelFromArg returns null for unknown or empty input", () => {
  assert.equal(crtLevelFromArg("ultra"), null);
  assert.equal(crtLevelFromArg(""), null);
  assert.equal(crtLevelFromArg("  "), null);
});
