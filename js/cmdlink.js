// Turns a command name inside a rendered line into a clickable token.
//
// Pure and DOM-free on purpose: bootlines.js imports this and is unit-tested
// under plain node. The click handling lives in input.js, which delegates on
// #output and reads the data-cmd attribute produced here.
//
// No tabindex: the input line intercepts Tab for completion, so focus never
// reaches these spans. Keyboard users type the command — the superior path —
// and the link is a mouse/touch affordance layered on top.

export function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Wrap the first occurrence of `cmd` in `text`. Lines from data/*.json are
// trusted HTML (they already carry entities like `&lt;`), so the surrounding
// text passes through untouched. Returns `text` unchanged if `cmd` isn't in it.
//
// `runAs` sets what actually runs when the token is clicked, for cases where
// the visible word is shorter than the command — the `theme` menu lists bare
// palette names but each one runs `theme <name>`.
//
// Chaining calls over one string is unsafe in general — a later `cmd` could
// match inside markup an earlier call injected — so build multi-link lines by
// joining separately-linkified pieces instead.
export function linkifyCommand(text, cmd, runAs) {
  if (!cmd) return text;
  const i = text.indexOf(cmd);
  if (i === -1) return text;
  const attr = escapeAttr(runAs === undefined ? cmd : runAs);
  return (
    text.slice(0, i) +
    `<span class="cmd-link" data-cmd="${attr}" title="run: ${attr}">${cmd}</span>` +
    text.slice(i + cmd.length)
  );
}
