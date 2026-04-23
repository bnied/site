// Keyboard and input handling: cursor sync, tab completion (with ghost text),
// history navigation, Ctrl+L to clear, click-to-focus.

import { cmdInput, inputSizer, output } from "./dom.js";
import { state } from "./state.js";

let historyIdx = -1;

function syncCursor() {
  inputSizer.textContent = cmdInput.value || "";
}

function getCompletion(partial) {
  if (!partial) return null;
  const lower = partial.toLowerCase();
  const matches = state.COMMANDS.filter(c => c.startsWith(lower));
  return matches.length === 1 ? matches[0] : null;
}

function showTabGhost() {
  const existing = document.getElementById("tab-ghost");
  if (existing) existing.remove();

  const val = cmdInput.value;
  const match = getCompletion(val);
  if (match && val.length > 0 && match !== val.toLowerCase()) {
    const ghost = document.createElement("span");
    ghost.id = "tab-ghost";
    ghost.textContent = match.slice(val.length);
    inputSizer.parentNode.insertBefore(ghost, document.getElementById("cursor"));
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
      const match = getCompletion(cmdInput.value);
      if (match) {
        cmdInput.value = match;
        syncCursor();
        clearTabGhost();
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
}
