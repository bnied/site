import { test } from "node:test";
import assert from "node:assert/strict";
import { llmsFiles, llmsIndex, sectionMd, readSources } from "../tools/gen-llms.mjs";

const { sections, experience, read } = readSources();
const files = llmsFiles(sections, experience);

test("every generated file is current with the section data", () => {
  for (const [path, body] of files) {
    assert.equal(read(path), body, `${path} is stale — run: npm run llms`);
  }
});

test("llms.txt is a link index, per the spec", () => {
  const lines = llmsIndex().split("\n");
  assert.equal(lines[0], "# Benjamin Nied", "an H1 name comes first");
  assert.ok(lines[2].startsWith("> "), "then a summary blockquote");
  assert.ok(llmsIndex().includes("## Resume"), "then a section of links");
  // one link per section, each pointing at a file this generator writes
  for (const cmd of ["about", "skills", "experience", "projects", "education", "contact"]) {
    assert.match(llmsIndex(), new RegExp(`\\]\\(https://bnied\\.dev/${cmd}\\.md\\)`), `missing link to ${cmd}.md`);
    assert.ok(files.has(`${cmd}.md`), `${cmd}.md is linked but not generated`);
  }
});

test("the markdown files are named after the commands that print them", () => {
  assert.deepEqual(
    [...files.keys()].filter(k => k.endsWith(".md")).sort(),
    ["about.md", "contact.md", "education.md", "experience.md", "projects.md", "skills.md"],
  );
});

test("shouted headings are cased properly, without mangling names", () => {
  const exp = sectionMd("experience", sections, experience);
  assert.match(exp, /^## Apple — 2018 - Present$/m, "APPLE -> Apple");
  assert.match(exp, /^## LinkedIn, Inc — 2016 - 2018$/m, "LINKEDIN, INC -> LinkedIn, Inc");
  assert.match(exp, /^## Work Market, Inc — 2015 - 2016$/m);
  // acronyms stay shouted, and an already-cased word is never touched
  assert.match(exp, /^## Apple \/\/ ASE Cassandra$/m);
  assert.match(exp, /^## Apple \/\/ ACI Postgres$/m);
  // project names are lowercase or camel on purpose
  const proj = sectionMd("projects", sections, experience);
  assert.match(proj, /^## neofsn$/m);
  assert.match(proj, /^## BSPRenderer$/m);
});

test("a section's own subheadings survive past its title", () => {
  // PROJECTS carries a CONTRIBUTIONS divider partway down; dropping it ran
  // open-source contributions straight on from personal projects.
  const proj = sectionMd("projects", sections, experience);
  assert.match(proj, /^# Projects$/m, "the file's H1 comes from the file, not the data");
  assert.equal((proj.match(/^## Projects$/gm) || []).length, 0, "the redundant title heading is dropped");
  assert.match(proj, /^## Contributions$/m, "but a later heading is not");
});

test("experience carries the detail behind each role", () => {
  const exp = sectionMd("experience", sections, experience);
  assert.match(exp, /^- Owned the group's Slackbot/m);
  assert.match(exp, /^\*\*Site Reliability Engineer — 2021 - Present\*\*$/m);
});

test("anchors become markdown links", () => {
  assert.match(sectionMd("contact", sections, experience),
    /\[source\.tube\/spaceduck\]\(https:\/\/source\.tube\/spaceduck\)/);
});

test("terminal-only guidance is dropped by an exact list, not a pattern", () => {
  const exp = sectionMd("experience", sections, experience);
  assert.ok(!exp.includes("For details, run"), "prompt guidance should not survive");
  assert.ok(!exp.includes("available roles:"), "role keys are navigation, not content");
  // a comment line that is genuinely content stays
  assert.match(sectionMd("education", sections, experience), /Coursework: high-level mathematics/);
  // and a content line shaped like the old heuristic's target survives
  const probe = { ...sections, education: [
    { text: "  EDUCATION", cls: "line-heading" },
    { text: "  terraform ansible packer", cls: "line-comment" },
  ] };
  assert.match(sectionMd("education", probe, experience), /terraform ansible packer/);
});

test("no HTML survives into the markdown", () => {
  for (const [path, body] of files) {
    if (!path.endsWith(".md")) continue;
    assert.doesNotMatch(body, /<[a-z/][^>]*>/i, `${path}: tags should be links or stripped`);
    assert.doesNotMatch(body, /&(lt|gt|amp);/, `${path}: entities should be decoded`);
  }
});
