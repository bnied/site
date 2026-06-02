// Pure tab-completion logic (no DOM). Operates on the active pipe segment so
// completion works after a `|`. Given the raw input and the command list, it
// computes the ghost suggestion and the result of pressing Tab.

// Split input into: everything up to and including the last `|` (head), the
// leading whitespace of the active segment (lead), and the token being typed.
export function segmentInfo(value) {
  const pipeIdx = value.lastIndexOf("|");
  const head = value.slice(0, pipeIdx + 1);
  const rest = value.slice(pipeIdx + 1);
  const lead = rest.match(/^\s*/)[0];
  const token = rest.slice(lead.length);
  return { head, lead, token };
}

export function commonPrefix(strs) {
  if (strs.length === 0) return "";
  let prefix = strs[0];
  for (const s of strs) {
    while (!s.startsWith(prefix)) prefix = prefix.slice(0, -1);
    if (prefix === "") break;
  }
  return prefix;
}

function matchesFor(token, commands) {
  if (!token) return [];
  const lower = token.toLowerCase();
  return commands.filter(c => c.startsWith(lower));
}

// Faint suggestion to display: only when the token uniquely matches a command.
export function ghostSuggestion(value, commands) {
  const { token } = segmentInfo(value);
  const matches = matchesFor(token, commands);
  if (matches.length === 1 && matches[0] !== token.toLowerCase()) {
    return matches[0].slice(token.length);
  }
  return null;
}

// New input value after pressing Tab, or null for no change:
//   unique match  -> complete fully and append a space
//   multiple      -> fill the longest common prefix (only if it extends token)
//   no match      -> null
export function completeInput(value, commands) {
  const { head, lead, token } = segmentInfo(value);
  const matches = matchesFor(token, commands);
  if (matches.length === 0) return null;
  if (matches.length === 1) {
    return head + lead + matches[0] + " ";
  }
  const lcp = commonPrefix(matches);
  if (lcp.length > token.length) {
    return head + lead + lcp;
  }
  return null;
}
