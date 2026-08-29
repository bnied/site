// x11-xterm.js — a real shell in a twm window. Commands run through the same
// pipe engine as the main terminal (js/xterm-shell.js): exit closes the window,
// startx errors because X is already running, xterm spawns another xterm, and
// the X clients open (or raise) their own windows via openApp.

import { state } from "../state.js";
import { xtermRespond } from "../xterm-shell.js";
import { clamp } from "./x11-wm.js";
import { probeEnvironment } from "./dmesg.js";
import { buildResume } from "./misc.js";

/**
 * `closeMenus` dismisses the root menu and any Netscape dropdown (clicking an
 * xterm should put both away); `openApp` launches one of the other clients by
 * name, which keeps this module from having to know about them.
 */
export function createXterm({ wm, dw, dh, closeMenus, openApp }) {
  const { makeWindow, destroyWin } = wm;

// ── xterm ──
// A real shell in a window: commands run through the same pipe engine as
// the main terminal (js/xterm-shell.js). exit closes the window, startx
// errors because X is already running, xterm spawns another xterm.
function shellCtx() {
  return {
    font: state.DATA.figletFont,
    fortunes: state.FORTUNES,
    sections: state.sections,
    now: new Date(),
    pageLoadTime: state.pageLoadTime,
    theme: document.documentElement.getAttribute("data-theme") || "green",
    locale: navigator.language || "en-US",
    neofetchAscii: state.DATA.neofetch || [],
    neofetchInfo: state.DATA.neofetchInfo || [],
    processes: state.DATA.btopProcesses || [],
    env: probeEnvironment(),
    resumeLines: buildResume(),
    helpText: state.helpText,
    experienceDetail: state.experienceDetail,
    expKeys: state.EXP_KEYS,
  };
}

let xtermCount = 0;
function spawnXterm() {
  const n = xtermCount++;
  const xw = Math.min(600, dw - 48);
  const xh = Math.min(320, dh - 80);
  const win = makeWindow({
    name: "xterm",
    title: "xterm",
    x: clamp(24 + (n % 5) * 32, 8, dw - xw - 8),
    y: clamp(dh - xh - 44 + (n % 5) * 24, 10, dh - 80),
    w: xw,
    h: xh,
    minW: 260,
    minH: 140,
    contentHTML: `
      <div class="xterm">
        <div class="xterm-out"></div>
        <div class="xterm-line">
          <span class="xterm-prompt">visitor@bnied.dev:~$&nbsp;</span>
          <input class="xterm-input" type="text" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="xterm command input">
        </div>
      </div>
    `,
  });
  const box = win.el.querySelector(".xterm");
  const out = win.el.querySelector(".xterm-out");
  const input = win.el.querySelector(".xterm-input");
  const hist = [];
  let histPos = 0;

  function print(text) {
    const row = document.createElement("div");
    row.className = "xterm-row";
    row.textContent = text;
    out.appendChild(row);
  }

  function run(raw) {
    print(`visitor@bnied.dev:~$ ${raw}`);
    if (raw.trim()) {
      hist.push(raw);
      histPos = hist.length;
    }
    const res = xtermRespond(raw, shellCtx());
    (res.lines || []).forEach(print);
    if (res.action === "exit") {
      destroyWin(win);
      return;
    }
    if (res.action === "clear") out.innerHTML = "";
    else if (res.action === "spawn") spawnXterm();
    else if (res.action && res.action.startsWith("open:")) {
      const app = res.action.slice(5);
      openApp(app);
    }
    box.scrollTop = box.scrollHeight;
  }

  input.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.key === "Enter") {
      run(input.value);
      input.value = "";
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histPos > 0) input.value = hist[--histPos];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      histPos = Math.min(hist.length, histPos + 1);
      input.value = histPos === hist.length ? "" : hist[histPos];
    } else if (e.key === "Escape") {
      input.blur();
    }
  });
  // keep clicks from reaching the terminal's click-to-focus handler;
  // don't steal focus from a text selection in progress
  box.addEventListener("click", e => {
    e.stopPropagation();
    closeMenus();
    if (String(getSelection())) return;
    input.focus();
  });

  input.focus();
  return win;
}
  return spawnXterm;
}
