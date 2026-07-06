import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { xtermRespond } from "../js/xterm-shell.js";

const font = JSON.parse(
  readFileSync(new URL("../data/figlet-font.json", import.meta.url))
);
const ctx = {
  font,
  fortunes: ["only one fortune"],
  sections: {
    about: [{ text: "I am Ben" }, { text: '<a href="https://example.org">a link</a>' }],
  },
  helpText: [{ text: "  COMMANDS", cls: "line-heading" }, { text: "  help &lt;3" }],
  experienceDetail: {
    apple: [{ text: "  Apple" }, { text: "  SRE things", cls: "line-bullet" }],
  },
  expKeys: ["apple"],
  now: new Date("2026-06-02T15:30:00Z"),
  pageLoadTime: new Date("2026-06-02T15:30:00Z").getTime() - 60000,
};

test("startx under X fails: server already active", () => {
  for (const cmd of ["startx", "xinit", "X"]) {
    const r = xtermRespond(cmd, ctx);
    assert.equal(r.lines[0], "Fatal server error:");
    assert.ok(r.lines.includes("Server is already active for display 0"));
    assert.equal(r.lines.at(-1), "xinit: server error");
    assert.equal(r.action, undefined);
  }
});

test("twm refuses: another window manager is running", () => {
  const r = xtermRespond("twm", ctx);
  assert.match(r.lines[0], /another window manager is already running/);
});

test("exit and logout close the window", () => {
  assert.equal(xtermRespond("exit", ctx).action, "exit");
  assert.equal(xtermRespond("logout", ctx).action, "exit");
});

test("clear clears, xterm spawns another xterm", () => {
  assert.equal(xtermRespond("clear", ctx).action, "clear");
  assert.equal(xtermRespond("xterm", ctx).action, "spawn");
});

test("X clients open (or raise) their windows", () => {
  assert.equal(xtermRespond("xeyes", ctx).action, "open:xeyes");
  assert.equal(xtermRespond("xclock", ctx).action, "open:xclock");
  const ns = xtermRespond("netscape", ctx);
  assert.equal(ns.action, "open:netscape");
  assert.match(ns.lines[0], /lock/);
});

test("console-only programs refuse to run under X", () => {
  for (const cmd of ["doom", "btop", "cmatrix", "shutdown"]) {
    const r = xtermRespond(cmd, ctx);
    assert.match(r.lines[0], /cannot open console device/);
    assert.equal(r.action, undefined);
  }
});

test("site commands run through the pipe engine", () => {
  assert.deepEqual(xtermRespond("echo hi there", ctx).lines, ["hi there"]);
  assert.deepEqual(xtermRespond("fortune", ctx).lines, ["only one fortune"]);
  const piped = xtermRespond("echo moo | cowsay", ctx);
  assert.equal(piped.lines[1], "  < moo >");
});

test("unknown commands come back shell-style", () => {
  const r = xtermRespond("frobnicate", ctx);
  assert.deepEqual(r.lines, ["frobnicate: command not found"]);
});

test("help and sections render as plain text, tags stripped", () => {
  const help = xtermRespond("help", ctx);
  assert.deepEqual(help.lines, ["  COMMANDS", "  help <3"]);
  const about = xtermRespond("about", ctx);
  assert.deepEqual(about.lines, ["I am Ben", "a link"]);
});

test("experience subcommand resolves roles and rejects unknowns", () => {
  assert.equal(xtermRespond("experience apple", ctx).lines[0], "  Apple");
  const bad = xtermRespond("experience nokia", ctx);
  assert.match(bad.lines[0], /unknown role/);
  assert.match(bad.lines[1], /apple/);
});

test("the fork bomb is caught before the pipe engine", () => {
  const r = xtermRespond(":(){ :|:& };:", ctx);
  assert.match(r.lines[0], /fork/);
  assert.equal(r.action, undefined);
});

test("empty input prints nothing", () => {
  assert.deepEqual(xtermRespond("   ", ctx), { lines: [] });
});
