// A stub, not a DOM: just enough of Element/Document/window for the modules
// under test, which only set className/innerHTML, call setAttribute, append,
// and query. Shared by render.test.js and commands.test.js.
//
// The alternative is a jsdom devDependency; the repo installs nothing at all
// today, and that is worth keeping for a site with no build step.

export function makeElement(tag = "div") {
  return {
    tagName: tag.toUpperCase(),
    className: "",
    innerHTML: "",
    children: [],
    attributes: {},
    style: {},
    dataset: {},
    scrollTop: 0,
    scrollHeight: 0,
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; },
    appendChild(child) { this.children.push(child); return child; },
    querySelector() { return makeElement(); },
    querySelectorAll() { return []; },
    addEventListener() {},
    focus() {},
    set textContent(v) {
      // Browsers escape exactly these three when serializing a text node.
      this.innerHTML = String(v)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
  };
}

/**
 * Install the stub globals. Must run before importing anything that reaches
 * js/dom.js, which resolves its element references at module load — so callers
 * import the module under test dynamically, after calling this.
 *
 * @returns {{ byId: Map<string, object> }} the element registry, so a test can
 *   reach the same #output / #terminal the module got.
 */
export function installDom() {
  const byId = new Map();
  globalThis.document = {
    documentElement: makeElement("html"),
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, makeElement());
      return byId.get(id);
    },
    createElement: tag => makeElement(tag),
    querySelector: () => makeElement(),
    querySelectorAll: () => [],
    addEventListener() {},
  };
  globalThis.window = {
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener() {},
    dispatchEvent() {},
  };
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  // Node defines navigator itself, and only as a getter.
  if (!globalThis.navigator?.language) {
    Object.defineProperty(globalThis, "navigator", {
      value: { language: "en-US" }, configurable: true,
    });
  }
  return { byId };
}
