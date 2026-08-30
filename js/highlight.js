// highlight.js — literal substring highlighting for `grep` output. Pure: no DOM.
//
// The search itself is a literal, case-insensitive `includes()`, so the
// highlighting has to be literal too. Building a RegExp from the pattern got
// both halves wrong: a metacharacter threw (`grep (` is an unterminated group)
// and `grep .` quietly highlighted every character of a line it had matched on
// a literal dot.

/**
 * Wrap every case-insensitive occurrence of `pattern` in `text` with
 * `<span class="...">`, HTML-escaping everything else.
 *
 * @param {string} text     raw line text
 * @param {string} pattern  literal substring to mark, not a regex
 * @param {(s: string) => string} escape  HTML escaper for the surrounding text
 * @param {string} [cls]    class for the marking span
 * @returns {string} HTML
 */
export function highlightLiteral(text, pattern, escape, cls = "line-heading") {
  // An empty needle has an occurrence at every index; nothing to mark.
  if (!pattern) return escape(text);

  const hay = text.toLowerCase();
  const needle = pattern.toLowerCase();
  let out = "";
  let i = 0;
  for (;;) {
    const at = hay.indexOf(needle, i);
    if (at === -1) return out + escape(text.slice(i));
    // Escape the run before the match and the matched text separately, so a
    // pattern that straddles an escaped character can never split an entity.
    out += escape(text.slice(i, at));
    out += `<span class="${cls}">${escape(text.slice(at, at + needle.length))}</span>`;
    i = at + needle.length;
  }
}
