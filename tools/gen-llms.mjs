// gen-llms.mjs — build /llms.txt and the per-section markdown it points at.
//
// llms.txt (https://llmstxt.org) is a link index: an H1, a summary blockquote,
// then sections of links to markdown versions of a site's pages. This site has
// one HTML page, but it is not really one document — it is six sections a
// visitor reaches by typing `about`, `skills`, `experience` and so on. So each
// command gets its markdown file at the matching path, and llms.txt indexes
// them: `about` in the terminal and /about.md are the same content.
//
// Everything is generated from the section JSON the terminal renders, so there
// is no second copy of the resume to keep in sync, and test/llms.test.js fails
// when any generated file drifts.
//
//   node tools/gen-llms.mjs          # rewrite llms.txt and the .md files
//   node tools/gen-llms.mjs --check  # exit 1 if any would change
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { IDENTITY, DATES_RE, entries as flatten } from "../js/sections-model.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://bnied.dev";
// The generated markdown lives together rather than scattered through the web
// root, and mirrors the commands: md/<command>.md, md/experience/<role>.md for
// what `experience <role>` prints.
const MD = "md";

// Keep inline HTML so the anchors survive; they become markdown links below.
const entries = block => flatten(block, { keepHtml: true });

// The sections a visitor can type, in the order `all` prints them. The file
// name is the command name — that is the whole naming rule.
const SECTIONS = [
  { cmd: "about", title: "About", blurb: "Who I am and what I do." },
  { cmd: "skills", title: "Skills", blurb: "Technologies, grouped by area." },
  { cmd: "experience", title: "Experience", blurb: "Employment history, with the detail behind each role." },
  { cmd: "projects", title: "Projects", blurb: "Personal projects and open-source contributions." },
  { cmd: "education", title: "Education", blurb: "Degrees and coursework." },
  { cmd: "contact", title: "Contact", blurb: "Email and profiles." },
];

// <a href="https://x">label</a> -> [label](https://x). Any other tag is stripped
// rather than escaped: this is markdown, and a stray <b> helps nobody.
function mdText(s) {
  return s
    .replace(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/g, "[$2]($1)")
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// Words kept as written when a shouted heading is re-cased.
const ACRONYMS = new Set(["ASE", "ACI", "SRE", "CKA", "IT", "QA"]);
// Brands whose casing is not just a capital letter.
const BRANDS = new Map([["LINKEDIN", "LinkedIn"]]);

// The terminal shouts its headings — "ABOUT", "APPLE // ASE Cassandra". Case
// them properly for markdown, word by word: a word containing any lowercase is
// already cased and left alone (Cassandra, BSPRenderer, neofsn), a known
// acronym stays shouted, a known brand gets its real casing, and anything else
// entirely uppercase becomes Capitalized.
function properCase(text) {
  return text.replace(/[A-Za-z][A-Za-z']*/g, word => {
    if (/[a-z]/.test(word)) return word;
    if (ACRONYMS.has(word)) return word;
    const brand = BRANDS.get(word);
    if (brand) return brand;
    return word.charAt(0) + word.slice(1).toLowerCase();
  });
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
// navigation is noise, a missing job is not.
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
function blockMd(block, { level = 2, subheads = [], skipTitle = false } = {}) {
  const out = [];
  let titleSkipped = false;
  for (const e of entries(block)) {
    const text = mdText(e.text);
    if (!text.trim()) continue;
    if (e.cls === "line-comment" && isTerminalOnly(text)) continue;
    // The file's own H1 already names the section, so its first heading is
    // redundant — but only the first. PROJECTS also carries a CONTRIBUTIONS
    // heading partway down, and dropping that ran open-source contributions
    // straight on from personal projects with nothing between them.
    if (e.cls === "line-heading" && skipTitle && !titleSkipped) {
      titleSkipped = true;
      continue;
    }

    if (e.cls === "line-bullet") {
      out.push(`- ${text}`);
      continue;
    }
    // "APPLE 2018 - Present": split the right-aligned date column off so it
    // reads as a date rather than a run of spaces.
    const m = DATES_RE.exec(text);
    const heading = e.cls === "line-heading" || subheads.includes(e.cls);
    const body = m
      ? `${heading ? properCase(m[1]) : m[1]} — ${m[2]}`
      : (heading ? properCase(text) : text);

    if (e.cls === "line-heading") {
      out.push("", `${"#".repeat(level)} ${body}`, "");
    } else if (subheads.includes(e.cls)) {
      out.push("", `${"#".repeat(level)} ${body}`, "");
    } else if (e.cls === "line-accent" || e.cls === "line-highlight") {
      out.push(`**${body}**`, "");
    } else {
      out.push(body, "");
    }
  }
  return out;
}

const tidy = parts => parts.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";

const SUBHEADS = {
  skills: ["line-highlight"],
  experience: ["line-accent"],
  projects: ["line-accent"],
  education: ["line-accent"],
};

/** One markdown file per section, keyed by the command it corresponds to. */
export function sectionMd(cmd, sections, experience) {
  const meta = SECTIONS.find(s => s.cmd === cmd);
  const parts = [`# ${meta.title}`, "", `> ${meta.blurb}`, ""];
  parts.push(...blockMd(sections[cmd], {
    subheads: SUBHEADS[cmd] || [],
    skipTitle: true,
  }));
  return tidy(parts);
}

/** One file per role, matching what `experience <role>` prints. */
export function roleMd(block) {
  const es = entries(block);
  const title = properCase(mdText(es.find(e => e.cls === "line-heading")?.text || "Role"));
  const parts = [`# ${title}`, ""];
  parts.push(...blockMd(block, { skipTitle: true }));
  return tidy(parts);
}

/** "Site Reliability Engineer, 2021 - Present" for the index. */
function roleBlurb(block) {
  const line = entries(block).find(e => e.cls === "line-highlight");
  if (!line) return "";
  const text = mdText(line.text);
  const m = DATES_RE.exec(text);
  return m ? `${m[1]}, ${m[2]}` : text;
}

function roleTitle(block) {
  const line = entries(block).find(e => e.cls === "line-heading");
  return properCase(mdText(line?.text || "Role"));
}

/** The index itself: H1, summary, then links to the files above. */
export function llmsIndex(experience) {
  const parts = [
    `# ${IDENTITY.name}`,
    "",
    `> ${IDENTITY.title}. ${SITE} is an interactive CRT terminal; each section`,
    "> below is what one of its commands prints, as plain markdown.",
    "",
    "## Resume",
    "",
  ];
  for (const s of SECTIONS) {
    parts.push(`- [${s.title}](${SITE}/${MD}/${s.cmd}.md): ${s.blurb}`);
  }
  // What `experience <role>` prints: the bullets behind each job. Listed
  // separately because the section files are the overview and these are the
  // depth beneath it.
  parts.push("", "## Roles", "");
  for (const [key, block] of Object.entries(experience)) {
    parts.push(`- [${roleTitle(block)}](${SITE}/${MD}/experience/${key}.md): ${roleBlurb(block)}`);
  }
  return tidy(parts);
}

/** Every generated file, as path (relative to the repo root) -> contents. */
export function llmsFiles(sections, experience) {
  const files = new Map([["llms.txt", llmsIndex(experience)]]);
  for (const s of SECTIONS) {
    files.set(`${MD}/${s.cmd}.md`, sectionMd(s.cmd, sections, experience));
  }
  for (const [key, block] of Object.entries(experience)) {
    files.set(`${MD}/experience/${key}.md`, roleMd(block));
  }
  return files;
}

export function readSources() {
  const json = f => JSON.parse(readFileSync(join(ROOT, f), "utf8"));
  return {
    sections: json("data/sections.json"),
    experience: json("data/experience.json"),
    read: path => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : null),
  };
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const { sections, experience, read } = readSources();
  const files = llmsFiles(sections, experience);
  const stale = [...files].filter(([path, body]) => read(path) !== body).map(([p]) => p);

  if (process.argv.includes("--check")) {
    if (stale.length) {
      console.error(`stale, run node tools/gen-llms.mjs: ${stale.join(", ")}`);
      process.exit(1);
    }
    console.log(`${files.size} generated files are current`);
  } else if (!stale.length) {
    console.log(`${files.size} generated files already current`);
  } else {
    for (const path of stale) {
      mkdirSync(dirname(join(ROOT, path)), { recursive: true });
      writeFileSync(join(ROOT, path), files.get(path));
    }
    console.log(`updated: ${stale.join(", ")}`);
  }
}
