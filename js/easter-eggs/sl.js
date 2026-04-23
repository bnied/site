// sl easter egg — animated ASCII steam locomotive chuffs across the terminal.

import { output, terminal, cmdInput } from "../dom.js";
import { scrollToBottom } from "../render.js";
import { state } from "../state.js";

export function runSL() {
  const trainFrames = state.DATA.train || [[]];

  const trainWidth = 58;
  const termWidth = Math.floor(terminal.clientWidth / 8.4);
  const inputLine = document.getElementById("input-line");
  inputLine.style.display = "none";

  const trainContainer = document.createElement("div");
  trainContainer.className = "line";
  trainContainer.style.cssText = "position:relative;height:10.5em;overflow:hidden;white-space:pre;";
  output.appendChild(trainContainer);

  const trainEl = document.createElement("div");
  trainEl.className = "ascii-art";
  trainEl.style.cssText = "position:absolute;top:0;white-space:pre;color:var(--p1);";
  trainContainer.appendChild(trainEl);

  let pos = termWidth;
  let frame = 0;
  const speed = 40;

  const interval = setInterval(() => {
    const currentFrame = trainFrames[frame % trainFrames.length];
    const pad = pos > 0 ? " ".repeat(pos) : "";
    const displayLines = currentFrame.map(line => {
      const shifted = pad + line;
      if (pos < 0) {
        return shifted.slice(Math.abs(pos) > shifted.length ? shifted.length : 0);
      }
      return shifted;
    });
    trainEl.textContent = displayLines.join("\n");
    pos -= 2;
    frame++;

    if (pos < -(trainWidth + 5)) {
      cleanup();
    }
  }, speed);

  function cleanup() {
    clearInterval(interval);
    document.removeEventListener("keydown", onKey, true);
    trainContainer.remove();
    inputLine.style.display = "flex";
    cmdInput.focus();
    scrollToBottom();
  }

  function onKey(e) {
    if (e.key === "q" || e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
      e.preventDefault();
      cleanup();
    }
  }
  document.addEventListener("keydown", onKey, true);

  scrollToBottom();
}
