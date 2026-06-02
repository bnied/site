// Boot sequence: plays BIOS lines, ASCII name, and profile after the CRT
// power-on animation. The prompt is hidden until the sequence finishes
// (regression guard for commit 544eba0).

import { addLine, scrollToBottom } from "./render.js";
import { cmdInput, output } from "./dom.js";
import { state } from "./state.js";
import { buildBootLines } from "./bootlines.js";

// Render a POST-style count-up line: the number races to its target then locks.
function renderCountup(line, reduceMotion) {
  addLine(line.label + line.target + line.unit, line.cls, false);
  if (reduceMotion) return;
  // Capture the line element NOW: the count-up runs ~390ms and overlaps the
  // next boot lines appending, so we must NOT re-read lastElementChild later.
  const el = output.lastElementChild;
  const steps = 14;
  let n = 0;
  const tick = setInterval(() => {
    n++;
    const val = Math.round((line.target / steps) * n);
    el.textContent = line.label + (n >= steps ? line.target : val) + line.unit;
    if (n >= steps) clearInterval(tick);
  }, 28);
}

export function boot() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const POST_DELAY = reduceMotion ? 0 : 1600; // wait for CRT power-on (skip under reduced motion)

  // Hide the prompt during the boot sequence
  const inputLine = document.getElementById("input-line");
  if (inputLine) inputLine.style.display = "none";

  const biosLines = state.DATA.boot || [];
  const fortune = state.FORTUNES[Math.floor(Math.random() * state.FORTUNES.length)];

  const allBootLines = buildBootLines({
    bios: biosLines,
    asciiName: state.ASCII_NAME,
    role: "Site Reliability Engineer",
    email: "bnied@spaceduck.org",
    fortune,
  });

  let i = 0;
  let cumulativeDelay = POST_DELAY;

  function scheduleNext() {
    if (i >= allBootLines.length) {
      // After all boot lines have rendered, reveal the prompt
      setTimeout(() => {
        if (inputLine) inputLine.style.display = "flex";
        scrollToBottom();
        cmdInput.focus();
      }, cumulativeDelay + 150);
      return;
    }
    const line = allBootLines[i];
    const lineDelay = reduceMotion ? 0 : (line.delay !== undefined ? line.delay : 35);
    cumulativeDelay += lineDelay;

    setTimeout(() => {
      if (line.type === "countup") {
        renderCountup(line, reduceMotion);
      } else {
        addLine(line.text, line.cls, false);
      }
      scrollToBottom();
    }, cumulativeDelay);

    i++;
    scheduleNext();
  }

  scheduleNext();
}
