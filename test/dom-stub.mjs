// A stub, not a DOM: just enough of Element/Document/window for the modules
// under test, which set className/innerHTML, call setAttribute, append, query,
// and listen for events. Shared by render, commands and input tests.
//
// The alternative is a jsdom devDependency; the repo installs nothing at all
// today, and that is worth keeping for a site with no build step.

// Ids the real index.html defines. getElementById returns null for anything
// else unless it has actually been inserted — input.js looks up #tab-ghost to
// decide whether a ghost exists, so inventing one would defeat the test.
const PAGE_IDS = [
  "output", "cmd-input", "terminal", "input-sizer", "cursor", "noise", "input-line",
];

export function makeElement(tag = "div", registry = null) {
  let id = "";
  const el = {
    tagName: tag.toUpperCase(),
    className: "",
    innerHTML: "",
    value: "",
    selectionStart: 0,
    children: [],
    attributes: {},
    style: {},
    dataset: {},
    scrollTop: 0,
    scrollHeight: 0,
    offsetWidth: 0,
    parentElement: null,
    listeners: {},

    get id() { return id; },
    set id(v) {
      id = String(v);
      // Registering on assignment is what makes getElementById("tab-ghost")
      // find the ghost input.js just created.
      if (registry) registry.set(id, el);
    },

    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; },

    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    insertAdjacentElement(position, child) {
      const parent = position === "afterend" || position === "beforebegin"
        ? this.parentElement : this;
      if (!parent) return null;
      const at = parent.children.indexOf(this);
      const offset = position === "afterend" ? 1 : 0;
      parent.children.splice(at === -1 ? parent.children.length : at + offset, 0, child);
      child.parentElement = parent;
      return child;
    },
    remove() {
      if (this.parentElement) {
        const at = this.parentElement.children.indexOf(this);
        if (at !== -1) this.parentElement.children.splice(at, 1);
        this.parentElement = null;
      }
      if (registry && id && registry.get(id) === el) registry.delete(id);
    },

    classList: {
      add(c) { if (!el.className.split(" ").includes(c)) el.className = (el.className + " " + c).trim(); },
      remove(c) { el.className = el.className.split(" ").filter(x => x && x !== c).join(" "); },
      contains(c) { return el.className.split(" ").includes(c); },
      toggle(c, force) { (force ?? !this.contains(c)) ? this.add(c) : this.remove(c); },
    },

    querySelector() { return makeElement(tag, registry); },
    querySelectorAll() { return []; },
    // Only ever asked for a class, which is all the code under test uses.
    closest(sel) {
      const want = sel.replace(/^\./, "");
      let node = this;
      while (node) {
        if (node.className.split(" ").includes(want)) return node;
        node = node.parentElement;
      }
      return null;
    },

    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    focus() { if (registry) registry.activeElement = el; },

    set textContent(v) {
      // Browsers escape exactly these three when serializing a text node.
      this.innerHTML = String(v)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
    get textContent() { return this.innerHTML; },
  };
  return el;
}

/** Fire a listener registered on `target` (or on document/window). */
export function emit(target, type, event = {}) {
  const fns = (target.listeners || {})[type] || [];
  for (const fn of fns) fn({ preventDefault() {}, stopPropagation() {}, ...event });
}

/**
 * Install the stub globals. Must run before importing anything that reaches
 * js/dom.js, which resolves its element references at module load — so callers
 * import the module under test dynamically, after calling this.
 *
 * @returns {{ byId: Map, doc: object, setSelection: (s: string) => void }}
 */
export function installDom() {
  const byId = new Map();
  const body = makeElement("body", byId);
  for (const id of PAGE_IDS) {
    const el = makeElement("div", byId);
    el.id = id;
    body.appendChild(el);
  }

  let selection = "";

  const doc = {
    documentElement: makeElement("html", byId),
    body,
    listeners: {},
    getElementById: id => byId.get(id) || null,
    createElement: tag => makeElement(tag, byId),
    querySelector: () => makeElement("div", byId),
    querySelectorAll: () => [],
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    get activeElement() { return byId.activeElement || null; },
  };
  globalThis.document = doc;
  globalThis.window = {
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    getSelection: () => selection,
    addEventListener() {},
    dispatchEvent() {},
  };
  globalThis.getSelection = () => selection;
  globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  // Node defines navigator itself, and only as a getter.
  if (!globalThis.navigator?.language) {
    Object.defineProperty(globalThis, "navigator", {
      value: { language: "en-US" }, configurable: true,
    });
  }
  return { byId, doc, setSelection: s => { selection = s; } };
}
