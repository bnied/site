import { test } from "node:test";
import assert from "node:assert/strict";
import { llmsFiles, llmsIndex, sectionMd, roleMd, readSources } from "../tools/gen-llms.mjs";

const { sections, experience, read } = readSources();
const files = llmsFiles(sections, experience);

test("every generated file is current with the section data", () => {
  for (const [path, body] of files) {
    assert.equal(read(path), body, `${path} is stale — run: npm run llms`);
  }
});

test("llms.txt is a link index, per the spec", () => {
  const lines = llmsIndex(experience).split("\n");
  assert.equal(lines[0], "# Benjamin Nied", "an H1 name comes first");
  assert.ok(lines[2].startsWith("> "), "then a summary blockquote");
  const index = llmsIndex(experience);
  assert.ok(index.includes("## Resume"), "then a section of links");
  // one link per section, each pointing at a file this generator writes
  for (const cmd of ["about", "skills", "experience", "projects", "education", "contact"]) {
    assert.match(index, new RegExp(`\\]\\(https://bnied\\.dev/md/${cmd}\\.md\\)`), `missing link to ${cmd}.md`);
    assert.ok(files.has(`md/${cmd}.md`), `md/${cmd}.md is linked but not generated`);
  }
  // and one per role, matching `experience <role>`
  assert.ok(index.includes("## Roles"), "roles are indexed separately");
  for (const key of Object.keys(experience)) {
    assert.match(index, new RegExp(`\\]\\(https://bnied\\.dev/md/experience/${key}\\.md\\)`), `missing link to ${key}`);
    assert.ok(files.has(`md/experience/${key}.md`), `md/experience/${key}.md is linked but not generated`);
  }
  // every link in the index resolves to a generated file
  for (const [, url] of index.matchAll(/\]\(https:\/\/bnied\.dev\/([^)]+)\)/g)) {
    assert.ok(files.has(url), `index links ${url}, which is not generated`);
  }
});

test("the markdown files are named after the commands that print them", () => {
  assert.deepEqual(
    [...files.keys()].filter(k => k.startsWith("md/") && !k.includes("/experience/")).sort(),
    ["md/about.md", "md/contact.md", "md/education.md", "md/experience.md",
     "md/projects.md", "md/skills.md"],
  );
  // `experience <role>` maps to md/experience/<role>.md, key for key
  assert.deepEqual(
    [...files.keys()].filter(k => k.includes("/experience/")).sort(),
    Object.keys(experience).map(k => `md/experience/${k}.md`).sort(),
  );
});

test("each role file carries its own bullets", () => {
  const cassandra = roleMd(experience["apple-cassandra"]);
  assert.match(cassandra, /^# Apple \/\/ ASE Cassandra$/m);
  assert.match(cassandra, /^\*\*Site Reliability Engineer — 2021 - Present\*\*$/m);
  assert.match(cassandra, /^- Owned the group's Slackbot/m);
  // ...and only its own: the summary file no longer inlines them
  assert.ok(!sectionMd("experience", sections, experience).includes("Owned the group's Slackbot"));
});

test("shouted headings are cased properly, without mangling names", () => {
  const exp = sectionMd("experience", sections, experience);
  assert.match(exp, /^## Apple — 2018 - Present$/m, "APPLE -> Apple");
  assert.match(exp, /^## LinkedIn, Inc — 2016 - 2018$/m, "LINKEDIN, INC -> LinkedIn, Inc");
  assert.match(exp, /^## Work Market, Inc — 2015 - 2016$/m);
  // acronyms stay shouted, and an already-cased word is never touched —
  // the per-role headings live in their own files now
  assert.match(roleMd(experience["apple-cassandra"]), /^# Apple \/\/ ASE Cassandra$/m);
  assert.match(roleMd(experience["apple-postgres"]), /^# Apple \/\/ ACI Postgres$/m);
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

test("the experience summary lists every employer", () => {
  const exp = sectionMd("experience", sections, experience);
  for (const employer of ["Apple", "LinkedIn, Inc", "Work Market, Inc",
                          "Shutterstock, Inc", "Datapipe, Inc"]) {
    assert.ok(exp.includes(`## ${employer}`), `missing ${employer}`);
  }
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
