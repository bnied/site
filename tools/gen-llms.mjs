// gen-llms.mjs — build /llms.txt from the section JSON.
//
// llms.txt (https://llmstxt.org) is specified as a link index: an H1, a summary
// blockquote, then curated links to markdown versions of a site's pages. That
// shape assumes a documentation site. This is one page, and its only markdown
// version would be the file being generated — so a link index would point at
// index.html, which is a JavaScript shell with nothing readable in it.
//
// The useful adaptation is to make llms.txt *carry* the resume rather than
// point at it. Generated from the same data the terminal renders, so there is
// no second copy of the resume to keep in sync, and test/llms.test.js fails
// when llms.txt drifts from data/.
//
//   node tools/gen-llms.mjs          # rewrite llms.txt
//   node tools/gen-llms.mjs --check  # exit 1 if it would change
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { IDENTITY, DATES_RE, entries as flatten } from "../js/sections-model.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://bnied.dev/";

// Keep inline HTML so the anchors survive; they become markdown links below.
const entries = block => flatten(block, { keepHtml: true });

// <a href="https://x">label</a> -> [label](https://x). Any other tag is stripped
// rather than escaped: this is markdown, and a stray <b> helps nobody.
function mdText(s) {
  return s
    .replace(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/g, "[$2]($1)")
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// Section titles are shouted in the terminal ("ABOUT", "EXPERIENCE"). Soften
// only the ones that are entirely uppercase — "APPLE // ASE Cassandra" is a
// heading too, and lowercasing it would mangle the name.
function titleCase(s) {
  if (!/^[^a-z]+$/.test(s)) return s;
  return s.replace(/[A-Z]+/g, w => w.charAt(0) + w.slice(1).toLowerCase());
}

// Lines that exist only to work the prompt, listed explicitly rather than
// matched by pattern. An earlier version tested comment lines against
// /^[a-z-]+(\s+[a-z-]+)*$/ to catch the run of role keys — which would also
// have matched any all-lowercase comment line and silently dropped it from the
// resume. entries() merges consecutive comment lines, so the guidance and its
// role list arrive as one entry; this matches its opening.
//
// Add to this list when a new prompt-only line appears. Anything not named
// here is treated as content, which is the safer default: a stray line of
// navigation in llms.txt is noise, a missing job is not.
const TERMINAL_ONLY = [
  "For details, run: experience",
];

const isTerminalOnly = text => TERMINAL_ONLY.some(prefix => text.startsWith(prefix));

/**
 * Render one section block as markdown.
 *
 * `subheads` names the classes that introduce a group in this section — a
 * company, a school, a project, a skills category — matching gen-noscript.mjs.
 * Everything else accented is emphasis, not structure, so a tagline stays a
 * paragraph rather than becoming a heading.
 */
function blockMd(block, { level = 2, subheads = [] } = {}) {
  const out = [];
  for (const e of entries(block)) {
    const text = mdText(e.text);
    if (!text.trim()) continue;
    if (e.cls === "line-comment" && isTerminalOnly(text)) continue;

    if (e.cls === "line-bullet") {
      out.push(`- ${text}`);
      continue;
    }
    // "APPLE 2018 - Present": split the right-aligned date column off so it
    // reads as a date rather than a run of spaces.
    const m = DATES_RE.exec(text);
    const body = m ? `${m[1]} — ${m[2]}` : text;

    if (e.cls === "line-heading") {
      out.push("", `${"#".repeat(level)} ${titleCase(body)}`, "");
    } else if (subheads.includes(e.cls)) {
      out.push("", `${"#".repeat(level + 1)} ${body}`, "");
    } else if (e.cls === "line-accent" || e.cls === "line-highlight") {
      out.push(`**${body}**`, "");
    } else {
      out.push(body, "");
    }
  }
  return out;
}

export function llmsText(sections, experience) {
  const out = [
    `# ${IDENTITY.name}`,
    "",
    `> ${IDENTITY.title}. Resume, projects and contact details for ${IDENTITY.name},`,
    `> served from ${SITE} as an interactive CRT terminal. This file carries the`,
    "> same content as plain markdown, generated from the site's own data.",
    "",
  ];
  out.push(...blockMd(sections.about));
  out.push(...blockMd(sections.contact));
  out.push(...blockMd(sections.skills, { subheads: ["line-highlight"] }));
  out.push(...blockMd(sections.experience, { subheads: ["line-accent"] }));
  // The experience section lists the roles; the detail blocks hold the bullets.
  for (const block of Object.values(experience)) {
    out.push(...blockMd(block, { level: 3 }));
  }
  out.push(...blockMd(sections.projects, { subheads: ["line-accent"] }));
  out.push(...blockMd(sections.education, { subheads: ["line-accent"] }));

  // Collapse the blank lines the block renderer leaves at joins.
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function readSources() {
  const json = f => JSON.parse(readFileSync(join(ROOT, f), "utf8"));
  return {
    current: readFileSync(join(ROOT, "llms.txt"), "utf8"),
    sections: json("data/sections.json"),
    experience: json("data/experience.json"),
  };
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const json = f => JSON.parse(readFileSync(join(ROOT, f), "utf8"));
  const next = llmsText(json("data/sections.json"), json("data/experience.json"));
  const path = join(ROOT, "llms.txt");
  let current = "";
  try { current = readFileSync(path, "utf8"); } catch { /* first run */ }
  if (process.argv.includes("--check")) {
    if (next !== current) {
      console.error("llms.txt is stale — run: node tools/gen-llms.mjs");
      process.exit(1);
    }
    console.log("llms.txt is current");
  } else if (next === current) {
    console.log("llms.txt already current");
  } else {
    writeFileSync(path, next);
    console.log("llms.txt updated");
  }
}
