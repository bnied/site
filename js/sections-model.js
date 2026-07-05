// sections-model.js — shared, pure helpers for consumers of the section
// JSON (resumepdf.js, netscape-html.js, textsources.js). The terminal data
// in data/*.json is the single source of truth; this module is the single
// implementation of how that data is flattened back into logical entries.

export const IDENTITY = {
  name: "Benjamin Nied",
  title: "Site Reliability Engineer",
};

// "Role 2021 - Present" / "School 2005 - 2007" → [, text, dates]
export const DATES_RE = /^(.*?)\s+(\d{4}\s*-\s*(?:Present|\d{4}))$/;

export function plainText(t) {
  return t
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

/**
 * Flatten a section block: drop separators/blanks and merge the terminal's
 * hard-wrapped continuation lines back into their parent entry.
 *
 * @param {{ text: string, cls?: string }[]} block
 * @param {{ keepHtml?: boolean }} [opts]  keepHtml preserves inline links;
 *   the default strips tags and decodes entities to plain text.
 * @returns {{ cls: string | null, text: string }[]}
 */
export function entries(block, { keepHtml = false } = {}) {
  const out = [];
  for (const l of block || []) {
    const cls = l.cls || null;
    const source = keepHtml ? l.text : plainText(l.text);
    if (!source.trim() || cls === "line-separator") continue;
    const text = source.trim().replace(/\s+/g, " ");
    const prev = out[out.length - 1];
    const isContinuation =
      prev &&
      ((!cls && (prev.cls === "line-bullet" || prev.cls === null)) ||
        (cls === "line-comment" && prev.cls === "line-comment"));
    if (isContinuation) {
      prev.text += " " + text;
    } else {
      out.push({ cls, text });
    }
  }
  return out;
}
