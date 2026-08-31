import { test } from "node:test";
import assert from "node:assert/strict";
import { installDom, emit, makeElement } from "./dom-stub.mjs";

// js/dom.js resolves its elements at module load, so the stub goes in first.
const { byId, doc, setSelection } = installDom();
const { initInput } = await import("../js/input.js");
const { state } = await import("../js/state.js");

const input = byId.get("cmd-input");
const output = byId.get("output");

const ran = [];
state.COMMANDS = ["about", "projects", "resume", "experience"];
state.history = [];
initInput(cmd => ran.push(cmd));

function reset() {
  ran.length = 0;
  state.history.length = 0;
  input.value = "";
  input.selectionStart = 0;
  output.children.length = 0;
  output.innerHTML = "";
  setSelection("");
}

const type = v => { input.value = v; input.selectionStart = v.length; };
const key = (k, extra = {}) => emit(input, "keydown", { key: k, ...extra });

test("Enter runs the command, clears the input, and records history", () => {
  reset();
  type("about");
  key("Enter");
  assert.deepEqual(ran, ["about"]);
  assert.equal(input.value, "");
  assert.deepEqual(state.history, ["about"]);
});

test("a blank line runs but is not recorded", () => {
  reset();
  type("   ");
  key("Enter");
  assert.deepEqual(ran, ["   "], "the command still runs, so the prompt echoes");
  assert.deepEqual(state.history, [], "but whitespace does not enter history");
});

test("ArrowUp and ArrowDown walk the history", () => {
  reset();
  for (const cmd of ["about", "projects", "resume"]) {
    type(cmd);
    key("Enter");
  }
  // history is newest-first
  key("ArrowUp");
  assert.equal(input.value, "resume");
  key("ArrowUp");
  assert.equal(input.value, "projects");
  key("ArrowDown");
  assert.equal(input.value, "resume");
  key("ArrowDown");
  assert.equal(input.value, "", "stepping past the newest clears the line");
  key("ArrowDown");
  assert.equal(input.value, "", "and stays cleared");
});

test("ArrowUp stops at the oldest entry", () => {
  reset();
  type("about");
  key("Enter");
  key("ArrowUp");
  key("ArrowUp");
  assert.equal(input.value, "about");
});

test("Tab completes a unique prefix", () => {
  reset();
  type("abo");
  key("Tab");
  assert.equal(input.value, "about ");
});

test("Tab leaves the line alone when nothing completes", () => {
  reset();
  // completeInput returns null for an unmatched token and for one that is
  // already ambiguous; either way the typed text must survive untouched.
  for (const typed of ["zzz", "theme "]) {
    type(typed);
    key("Tab");
    assert.equal(input.value, typed, `Tab should not rewrite ${JSON.stringify(typed)}`);
  }
});

test("Tab on a complete command adds the trailing space", () => {
  reset();
  type("about");
  key("Tab");
  assert.equal(input.value, "about ");
});

test("Ctrl+L clears the output", () => {
  reset();
  output.innerHTML = "<div>previous output</div>";
  key("l", { ctrlKey: true });
  assert.equal(output.innerHTML, "");
  assert.deepEqual(ran, [], "and runs nothing");
});

test("clicking a command token runs it", () => {
  reset();
  const link = makeElement("span", byId);
  link.className = "cmd-link";
  link.dataset.cmd = "projects";
  output.appendChild(link);

  emit(output, "click", { target: link });
  assert.deepEqual(ran, ["projects"]);
  assert.deepEqual(state.history, ["projects"], "clicked commands land in history too");
});

test("clicking elsewhere in the output runs nothing", () => {
  reset();
  const plain = makeElement("div", byId);
  output.appendChild(plain);
  emit(output, "click", { target: plain });
  assert.deepEqual(ran, []);
});

// The regression this file was written for. Focusing the input collapses a
// document selection, so click-to-focus has to stand down while one exists —
// otherwise dragging across a line of output to copy it clears on mouse-up.
test("click-to-focus does not steal a selection", () => {
  reset();
  setSelection("Site Reliability Engineer with over a decade");
  emit(doc, "click");
  assert.notEqual(doc.activeElement, input, "focus must not move mid-selection");
});

test("click-to-focus works when nothing is selected", () => {
  reset();
  emit(doc, "click");
  assert.equal(doc.activeElement, input);
});
