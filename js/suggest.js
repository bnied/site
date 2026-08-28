// "did you mean?" matching for unknown commands. Pure — no DOM.
//
// Matched against state.REAL_COMMANDS (the documented surface), never the full
// state.COMMANDS list: that one is padded with easter-egg decoys, and
// suggesting `su` for a typo'd `so` is worse than saying nothing.

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  // Single-row DP: prev[j] is the distance for the previous row.
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = row;
  }
  return prev[b.length];
}

// Closest command within an edit-distance budget, or null. Short tokens get a
// tighter budget — at 2 edits every 3-letter word is "close" to every other.
export function didYouMean(token, commands) {
  if (!token) return null;
  const t = String(token).toLowerCase();
  const budget = t.length <= 4 ? 1 : 2;
  let best = null;
  let bestDist = Infinity;
  for (const c of commands) {
    if (c === t) return null; // exact match: the caller shouldn't be here
    const d = levenshtein(t, c);
    // Strictly-less keeps the first candidate on a tie, so list order decides.
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return bestDist <= budget ? best : null;
}
