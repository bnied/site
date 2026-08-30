import { test } from "node:test";
import assert from "node:assert/strict";
import { installDom } from "./dom-stub.mjs";

// js/dom.js resolves its elements at module load, so the stub goes in first and
// commands.js is imported dynamically after it.
const { byId } = installDom();
const { runCommand } = await import("../js/commands.js");
const { state } = await import("../js/state.js");

const output = byId.get("output");
const terminal = byId.get("terminal");

// The catch logs the stack for whoever is looking; keep it out of test output.
function quietly(fn) {
  const real = console.error;
  const calls = [];
  console.error = (...args) => calls.push(args);
  try { return fn(), calls; } finally { console.error = real; }
}

const reset = () => {
  output.children.length = 0;
  terminal.scrollTop = 0;
  terminal.scrollHeight = 0;
};
const lines = () => output.children.map(c => ({ cls: c.className, html: c.innerHTML }));

// state.sections is null until loadData() runs, so any section command throws —
// the same shape of failure as the grep crash, without depending on that bug.
test("a command that throws reports the error instead of dying silently", () => {
  reset();
  state.sections = null;
  const logged = quietly(() => {
    assert.doesNotThrow(() => runCommand("about"), "runCommand must absorb the failure");
  });

  const err = lines().find(l => l.html.includes("internal error"));
  assert.ok(err, "an internal error line should be rendered");
  assert.ok(err.cls.split(" ").includes("line-error"), "it should use the error style");
  // and the real cause reaches the console for debugging
  assert.equal(logged.length, 1);
  assert.match(String(logged[0][0]), /command failed/);
});

test("the view still scrolls to the prompt after a failure", () => {
  // This was the visible symptom: scrollToBottom() is the dispatcher's last
  // statement, so a throw skipped it and the output just stopped mid-screen.
  reset();
  state.sections = null;
  terminal.scrollHeight = 4242;
  quietly(() => runCommand("about"));
  assert.equal(terminal.scrollTop, 4242);
});

test("the error message is escaped, not injected as markup", () => {
  reset();
  // A getter that throws with markup in its message — the message reaches the
  // page, so it has to be escaped like any other untrusted text.
  state.sections = { get about() { throw new Error('<img src=x onerror=alert(1)>'); } };
  quietly(() => runCommand("about"));

  const err = lines().find(l => l.html.includes("internal error"));
  assert.ok(err.html.includes("&lt;img src=x"), "markup should be escaped");
  assert.ok(!err.html.includes("<img"), "raw tag must not reach the DOM");
});

test("the shell stays usable after a command fails", () => {
  reset();
  state.sections = null;
  quietly(() => runCommand("about"));
  const afterFailure = output.children.length;

  // an empty command still echoes its prompt line and nothing else
  assert.doesNotThrow(() => runCommand(""));
  assert.equal(output.children.length, afterFailure + 1);
  assert.ok(lines().at(-1).cls.includes("line-prompt"));
});

test("a working command is untouched by the wrapper", () => {
  reset();
  state.sections = { about: [{ text: "  hello", cls: "line-ok" }] };
  quietly(() => runCommand("about"));
  const html = lines().map(l => l.html);
  assert.ok(html.includes("  hello"), "section content should render");
  assert.ok(!html.some(h => h.includes("internal error")), "no error line on success");
});

test("lolcat carries hues as data, not as inline style attributes", () => {
  reset();
  state.sections = {};
  quietly(() => runCommand("lolcat hi"));
  const painted = lines().find(l => l.html.includes("data-hue"));
  assert.ok(painted, "characters should be wrapped with a hue");
  // A style attribute in markup is inline CSS to CSP; the colour is applied
  // through the CSSOM instead, which style-src does not restrict.
  assert.ok(!painted.html.includes("style="), "no inline style attribute");
});
