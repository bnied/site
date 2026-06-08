// Keyboard and input handling: cursor sync, tab completion (with ghost text),
// history navigation, Ctrl+L to clear, click-to-focus.

import { cmdInput, inputSizer, cursor, output } from "./dom.js";
import { state } from "./state.js";
import { ghostSuggestion, completeInput } from "./completion.js";
import { cursorSizerText } from "./cursor.js";

let historyIdx = -1;

// Hidden, absolutely-positioned mirror used ONLY to measure the caret's x-offset
// (the width of the text up to the caret). It must NOT be in normal flow: the
// in-flow #input-sizer sizes #input-wrap and thus the 100%-width #cmd-input, so
// anything that shrinks the flowed width would clip the input's text.
const caretMeasure = document.createElement("span");
caretMeasure.setAttribute("aria-hidden", "true");
caretMeasure.style.cssText =
  "position:absolute; visibility:hidden; white-space:pre; left:0; top:0; pointer-events:none;";
inputSizer.parentElement.appendChild(caretMeasure); // inherits the terminal font

function caretAtEnd() {
  return cmdInput.selectionStart === cmdInput.value.length;
}

function syncCursor() {
  // The sizer holds the FULL value so #input-wrap (and the input) stays wide
  // enough to render every character. The caret position is measured separately
  // from the out-of-flow mirror so it can sit mid-text without clipping.
  inputSizer.textContent = cmdInput.value || "";
  caretMeasure.textContent = cursorSizerText(cmdInput.value, cmdInput.selectionStart);
  cursor.style.left = caretMeasure.offsetWidth + "px";
  // A full block would hide the glyph it overlaps mid-text; thin it to a bar
  // unless the caret is at the line end (where the block covers empty space).
  cursor.classList.toggle("insert", !caretAtEnd());
}

function showTabGhost() {
  const existing = document.getElementById("tab-ghost");
  if (existing) existing.remove();

  // The ghost is appended in flow after the sizer, so it only lands correctly
  // when the caret (and thus the sizer's mirrored text) is at the line end.
  if (!caretAtEnd()) return;

  const suggestion = ghostSuggestion(cmdInput.value, state.COMMANDS);
  if (suggestion) {
    const ghost = document.createElement("span");
    ghost.id = "tab-ghost";
    ghost.textContent = suggestion;
    // Sits in normal flow right after the (hidden) sizer, so it's contiguous
    // with the typed text. The absolutely-positioned cursor overlays the
    // boundary (the first ghost char), fish-style — no gap.
    inputSizer.insertAdjacentElement("afterend", ghost);
  }
}

function clearTabGhost() {
  const ghost = document.getElementById("tab-ghost");
  if (ghost) ghost.remove();
}

export function initInput(runCommand) {
  cmdInput.addEventListener("input", () => {
    syncCursor();
    showTabGhost();
  });

  cmdInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const val = cmdInput.value;
      if (val.trim()) state.history.unshift(val);
      historyIdx = -1;
      runCommand(val);
      cmdInput.value = "";
      syncCursor();
      clearTabGhost();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const completed = completeInput(cmdInput.value, state.COMMANDS);
      if (completed !== null) {
        cmdInput.value = completed;
        syncCursor();
        clearTabGhost();
        showTabGhost();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx < state.history.length - 1) {
        historyIdx++;
        cmdInput.value = state.history[historyIdx];
        syncCursor();
        showTabGhost();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        historyIdx--;
        cmdInput.value = state.history[historyIdx];
      } else {
        historyIdx = -1;
        cmdInput.value = "";
      }
      syncCursor();
      showTabGhost();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      output.innerHTML = "";
    }
  });

  document.addEventListener("click", () => cmdInput.focus());

  // Caret moves that don't change the value — arrow keys, Home/End, clicking
  // into the text — fire selectionchange but not input. Re-sync the cursor so
  // the block follows the caret, and refresh the ghost (drops it when the
  // caret leaves the end of the line).
  document.addEventListener("selectionchange", () => {
    if (document.activeElement !== cmdInput) return;
    syncCursor();
    showTabGhost();
  });

  syncCursor();
}
