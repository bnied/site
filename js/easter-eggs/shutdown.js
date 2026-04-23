// shutdown / reboot easter egg — fake systemd shutdown, fade to black,
// and (if rebooting) restart the boot sequence.

import { output } from "../dom.js";
import { addLine, scrollToBottom } from "../render.js";
import { boot } from "../boot.js";

export function runShutdown(reboot) {
  const inputLine = document.getElementById("input-line");
  inputLine.style.display = "none";

  const shutdownLines = [
    { text: "", delay: 200 },
    { text: "  Broadcast message from visitor@bnied.dev", cls: "line-system", delay: 100 },
    { text: "  The system is going down for " + (reboot ? "reboot" : "poweroff") + " NOW!", cls: "line-system", delay: 400 },
    { text: "", delay: 300 },
    { text: "  [  OK  ] Stopped target Timers.", cls: "line-ok", delay: 80 },
    { text: "  [  OK  ] Stopped target Graphical Interface.", cls: "line-ok", delay: 80 },
    { text: "  [  OK  ] Stopped target Multi-User System.", cls: "line-ok", delay: 120 },
    { text: "  [ INFO ] Stopping SSH daemon...", cls: "line-system", delay: 80 },
    { text: "  [  OK  ] Stopped SSH daemon.", cls: "line-ok", delay: 150 },
    { text: "  [ INFO ] Stopping Network Manager...", cls: "line-system", delay: 80 },
    { text: "  [  OK  ] Stopped Network Manager.", cls: "line-ok", delay: 200 },
    { text: "  [ INFO ] Unmounting filesystems...", cls: "line-system", delay: 80 },
    { text: "  [  OK  ] Unmounted /home.", cls: "line-ok", delay: 80 },
    { text: "  [  OK  ] Unmounted /boot.", cls: "line-ok", delay: 80 },
    { text: "  [  OK  ] Reached target Unmount All Filesystems.", cls: "line-ok", delay: 300 },
    { text: "  [  OK  ] Reached target Final Step.", cls: "line-ok", delay: 200 },
    { text: "", delay: 400 },
    { text: reboot ? "  [ INFO ] Rebooting..." : "  [ INFO ] Powering off...", cls: "line-system", delay: 0 },
  ];

  let i = 0;
  let cumulativeDelay = 0;

  function scheduleNext() {
    if (i >= shutdownLines.length) {
      setTimeout(() => {
        const overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;inset:0;background:#000;z-index:999;opacity:0;transition:opacity 1.5s;";
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.style.opacity = "1");

        if (reboot) {
          setTimeout(() => {
            overlay.remove();
            output.innerHTML = "";
            inputLine.style.display = "flex";
            boot();
          }, 3000);
        }
      }, cumulativeDelay + 800);
      return;
    }

    const line = shutdownLines[i];
    cumulativeDelay += (line.delay !== undefined ? line.delay : 80);

    setTimeout(() => {
      addLine(line.text, line.cls, true);
      scrollToBottom();
    }, cumulativeDelay);

    i++;
    scheduleNext();
  }

  scheduleNext();
}
