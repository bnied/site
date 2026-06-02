import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hasPipe, runPipeline } from "../js/pipeline.js";

const font = JSON.parse(
  readFileSync(new URL("../data/figlet-font.json", import.meta.url))
);
const ctx = {
  font,
  fortunes: ["only one fortune"],
  sections: { about: [{ text: "I am Ben" }, { text: "Engineer" }] },
};

const richCtx = {
  ...ctx,
  now: new Date("2026-06-02T15:30:00Z"),
  pageLoadTime: new Date("2026-06-02T15:30:00Z").getTime() - 60000,
  theme: "green",
  locale: "en-US",
  neofetchAscii: ["DUCK", "QUACK"],
  neofetchInfo: [{ label: "OS", value: "bnied.dev" }],
};

test("hasPipe detects the pipe character", () => {
  assert.equal(hasPipe("fortune | cowsay"), true);
  assert.equal(hasPipe("fortune"), false);
});

test("echo | cowsay pipes text into the bubble", () => {
  const r = runPipeline("echo hi | cowsay", ctx);
  assert.equal(r.colorize, false);
  assert.equal(r.lines[1], "  < hi >");
});

test("fortune as a source emits a fortune", () => {
  const r = runPipeline("fortune", ctx);
  assert.deepEqual(r.lines, ["only one fortune"]);
});

test("cat reads a section as plain text", () => {
  const r = runPipeline("cat about", ctx);
  assert.deepEqual(r.lines, ["I am Ben", "Engineer"]);
});

test("lolcat sets colorize and passes text through unchanged", () => {
  const r = runPipeline("echo hello | lolcat", ctx);
  assert.equal(r.colorize, true);
  assert.deepEqual(r.lines, ["hello"]);
});

test("figlet | lolcat colorizes the banner", () => {
  const r = runPipeline("figlet hi | lolcat", ctx);
  assert.equal(r.colorize, true);
  assert.equal(r.lines.length, font.height);
});

test("unknown command in a pipe returns command-not-found", () => {
  const r = runPipeline("echo hi | bogus", ctx);
  assert.equal(r.error, "bogus: command not found");
});

test("an empty stage returns a syntax error", () => {
  const r = runPipeline("echo hi |", ctx);
  assert.ok(r.error.includes("syntax error"));
});

test("figlet args override piped input", () => {
  // 'yo' should win over the piped 'hi', producing the figlet of YO
  const r = runPipeline("echo hi | figlet yo", ctx);
  assert.deepEqual(r.lines, runPipeline("figlet yo", ctx).lines);
});

test("echo as a filter passes input through and ignores its own args", () => {
  // echo ignores stdin in real shells; here as a filter it returns input unchanged
  const r = runPipeline("echo hi | echo bye", ctx);
  assert.deepEqual(r.lines, ["hi"]);
});

test("neofetch is pipeable into lolcat", () => {
  const r = runPipeline("neofetch | lolcat", richCtx);
  assert.equal(r.colorize, true);
  assert.ok(r.lines.join("\n").includes("DUCK"));
  assert.ok(r.lines.join("\n").includes("OS: bnied.dev"));
});

test("ls is pipeable as a source", () => {
  const r = runPipeline("ls | lolcat", richCtx);
  assert.equal(r.colorize, true);
  assert.ok(r.lines.length > 0);
});

test("system commands are pipeable sources that ignore stdin", () => {
  assert.deepEqual(runPipeline("whoami", richCtx).lines, ["visitor"]);
  assert.equal(runPipeline("pwd", richCtx).lines[0], "/home/visitor");
  assert.equal(runPipeline("hostname", richCtx).lines[0], "bnied.dev");
  assert.ok(runPipeline("uname -a", richCtx).lines[0].includes("JavaScript/ES2024 browser"));
  assert.ok(runPipeline("uname -s", richCtx).lines[0] === "bnied.dev");
  // ignores stdin in filter position:
  assert.equal(runPipeline("echo x | whoami", richCtx).lines[0], "visitor");
});
