// Rendering helpers. Convert lines (plain text or HTML) into <div class="line">
// elements in the output area, and scroll to keep the prompt visible.

import { output, terminal } from "./dom.js";
import { linkifyCommand } from "./cmdlink.js";

export function addLine(text, cls, animate) {
  const div = document.createElement("div");
  div.className = "line" + (cls ? " " + cls : "") + (animate ? " line-enter" : "");
  div.innerHTML = text;
  output.appendChild(div);
}

// A line carrying a `cmd` field gets that command name wrapped as a clickable
// token — see data/help.json, where the padding stays outside the span so the
// description column keeps its alignment.
export function addLines(lines) {
  lines.forEach(l => addLine(l.cmd ? linkifyCommand(l.text, l.cmd) : l.text, l.cls, true));
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
