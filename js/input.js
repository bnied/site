// Keyboard and input handling: cursor sync, tab completion (with ghost text),
// history navigation, Ctrl+L to clear, click-to-focus.

import { cmdInput, inputSizer, output } from "./dom.js";
import { state } from "./state.js";
import { ghostSuggestion, completeInput } from "./completion.js";

let historyIdx = -1;

function syncCursor() {
  inputSizer.textContent = cmdInput.value || "";
}

function showTabGhost() {
  const existing = document.getElementById("tab-ghost");
  if (existing) existing.remove();

  const suggestion = ghostSuggestion(cmdInput.value, state.COMMANDS);
  if (suggestion) {
    const ghost = document.createElement("span");
    ghost.id = "tab-ghost";
    ghost.textContent = suggestion;
    // Place the suggestion AFTER the cursor so the cursor stays at the end of
    // the typed text (fish-style autosuggest), not at the end of the suggestion.
    document.getElementById("cursor").after(ghost);
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
}
