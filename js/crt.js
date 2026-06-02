// CRT effect-intensity control. Levels: off | on | max. Orthogonal to `theme`.
// State lives on <html data-crt>; the level is persisted in localStorage and
// applied before first paint by an inline script in index.html. This module is
// import-safe in Node (no top-level DOM access) so crtLevelFromArg is unit-tested.

export const CRT_LEVELS = ["off", "on", "max"];

// Pure: normalize a command argument to a valid level, or null if unknown.
export function crtLevelFromArg(arg) {
  const v = String(arg).trim().toLowerCase();
  return CRT_LEVELS.includes(v) ? v : null;
}

// Browser-only (not called from tests).
export function getCrt() {
  const v = document.documentElement.dataset.crt;
  return CRT_LEVELS.includes(v) ? v : "on";
}

export function setCrt(level) {
  document.documentElement.dataset.crt = level;
  try { localStorage.setItem("crt", level); } catch (e) { /* private/locked-down mode */ }
  window.dispatchEvent(new CustomEvent("crtchange", { detail: level }));
}
