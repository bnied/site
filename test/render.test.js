import { test } from "node:test";
import assert from "node:assert/strict";

// js/dom.js resolves its element references at module load, so the document has
// to exist before js/render.js is imported — hence the dynamic import below.
//
// This is a stub, not a DOM: just enough of Element and Document for the render
// layer, which only ever sets className/innerHTML, calls setAttribute, and
// appends. Kept inline and minimal on purpose — the alternative is a jsdom
// devDependency, and the repo currently installs nothing at all.
function makeElement(tag = "div") {
  return {
    tagName: tag.toUpperCase(),
    className: "",
    innerHTML: "",
    children: [],
    attributes: {},
    scrollTop: 0,
    scrollHeight: 0,
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; },
    appendChild(child) { this.children.push(child); return child; },
    set textContent(v) {
      // Browsers escape exactly these three when serializing a text node.
      this.innerHTML = String(v)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
  };
}

const elements = new Map();
globalThis.document = {
  getElementById: id => {
    if (!elements.has(id)) elements.set(id, makeElement());
    return elements.get(id);
  },
  createElement: tag => makeElement(tag),
};

const { addLine, addLines, addSection, renderCls, escapeHTML } = await import("../js/render.js");
const output = document.getElementById("output");

const reset = () => { output.children.length = 0; };
const classes = el => el.className.split(" ").filter(Boolean);

test("addLine builds a line div with its classes and content", () => {
  reset();
  addLine("hello", "line-ok", true);
  const [div] = output.children;
  assert.deepEqual(classes(div), ["line", "line-ok", "line-enter"]);
  assert.equal(div.innerHTML, "hello");

  addLine("plain", null, false);
  assert.deepEqual(classes(output.children[1]), ["line"]);
});

test("decorative lines are hidden from the live region", () => {
  reset();
  addLine("  BEN", "ascii-art", false);
  addLine("═══", "line-separator", false);
  addLine("  real content", "line-accent", false);
  const [art, rule, content] = output.children;
  // #output is aria-live, so art and rules must not be read out
  assert.equal(art.getAttribute("aria-hidden"), "true");
  assert.equal(rule.getAttribute("aria-hidden"), "true");
  assert.equal(content.getAttribute("aria-hidden"), null);
});

test("aria-hidden matches on whole class names, not substrings", () => {
  reset();
  // a class that merely contains a decorative name must not be hidden
  addLine("x", "line-separator-ish", false);
  assert.equal(output.children[0].getAttribute("aria-hidden"), null);
});

test("renderCls tags the thin rule and leaves the heavy one alone", () => {
  assert.equal(renderCls({ text: "───", cls: "line-separator" }),
    "line-separator line-rule-thin");
  assert.equal(renderCls({ text: "═══", cls: "line-separator" }), "line-separator");
  assert.equal(renderCls({ text: "hi", cls: "line-ok" }), "line-ok");
  // a separator line with no text must not throw
  assert.doesNotThrow(() => renderCls({ cls: "line-separator" }));
});

test("addSection reflows hard-wrapped prose and marks it flowable", () => {
  reset();
  addSection([
    { text: "SEP", cls: "line-separator" },
    { text: "  ABOUT", cls: "line-heading" },
    { text: "" },
    { text: "  wrapped across" },
    { text: "  two lines" },
  ]);
  const texts = output.children.map(c => c.innerHTML);
  assert.deepEqual(texts, ["SEP", "  ABOUT", "", "  wrapped across two lines"]);
  const prose = output.children[3];
  assert.ok(classes(prose).includes("line-flow"));
  // the heading and the rule keep their own classes, unflowed
  assert.deepEqual(classes(output.children[1]), ["line", "line-heading", "line-enter"]);
  assert.ok(!classes(output.children[0]).includes("line-flow"));
});

test("addSection keeps a bullet's own class alongside line-flow", () => {
  reset();
  addSection([{ text: "did a thing,", cls: "line-bullet" }, { text: "   and another" }]);
  const [bullet] = output.children;
  assert.equal(bullet.innerHTML, "did a thing, and another");
  assert.ok(classes(bullet).includes("line-bullet"));
  assert.ok(classes(bullet).includes("line-flow"));
});

test("addLines linkifies a line carrying a cmd", () => {
  reset();
  addLines([{ text: "  about", cmd: "about" }]);
  assert.match(output.children[0].innerHTML, /data-cmd="about"/);
});

test("escapeHTML escapes markup", () => {
  assert.equal(escapeHTML('<script>&"'), "&lt;script&gt;&amp;\"");
});
