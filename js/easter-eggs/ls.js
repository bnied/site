// ls easter egg — fake directory listing with support for a handful of
// flag combinations (-l, -a, -s, -h, -1, -r, -t, -F).

import { addLine } from "../render.js";
import { lsRows } from "../textsources.js";

export function runLs(cmd) {
  const args = cmd.slice(2);
  lsRows(args).forEach(r => addLine("  " + r.text, r.cls, true));
  addLine("", null, false);
}
