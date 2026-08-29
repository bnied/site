// Pure assembly of the ordered boot line list: BIOS/POST lines, the ASCII name,
// the profile, and an MOTD-style login fortune. No DOM, no randomness (the
// chosen fortune is injected) — so the assembly is unit-tested.

import { linkifyCommand } from "./cmdlink.js";

// Where a first-time visitor should go before they've read `help`. Each is
// linkified on its own and joined, rather than chaining linkifyCommand over one
// string — a later name could otherwise match inside earlier injected markup.
export const START_HERE = ["about", "projects", "resume"];

// Body lines are indented two columns; the MOTD rules start at column zero.
const INDENT = "  ";

// The MOTD rules bracket the fortune, so they're cut to its width rather than a
// fixed one — fortunes vary from ~20 to ~100 columns and a fixed rule either
// falls short of the long ones or overhangs the short ones. The rule runs one
// indent past each end of the text so the overhang is even on both sides.
function ruleFor(text) {
  return "\u2550".repeat(text.length + INDENT.length * 2);
}

export function buildBootLines({ bios, asciiName, role, email, fortune }) {
  const lines = [];
  // Pass BIOS/POST lines through as-is. Count-up marker lines carry no static
  // `text`; give them a derived fallback so consumers that read `.text` (and
  // the static no-JS render) still have something to show.
  for (const l of bios) {
    if (l.type === "countup" && l.text === undefined) {
      lines.push({ ...l, text: l.label + l.target + l.unit });
    } else {
      lines.push(l);
    }
  }
  for (const l of asciiName) lines.push({ text: l, cls: "ascii-art", delay: 30 });
  lines.push({ text: "", delay: 50 });
  lines.push({ text: "  " + role, cls: "line-comment", delay: 30 });
  lines.push({ text: "  " + email, cls: "line-comment", delay: 30 });
  lines.push({ text: "", delay: 30 });
  lines.push({ text: ruleFor(fortune), cls: "line-separator", delay: 50 });
  lines.push({ text: INDENT + fortune, cls: "line-accent", delay: 40 });
  lines.push({ text: ruleFor(fortune), cls: "line-separator", delay: 30 });
  lines.push({ text: "", delay: 30 });
  const starts = START_HERE.map(c => linkifyCommand(c, c)).join("   ");
  lines.push({ text: "  Start here:  " + starts, cls: "line-ok", delay: 0 });
  lines.push({ text: "  or type 'help' to see everything.", cls: "line-comment", delay: 0 });
  lines.push({ text: "", delay: 0 });
  return lines;
}
