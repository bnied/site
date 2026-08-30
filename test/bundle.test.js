import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

// Walk the *static* import graph. A dynamic import() is deliberately not
// followed — that is the point of this file.
function staticGraph(entry) {
  const seen = new Set();
  const visit = file => {
    const abs = resolve(file);
    if (seen.has(abs) || !existsSync(abs)) return;
    seen.add(abs);
    const src = readFileSync(abs, "utf8");
    for (const m of src.matchAll(/^\s*(?:import|export)[^;]*?from\s+["'](\.[^"']+)["']/gm)) {
      visit(join(dirname(abs), m[1]));
    }
  };
  visit(join(ROOT, entry));
  return new Set([...seen].map(f => relative(ROOT, f)));
}

// The X session is the largest thing in the project and most visitors never run
// it, so commands.js loads it with a dynamic import(). Re-exporting runStartx
// from the easter-eggs barrel, or importing any of these directly, would pull
// the whole subgraph back into the initial load without anyone noticing.
const DEFERRED = [
  "js/easter-eggs/startx.js",
  "js/easter-eggs/netscape-app.js",
  "js/easter-eggs/x11-wm.js",
  "js/easter-eggs/x11-clients.js",
  "js/easter-eggs/x11-xterm.js",
  "js/netscape-html.js",
  "js/xcalc.js",
  "js/xterm-shell.js",
];

test("the X11 and Netscape modules stay out of the initial load", () => {
  const eager = staticGraph("js/main.js");
  for (const mod of DEFERRED) {
    assert.ok(!eager.has(mod), `${mod} is statically reachable from main.js — it should be behind the dynamic import in commands.js`);
  }
});

test("startx is still reachable, just not eagerly", () => {
  const src = readFileSync(join(ROOT, "js/commands.js"), "utf8");
  assert.match(src, /import\(\s*["']\.\/easter-eggs\/startx\.js["']\s*\)/,
    "commands.js should dynamically import startx");
  // and the barrel must not re-export it, which would make it static again
  const barrel = readFileSync(join(ROOT, "js/easter-eggs/index.js"), "utf8");
  assert.doesNotMatch(barrel, /export\s*\{[^}]*runStartx/);
});

test("the entry point still reaches the things it must", () => {
  const eager = staticGraph("js/main.js");
  for (const mod of ["js/commands.js", "js/render.js", "js/boot.js", "js/data.js", "js/input.js"]) {
    assert.ok(eager.has(mod), `${mod} should be in the initial load`);
  }
});
