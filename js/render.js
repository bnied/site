// Rendering helpers. Convert lines (plain text or HTML) into <div class="line">
// elements in the output area, and scroll to keep the prompt visible.

import { output, terminal } from "./dom.js";
import { linkifyCommand } from "./cmdlink.js";
import { reflow } from "./sections-model.js";

// Line classes that carry no meaning to a screen reader.
const DECORATIVE = new Set(["ascii-art", "line-separator"]);

export function addLine(text, cls, animate) {
  const div = document.createElement("div");
  div.className = "line" + (cls ? " " + cls : "") + (animate ? " line-enter" : "");
  div.innerHTML = text;
  // #output is a live region, so runs of box-drawing glyphs would be read out
  // character by character. Both are decoration: the name the art spells is in
  // the page title and the no-JS fallback, and the rules only divide sections.
  if (cls && cls.split(" ").some(c => DECORATIVE.has(c))) {
    div.setAttribute("aria-hidden", "true");
  }
  output.appendChild(div);
  // Returned so a caller can reach into the line it just added — lolcat paints
  // its hues through the CSSOM rather than as inline style attributes.
  return div;
}

// A line carrying a `cmd` field gets that command name wrapped as a clickable
// token — see data/help.json, where the padding stays outside the span so the
// description column keeps its alignment.
// The thin rule needs a different border than the heavy one and CSS cannot
// match on text, so tag it here. Like line-flow, the class is added at render
// time so resumepdf.js and netscape-html.js keep matching the data's
// `cls === "line-separator"` exactly.
export function renderCls(l) {
  if (l.cls === "line-separator" && (l.text || "").startsWith("\u2500")) {
    return l.cls + " line-rule-thin";
  }
  return l.cls;
}

export function addLines(lines) {
  lines.forEach(l => addLine(l.cmd ? linkifyCommand(l.text, l.cmd) : l.text, renderCls(l), true));
}

// Section blocks are authored hard-wrapped; the terminal re-joins them so the
// prose wraps at the viewport instead. The `line-flow` class is added here
// rather than in the data, so the class stays out of the section JSON that
// resumepdf.js and netscape-html.js match on.
export function addSection(block) {
  addLines(reflow(block).map(l =>
    l.flow ? { ...l, cls: (l.cls ? l.cls + " " : "") + "line-flow" } : l));
}

export function scrollToBottom() {
  terminal.scrollTop = terminal.scrollHeight;
}

export function escapeHTML(str) {
  const el = document.createElement("span");
  el.textContent = str;
  return el.innerHTML;
}

export function pad(str, len, right) {
  str = String(str);
  if (right) return str.padEnd(len);
  return str.padStart(len);
}
