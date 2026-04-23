// Boot sequence: plays BIOS lines, ASCII name, and profile after the CRT
// power-on animation. The prompt is hidden until the sequence finishes
// (regression guard for commit 544eba0).

import { addLine, scrollToBottom } from "./render.js";
import { cmdInput } from "./dom.js";
import { state } from "./state.js";
import { SEP } from "./data.js";

export function boot() {
  const POST_DELAY = 1600; // wait for CRT power-on

  // Hide the prompt during the boot sequence
  const inputLine = document.getElementById("input-line");
  if (inputLine) inputLine.style.display = "none";

  const biosLines = state.DATA.boot || [];

  const profileLines = [];
  state.ASCII_NAME.forEach(l => profileLines.push({ text: l, cls: "ascii-art", delay: 30 }));

  profileLines.push({ text: "", delay: 50 });
  profileLines.push({ text: "  Site Reliability Engineer", cls: "line-comment", delay: 30 });
  profileLines.push({ text: "  bnied@spaceduck.org", cls: "line-comment", delay: 30 });
  profileLines.push({ text: "", delay: 30 });
  profileLines.push({ text: SEP, cls: "line-separator", delay: 50 });
  profileLines.push({ text: "", delay: 30 });
  profileLines.push({ text: "  Type 'help' for available commands.", cls: "line-ok", delay: 0 });
  profileLines.push({ text: "", delay: 0 });

  const allBootLines = [...biosLines, ...profileLines];

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
    const lineDelay = line.delay !== undefined ? line.delay : 35;
    cumulativeDelay += lineDelay;

    setTimeout(() => {
      addLine(line.text, line.cls, false);
      scrollToBottom();
    }, cumulativeDelay);

    i++;
    scheduleNext();
  }

  scheduleNext();
}
