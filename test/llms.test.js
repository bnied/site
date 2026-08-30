import { test } from "node:test";
import assert from "node:assert/strict";
import { llmsText, readSources } from "../tools/gen-llms.mjs";

test("llms.txt is current with the section data", () => {
  const { current, sections, experience } = readSources();
  assert.equal(llmsText(sections, experience), current,
    "llms.txt is stale — run: npm run llms");
});

test("it opens the way llms.txt is meant to", () => {
  const { sections, experience } = readSources();
  const md = llmsText(sections, experience);
  const lines = md.split("\n");
  assert.equal(lines[0], "# Benjamin Nied", "an H1 name comes first");
  assert.ok(lines[2].startsWith("> "), "then a summary blockquote");
});

test("it carries the resume, not links to it", () => {
  const { sections, experience } = readSources();
  const md = llmsText(sections, experience);
  for (const heading of ["## About", "## Skills", "## Experience", "## Projects", "## Education"]) {
    assert.ok(md.includes(heading), `missing ${heading}`);
  }
  // employers, roles and bullets are present in full
  assert.match(md, /### APPLE — 2018 - Present/);
  assert.match(md, /^- Owned the group's Slackbot/m);
  // anchors became markdown links
  assert.match(md, /\[source\.tube\/spaceduck\]\(https:\/\/source\.tube\/spaceduck\)/);
});

test("it drops terminal-only guidance but keeps real content", () => {
  const { sections, experience } = readSources();
  const md = llmsText(sections, experience);
  assert.ok(!md.includes("For details, run"), "prompt guidance should not survive");
  assert.ok(!md.includes("available roles:"), "role keys are navigation, not content");
  // ...while a comment line that is genuinely content stays
  assert.match(md, /Coursework: high-level mathematics/);
});

test("no HTML survives into the markdown", () => {
  const { sections, experience } = readSources();
  const md = llmsText(sections, experience);
  assert.doesNotMatch(md, /<[a-z/][^>]*>/i, "tags should be links or stripped");
  assert.doesNotMatch(md, /&(lt|gt|amp);/, "entities should be decoded");
});

test("the terminal-only list is exact, not a pattern over content", () => {
  const { sections } = readSources();
  // A comment line of all-lowercase words is content, not navigation. The
  // earlier heuristic (/^[a-z-]+(\s+[a-z-]+)*$/) swallowed exactly this shape.
  const probe = {
    ...sections,
    education: [
      { text: "  EDUCATION", cls: "line-heading" },
      { text: "  terraform ansible packer", cls: "line-comment" },
    ],
  };
  assert.match(llmsText(probe, {}), /terraform ansible packer/);
});
