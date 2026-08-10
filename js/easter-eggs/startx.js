// startx easter egg — boots a fake X11 session running twm: floating
// windows with teal focused titlebars, draggable/resizable/iconifiable,
// a root menu on the desktop, and a pre-4.0 Netscape Navigator
// (Motif widgets, Helvetica chrome, bitmap page type) browsing a graphical
// rendition of this site. xterm, xclock, and xeyes launch on demand from
// the root menu (or from inside an xterm, which runs the site's commands
// via js/xterm-shell.js). The Netscape menu bar is fully wired: real Back/Forward
// history in Go, Options toggles that hide chrome rows, View > Document
// Source, Open Location with fake DNS errors, and Help > About Netscape.
// Root menu > Exit (or the classic Ctrl+Alt+Backspace server zap) quits
// back to the terminal; Esc only closes menus and dialogs, as it should.
// Styling lives in css/style.css under "X11 SESSION".

import { cmdInput } from "../dom.js";
import { addLine, scrollToBottom } from "../render.js";
import { state } from "../state.js";
import { netscapePages } from "../netscape-html.js";
import { xtermRespond } from "../xterm-shell.js";
import { xcalcInit, xcalcPress } from "../xcalc.js";
import { probeEnvironment } from "./dmesg.js";
import { buildResume } from "./misc.js";

const REDUCED = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const BOOT_LINES = [
  ["xauth: file /home/visitor/.Xauthority does not exist", "line-comment"],
  ["", null],
  ["X.Org X Server 1.21.1.99 (SPACEDUCK build)", "line-system"],
  ["Current Operating System: SPACEDUCK/Linux 1.0.0-spaceduck", "line-system"],
  ["(==) Log file: \"/home/visitor/.local/share/xorg/Xorg.0.log\"", "line-system"],
  ["(II) Loading /usr/lib/xorg/modules/drivers/crt_drv.so", "line-system"],
  ["(II) CRT(0): phosphor P1 array detected, 60Hz", "line-system"],
  ["(II) CRT(0): applying scanline compensation", "line-system"],
  ["(II) Initializing extension MIT-SHM", "line-system"],
  ["twm: reading /home/visitor/.twmrc", "line-system"],
];

export function runStartx() {
  if (document.getElementById("x-session")) return;

  const delay = REDUCED() ? 0 : 120;
  BOOT_LINES.forEach(([text, cls], i) => {
    setTimeout(() => {
      addLine("  " + text, cls, true);
      scrollToBottom();
    }, i * delay);
  });
  setTimeout(launchX, BOOT_LINES.length * delay + (REDUCED() ? 0 : 300));
}

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Toolbar pixel icons, drawn jagged on purpose (crispEdges = period jaggies).
const NS_ICONS = {
  back: `<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true">
    <path d="M3 10 L11 3 V7 H17 V13 H11 V17 Z" fill="#7c8cb4" stroke="#000"/></svg>`,
  fwd: `<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true">
    <path d="M17 10 L9 3 V7 H3 V13 H9 V17 Z" fill="#7c8cb4" stroke="#000"/></svg>`,
  home: `<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="4" y="9" width="12" height="8" fill="#e0e0e0" stroke="#000"/>
    <polygon points="10,2 2,9 18,9" fill="#b03030" stroke="#000"/>
    <rect x="8" y="12" width="4" height="5" fill="#684828" stroke="#000"/></svg>`,
  edit: `<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="3" y="3" width="10" height="14" fill="#ffffff" stroke="#000"/>
    <line x1="5" y1="6" x2="11" y2="6" stroke="#9098c0"/>
    <line x1="5" y1="8" x2="11" y2="8" stroke="#9098c0"/>
    <line x1="5" y1="10" x2="9" y2="10" stroke="#9098c0"/>
    <polygon points="16,2 18,4 11,11 9,13 10,10.5" fill="#e8c020" stroke="#000"/></svg>`,
  reload: `<svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M15.5 7 A6 6 0 1 0 16 11.5" fill="none" stroke="#207020" stroke-width="2.5"/>
    <polygon points="13,1.5 19.5,3.5 15,8.5" fill="#207020" stroke="#000" stroke-width="0.5"/></svg>`,
  images: `<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="2" y="3.5" width="16" height="13" fill="#ffffff" stroke="#000"/>
    <circle cx="13.5" cy="7.5" r="1.8" fill="#e8b800" stroke="#000" stroke-width="0.5"/>
    <polygon points="3.5,15.5 8,9 11.5,15.5" fill="#308030" stroke="#000" stroke-width="0.5"/>
    <polygon points="9.5,15.5 13.5,10.5 17,15.5" fill="#1e5c1e" stroke="#000" stroke-width="0.5"/></svg>`,
  open: `<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="5" y="2.5" width="8" height="4.5" fill="#ffffff" stroke="#000"/>
    <polygon points="2,5.5 8,5.5 10,7.5 18,7.5 18,16 2,16" fill="#e0b850" stroke="#000"/>
    <polygon points="4.5,10 18,10 15.5,16 2,16" fill="#f0d080" stroke="#000"/></svg>`,
  print: `<svg viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true">
    <rect x="6" y="2" width="8" height="5" fill="#ffffff" stroke="#000"/>
    <rect x="3" y="7" width="14" height="6" fill="#a8a8c0" stroke="#000"/>
    <circle cx="15" cy="9" r="0.9" fill="#30a030"/>
    <rect x="5.5" y="11.5" width="9" height="6" fill="#ffffff" stroke="#000"/>
    <line x1="7" y1="14" x2="13" y2="14" stroke="#8890b8"/>
    <line x1="7" y1="15.5" x2="13" y2="15.5" stroke="#8890b8"/></svg>`,
  find: `<svg viewBox="0 0 20 20" aria-hidden="true">
    <rect x="8.5" y="6" width="3" height="3.5" fill="#38406e" stroke="#000"/>
    <rect x="4.5" y="4" width="4.5" height="7" fill="#38406e" stroke="#000"/>
    <rect x="11" y="4" width="4.5" height="7" fill="#38406e" stroke="#000"/>
    <circle cx="6.75" cy="13" r="3.4" fill="#505c94" stroke="#000"/>
    <circle cx="13.25" cy="13" r="3.4" fill="#505c94" stroke="#000"/>
    <circle cx="6.75" cy="13" r="1.4" fill="#b8c4e8"/>
    <circle cx="13.25" cy="13" r="1.4" fill="#b8c4e8"/></svg>`,
  stop: `<svg viewBox="0 0 20 20" aria-hidden="true">
    <polygon points="6.3,2 13.7,2 18,6.3 18,13.7 13.7,18 6.3,18 2,13.7 2,6.3" fill="#c83030" stroke="#000"/>
    <text x="10" y="11.8" text-anchor="middle" font-size="4.2" font-family="Helvetica,Arial,sans-serif" font-weight="bold" fill="#fff">STOP</text></svg>`,
};

function launchX() {
  const inputLine = document.getElementById("input-line");
  inputLine.style.display = "none";

  const pages = netscapePages(state.sections, state.experienceDetail, state.EXP_KEYS);

  const session = document.createElement("div");
  session.id = "x-session";
  session.innerHTML = `<div class="x-desktop">
    <div class="twm-hint">click the desktop for the Twm menu &middot; Ctrl+Alt+Backspace kills X</div>
  </div>`;
  document.body.appendChild(session);
  const desktop = session.querySelector(".x-desktop");

  // ── tiny window manager ──
  let zTop = 10;
  const windows = [];

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function focusWin(win) {
    windows.forEach(w => w.el.classList.remove("focused"));
    win.el.classList.add("focused");
    win.el.style.zIndex = ++zTop;
  }

  function makeWindow({ name, title, x, y, w, h, minW, minH, contentHTML }) {
    const el = document.createElement("div");
    el.className = "twm-win";
    el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
    el.innerHTML = `
      <div class="twm-titlebar">
        <button class="twm-btn twm-iconify" title="Iconify"></button>
        <span class="twm-title">${title}</span>
        <span class="twm-hl"></span>
        <button class="twm-btn twm-resize" title="Resize"></button>
      </div>
      <div class="twm-content">${contentHTML}</div>
    `;
    desktop.appendChild(el);

    const win = { name, el, minW, minH, icon: null };
    windows.push(win);

    el.addEventListener("pointerdown", () => focusWin(win));

    // Drag tracking via document-level listeners — pointer capture on form
    // controls (the resize <button>) is unreliable across browsers.
    function trackDrag(onMove) {
      const move = ev => {
        ev.preventDefault();
        onMove(ev);
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        document.removeEventListener("pointercancel", up);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
      document.addEventListener("pointercancel", up);
    }

    // move: drag the titlebar
    const bar = el.querySelector(".twm-titlebar");
    bar.addEventListener("pointerdown", e => {
      if (e.target.closest(".twm-btn")) return;
      e.preventDefault();
      const startX = e.clientX - el.offsetLeft;
      const startY = e.clientY - el.offsetTop;
      trackDrag(ev => {
        el.style.left = clamp(ev.clientX - startX, 8 - el.offsetWidth, desktop.clientWidth - 40) + "px";
        el.style.top = clamp(ev.clientY - startY, 0, desktop.clientHeight - 24) + "px";
      });
    });

    // resize: drag the resize button
    const resizeBtn = el.querySelector(".twm-resize");
    resizeBtn.addEventListener("pointerdown", e => {
      e.preventDefault();
      e.stopPropagation();
      focusWin(win);
      const startW = el.offsetWidth - e.clientX;
      const startH = el.offsetHeight - e.clientY;
      trackDrag(ev => {
        el.style.width = Math.max(win.minW, startW + ev.clientX) + "px";
        el.style.height = Math.max(win.minH, startH + ev.clientY) + "px";
      });
    });

    // iconify: hide window, drop an icon on the root
    el.querySelector(".twm-iconify").addEventListener("click", () => iconify(win));

    return win;
  }

  function iconify(win) {
    win.el.style.display = "none";
    if (win.icon) return;
    const icon = document.createElement("div");
    icon.className = "twm-icon";
    icon.textContent = win.name;
    const slot = windows.filter(w => w.icon).length;
    icon.style.cssText = `left:${14 + slot * 120}px;bottom:14px;`;
    icon.addEventListener("click", () => restore(win));
    desktop.appendChild(icon);
    win.icon = icon;
  }

  function restore(win) {
    if (win.icon) {
      win.icon.remove();
      win.icon = null;
    }
    win.el.style.display = "";
    focusWin(win);
  }

  function destroyWin(win) {
    if (win.icon) {
      win.icon.remove();
      win.icon = null;
    }
    win.el.remove();
    const i = windows.indexOf(win);
    if (i !== -1) windows.splice(i, 1);
  }

  // Raise a window, resurrecting it if it was destroyed via Delete Window —
  // the element and all its wiring survive detached in the closure.
  function reopenWin(win) {
    if (!windows.includes(win)) {
      windows.push(win);
      desktop.appendChild(win.el);
    }
    restore(win);
  }

  const dw = desktop.clientWidth;
  const dh = desktop.clientHeight;

  // ── xclock (launched from the twm menu or an xterm) ──
  let clockWin = null;
  let clockTimer = null;
  function openXclock() {
    if (clockWin) {
      reopenWin(clockWin);
      return;
    }
    clockWin = makeWindow({
      name: "xclock",
      title: "xclock",
      x: Math.max(12, dw - 190),
      y: 16,
      w: 160,
      h: 180,
      minW: 110,
      minH: 120,
      contentHTML: `
        <svg class="xclock-face" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="#c0c0c0" stroke="#000"/>
          ${Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            const x1 = 50 + 41 * Math.sin(a), y1 = 50 - 41 * Math.cos(a);
            const x2 = 50 + 45 * Math.sin(a), y2 = 50 - 45 * Math.cos(a);
            return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#000" stroke-width="2"/>`;
          }).join("")}
          <line class="xclock-hour" x1="50" y1="50" x2="50" y2="28" stroke="#000" stroke-width="3"/>
          <line class="xclock-min"  x1="50" y1="50" x2="50" y2="14" stroke="#000" stroke-width="2"/>
          <line class="xclock-sec"  x1="50" y1="50" x2="50" y2="10" stroke="#800000" stroke-width="1"/>
        </svg>
      `,
    });
    tickClock();
    clockTimer = setInterval(tickClock, 1000);
  }

  function tickClock() {
    const now = new Date();
    const set = (sel, deg) => {
      const hand = clockWin.el.querySelector(sel);
      if (hand) hand.setAttribute("transform", `rotate(${deg} 50 50)`);
    };
    set(".xclock-hour", (now.getHours() % 12) * 30 + now.getMinutes() * 0.5);
    set(".xclock-min", now.getMinutes() * 6);
    set(".xclock-sec", now.getSeconds() * 6);
  }

  // ── xeyes (launched from the twm menu or an xterm) ──
  let eyesWin = null;
  function openXeyes() {
    if (eyesWin) {
      reopenWin(eyesWin);
      return;
    }
    eyesWin = makeWindow({
      name: "xeyes",
      title: "xeyes",
      x: 16,
      y: 16,
      w: 190,
      h: 140,
      minW: 120,
      minH: 96,
      contentHTML: `
        <div class="xeyes">
          ${'<svg class="xeye" viewBox="0 0 100 130" preserveAspectRatio="none"><ellipse cx="50" cy="65" rx="45" ry="60" fill="#ffffff" stroke="#000000" stroke-width="7"/><ellipse class="xeye-pupil" cx="50" cy="65" rx="13" ry="13"/></svg>'.repeat(2)}
        </div>
      `,
    });
  }

  function onEyes(e) {
    if (!eyesWin || eyesWin.el.style.display === "none") return;
    eyesWin.el.querySelectorAll("svg.xeye").forEach(eye => {
      const r = eye.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const pupil = eye.querySelector(".xeye-pupil");
      // cursor position in viewBox coordinates; pupil clamped to an
      // ellipse inside the eye outline (real xeyes behavior)
      let dx = ((e.clientX - r.left) * 100) / r.width - 50;
      let dy = ((e.clientY - r.top) * 130) / r.height - 65;
      const RX = 29, RY = 44;
      const d = Math.sqrt((dx / RX) ** 2 + (dy / RY) ** 2);
      if (d > 1) {
        dx /= d;
        dy /= d;
      }
      pupil.setAttribute("cx", (50 + dx).toFixed(1));
      pupil.setAttribute("cy", (65 + dy).toFixed(1));
    });
  }
  session.addEventListener("pointermove", onEyes);

  // ── xload (launched from the twm menu or an xterm) ──
  // The classic strip chart. The "load" is theater, but honest theater:
  // it tracks how many windows the session has open, so killing windows
  // visibly calms the machine down.
  let loadWin = null;
  let loadTimer = null;
  function openXload() {
    if (loadWin) {
      reopenWin(loadWin);
      return;
    }
    loadWin = makeWindow({
      name: "xload",
      title: "xload",
      x: 16,
      y: 180,
      w: 210,
      h: 130,
      minW: 140,
      minH: 90,
      contentHTML: `
        <div class="xload">
          <span class="xload-label">bnied.dev</span>
          <canvas class="xload-canvas"></canvas>
        </div>
      `,
    });
    const canvas = loadWin.el.querySelector(".xload-canvas");
    const label = loadWin.el.querySelector(".xload-label");
    const samples = [];
    let load = 0.08 + windows.length * 0.14;

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;
      const g = canvas.getContext("2d");
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, w, h);
      const view = samples.slice(-w);
      const units = Math.max(1, Math.ceil(Math.max(...view, 0.01)));
      g.fillStyle = "#000000";
      for (let u = 1; u < units; u++) {
        g.fillRect(0, Math.round(h - (u * h) / units), w, 1);
      }
      view.forEach((v, i) => {
        const y = Math.round(h - (v * h) / units);
        g.fillRect(i, y, 1, h - y);
      });
    }

    function tick() {
      const target = 0.08 + windows.length * 0.14
        + (Math.random() < 0.05 ? Math.random() * 1.2 : 0);
      load += (target - load) * 0.3 + (Math.random() - 0.5) * 0.07;
      load = Math.max(0.02, load);
      samples.push(load);
      if (samples.length > 1024) samples.shift();
      label.textContent = `bnied.dev ${load.toFixed(2)}`;
      draw();
    }

    new ResizeObserver(() => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      draw();
    }).observe(canvas);
    tick();
    loadTimer = setInterval(tick, 1000);
  }

  // ── xcalc (launched from the twm menu or an xterm) ──
  // TI-30 mode, honestly functional: the key logic lives in js/xcalc.js.
  const XCALC_KEYS = [
    ["1/x", "1/x"], ["x²", "sq"], ["√", "sqrt"], ["CE/C", "ce"], ["AC", "ac"],
    ["INV", "inv"], ["sin", "sin"], ["cos", "cos"], ["tan", "tan"], ["DRG", "drg"],
    ["e", "e"], ["EE", "ee"], ["log", "log"], ["ln", "ln"], ["yˣ", "pow"],
    ["π", "pi"], ["x!", "fact"], ["(", "("], [")", ")"], ["÷", "/"],
    ["STO", "sto"], ["7", "7"], ["8", "8"], ["9", "9"], ["×", "*"],
    ["RCL", "rcl"], ["4", "4"], ["5", "5"], ["6", "6"], ["−", "-"],
    ["SUM", "sum"], ["1", "1"], ["2", "2"], ["3", "3"], ["+", "+"],
    ["EXC", "exc"], ["0", "0"], [".", "."], ["+/-", "+/-"], ["=", "="],
  ];
  let calcWin = null;
  function openXcalc() {
    if (calcWin) {
      reopenWin(calcWin);
      return;
    }
    let calc = xcalcInit();
    calcWin = makeWindow({
      name: "xcalc",
      title: "Calculator",
      x: Math.max(16, dw - 270),
      y: Math.min(220, Math.max(16, dh - 400)),
      w: 240,
      h: 340,
      minW: 210,
      minH: 300,
      contentHTML: `
        <div class="xcalc">
          <div class="xcalc-display">
            <span class="xcalc-ind">DEG</span>
            <span class="xcalc-val">0</span>
          </div>
          <div class="xcalc-keys">
            ${XCALC_KEYS.map(([label, key]) =>
              `<button class="xcalc-btn" data-k="${key}">${label}</button>`).join("")}
          </div>
        </div>
      `,
    });
    const val = calcWin.el.querySelector(".xcalc-val");
    const ind = calcWin.el.querySelector(".xcalc-ind");
    calcWin.el.querySelector(".xcalc-keys").addEventListener("click", e => {
      e.stopPropagation();
      const btn = e.target.closest(".xcalc-btn");
      if (!btn) return;
      calc = xcalcPress(calc, btn.dataset.k);
      val.textContent = calc.display;
      ind.textContent = `${calc.drg}${calc.inv ? " INV" : ""}${calc.memSet ? " M" : ""}`;
    });
  }

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
        if (app === "xeyes") openXeyes();
        else if (app === "xclock") openXclock();
        else if (app === "xload") openXload();
        else if (app === "xcalc") openXcalc();
        else reopenWin(nsWin);
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
      closeMenu();
      closeNsMenu();
      if (String(getSelection())) return;
      input.focus();
    });

    input.focus();
    return win;
  }

  // ── Netscape ──
  const toolBtn = (act, label, gap) =>
    `<button class="ns-btn${gap ? " ns-gap" : ""}" data-act="${act}">${NS_ICONS[act]}<span>${label}</span></button>`;

  const nsW = Math.min(920, dw - 40);
  const nsH = Math.min(660, dh - 60);
  const nsWin = makeWindow({
    name: "Netscape",
    title: "Netscape: Welcome to bnied.dev",
    x: clamp(Math.round((dw - nsW) / 2) - 40, 8, 120),
    y: clamp(Math.round((dh - nsH) / 2), 10, 90),
    w: nsW,
    h: nsH,
    minW: 460,
    minH: 340,
    contentHTML: `
      <div class="netscape">
        <div class="ns-menubar">
          <span class="ns-menu" data-menu="file"><u>F</u>ile</span>
          <span class="ns-menu" data-menu="edit"><u>E</u>dit</span>
          <span class="ns-menu" data-menu="view"><u>V</u>iew</span>
          <span class="ns-menu" data-menu="go"><u>G</u>o</span>
          <span class="ns-menu" data-menu="bookmarks"><u>B</u>ookmarks</span>
          <span class="ns-menu" data-menu="options"><u>O</u>ptions</span>
          <span class="ns-menu" data-menu="directory"><u>D</u>irectory</span>
          <span class="ns-menu" data-menu="window"><u>W</u>indow</span>
          <span class="ns-menu" data-menu="help"><u>H</u>elp</span>
        </div>
        <div class="ns-toolbar">
          ${toolBtn("back", "Back")}${toolBtn("fwd", "Forward")}${toolBtn("home", "Home", true)}${toolBtn("edit", "Edit", true)}${toolBtn("reload", "Reload", true)}${toolBtn("images", "Images")}${toolBtn("open", "Open", true)}${toolBtn("print", "Print", true)}${toolBtn("find", "Find")}${toolBtn("stop", "Stop", true)}
        </div>
        <div class="ns-midrow">
          <div class="ns-midleft">
            <div class="ns-locrow">
              <span class="ns-locicon"><svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="6" width="7" height="4" rx="2" fill="none" stroke="#333" stroke-width="1.5"/><rect x="7.5" y="6" width="7" height="4" rx="2" fill="none" stroke="#333" stroke-width="1.5"/></svg></span>
              <span class="ns-loclabel">Location:</span>
              <span class="ns-combo">
                <input class="ns-location" type="text" value="http://bnied.dev/index.html" spellcheck="false">
                <button class="ns-combo-arrow" data-act="urllist" title="Visited locations">&#9660;</button>
              </span>
            </div>
            <div class="ns-dirrow">
              <button class="ns-dirbtn" data-page="about">About Me</button>
              <button class="ns-dirbtn" data-page="skills">Skills</button>
              <button class="ns-dirbtn" data-page="experience">Experience</button>
              <button class="ns-dirbtn" data-page="projects">Projects</button>
              <button class="ns-dirbtn" data-page="education">Education</button>
              <button class="ns-dirbtn" data-page="contact">Contact</button>
            </div>
          </div>
          <div class="ns-throbber" title="Netscape Communications">
            <span class="ns-star s1"></span><span class="ns-star s2"></span><span class="ns-star s3"></span><span class="ns-star s4"></span>
            <span class="ns-shooting"></span>
            <span class="ns-n">N</span>
            <span class="ns-horizon"></span>
          </div>
        </div>
        <div class="ns-content"></div>
        <div class="ns-status">
          <span class="ns-key" title="Insecure connection">&#9911;</span>
          <span class="ns-status-text">Document: Done.</span>
          <span class="ns-progress"><span class="ns-progress-fill"></span></span>
          <span class="ns-mail" title="You have no new mail">&#9993;</span>
        </div>
      </div>
    `,
  });

  const el = {
    title: nsWin.el.querySelector(".twm-title"),
    content: nsWin.el.querySelector(".ns-content"),
    location: nsWin.el.querySelector(".ns-location"),
    loclabel: nsWin.el.querySelector(".ns-loclabel"),
    statusText: nsWin.el.querySelector(".ns-status-text"),
    progressFill: nsWin.el.querySelector(".ns-progress-fill"),
    throbber: nsWin.el.querySelector(".ns-throbber"),
    toolbar: nsWin.el.querySelector(".ns-toolbar"),
    locrow: nsWin.el.querySelector(".ns-locrow"),
    dirrow: nsWin.el.querySelector(".ns-dirrow"),
  };
  const tbBtn = {};
  nsWin.el.querySelectorAll(".ns-btn[data-act]").forEach(b => { tbBtn[b.dataset.act] = b; });
  focusWin(nsWin);

  // ── browser state ──
  const history = [];
  let historyPos = -1;
  let progressTimer = null;
  let loading = false;
  const prefs = { toolbar: true, location: true, directory: true, autoImages: true };

  function updateNav() {
    tbBtn.back.classList.toggle("disabled", historyPos <= 0);
    tbBtn.fwd.classList.toggle("disabled", historyPos >= history.length - 1);
    tbBtn.images.classList.toggle("disabled", prefs.autoImages);
    tbBtn.stop.classList.toggle("disabled", !loading);
  }

  function setLoading(v) {
    loading = v;
    el.throbber.classList.toggle("ns-loading", v);
    updateNav();
  }

  function togglePref(k) {
    prefs[k] = !prefs[k];
    el.toolbar.style.display = prefs.toolbar ? "" : "none";
    el.locrow.style.display = prefs.location ? "" : "none";
    el.dirrow.style.display = prefs.directory ? "" : "none";
    updateNav();
  }

  function render(key) {
    const page = pages[key] || pages.home;
    el.content.innerHTML = page.html;
    // real links (sourcetube, github, ...) escape the fake browser into a new tab
    el.content.querySelectorAll("a[href]:not([data-page])").forEach(a => {
      a.target = "_blank";
      a.rel = "noopener";
    });
    el.content.scrollTop = 0;
    el.location.value = page.url;
    el.loclabel.textContent = "Location:";
    el.title.textContent = `Netscape: ${page.title}`;

    clearTimeout(progressTimer);
    if (REDUCED()) {
      el.statusText.textContent = "Document: Done.";
      el.progressFill.style.width = "0%";
      setLoading(false);
    } else {
      setLoading(true);
      el.statusText.textContent = "Connect: Host bnied.dev contacted. Waiting for reply...";
      el.progressFill.style.width = "70%";
      progressTimer = setTimeout(() => {
        el.progressFill.style.width = "100%";
        el.statusText.textContent = "Document: Done.";
        setLoading(false);
        progressTimer = setTimeout(() => { el.progressFill.style.width = "0%"; }, 250);
      }, 350);
    }
    updateNav();
  }

  function navigate(key) {
    history.splice(historyPos + 1);
    history.push(key);
    historyPos = history.length - 1;
    render(key);
  }

  const actions = {
    back() {
      if (historyPos > 0) render(history[--historyPos]);
    },
    fwd() {
      if (historyPos < history.length - 1) render(history[++historyPos]);
    },
    home() {
      navigate("home");
    },
    reload() {
      render(history[historyPos]);
    },
    images() {
      el.statusText.textContent = "All 0 images loaded. That was easy.";
    },
    edit() {
      showDialog("Edit Document", "This page was hand-authored in vi.\nThe Gold editor bows out respectfully.");
    },
    open() {
      openLocation();
    },
    print() {
      showDialog("Print", "No printers configured.\n(This is a website inside a website.)");
    },
    find() {
      showDialog("Find", "grep works better. Quit X and try it.");
    },
    stop() {
      if (!loading) return;
      clearTimeout(progressTimer);
      el.progressFill.style.width = "0%";
      el.statusText.textContent = "Transfer interrupted!";
      setLoading(false);
    },
    urllist(btn) {
      const cur = history[historyPos];
      const items = [...new Set(history)].map(k => ({
        label: (pages[k] || pages.home).url,
        checked: k === cur,
        action: () => { if (k !== cur) navigate(k); },
      }));
      const fieldRect = el.location.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      openDropdown(items, fieldRect.left, btnRect.bottom + 1, Math.round(fieldRect.width + btnRect.width));
    },
  };

  // ── Motif-style modal dialog ──
  function showDialog(title, body) {
    const dlg = document.createElement("div");
    dlg.className = "motif-dialog";
    dlg.innerHTML = `
      <div class="motif-dialog-title">${title}</div>
      <div class="motif-dialog-body">${body.replace(/\n/g, "<br>")}</div>
      <div class="motif-dialog-btns"><button class="ns-push motif-ok">OK</button></div>
    `;
    desktop.appendChild(dlg);
    dlg.querySelector(".motif-ok").addEventListener("click", () => dlg.remove());
  }

  function openLocation() {
    closeNsMenu();
    const dlg = document.createElement("div");
    dlg.className = "motif-dialog";
    dlg.innerHTML = `
      <div class="motif-dialog-title">Open Location</div>
      <div class="motif-dialog-body">
        <p>Enter the World Wide Web location (URL) to open:</p>
        <input class="ns-openloc-input" type="text" value="http://bnied.dev/" spellcheck="false">
      </div>
      <div class="motif-dialog-btns">
        <button class="ns-push ns-openloc-go">Open</button>
        <button class="ns-push ns-openloc-cancel">Cancel</button>
      </div>
    `;
    desktop.appendChild(dlg);
    // keep clicks from bubbling to the terminal's focus-stealing handler
    dlg.addEventListener("click", e => e.stopPropagation());
    const input = dlg.querySelector("input");
    const go = () => {
      const raw = input.value;
      dlg.remove();
      gotoLocation(raw);
    };
    dlg.querySelector(".ns-openloc-go").addEventListener("click", go);
    dlg.querySelector(".ns-openloc-cancel").addEventListener("click", () => dlg.remove());
    input.addEventListener("keydown", e => {
      e.stopPropagation();
      if (e.key === "Enter") go();
      else if (e.key === "Escape") dlg.remove();
    });
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  // Shared by the Open Location dialog and the location bar. Returns true if
  // the URL resolved to a page, false if it ended in a period-correct dialog.
  function gotoLocation(raw) {
    const key = resolveLocation(raw);
    if (key === null) {
      const host = raw.trim().replace(/^https?:\/\//, "").split("/")[0] || raw.trim();
      showDialog("Netscape", `Netscape is unable to locate the server:\n&nbsp;&nbsp;${escHtml(host)}\nThe server does not have a DNS entry.`);
      return false;
    }
    if (key.startsWith("404:")) {
      showDialog("404 Not Found", `The requested URL /${escHtml(key.slice(4))} was not\nfound on this server.`);
      return false;
    }
    navigate(key);
    return true;
  }

  function resolveLocation(raw) {
    let v = raw.trim().toLowerCase();
    if (!v) return null;
    if (v === "about:" || v === "about:netscape") return "aboutns";
    v = v.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (v === "bnied.dev" || v === "www.bnied.dev") return "home";
    const m = v.match(/^(?:www\.)?bnied\.dev\/(.+)$/);
    if (!m) return null;
    const path = m[1].replace(/\.html?$/, "");
    if (path === "index") return "home";
    if (pages[path] && path !== "aboutns") return path;
    return "404:" + m[1];
  }

  // ── editable location bar ──
  // Netscape 3.x swapped "Location:" for "Go to:" while the URL was edited,
  // flipping back once a page loaded (render() resets the label).
  function resetLocation() {
    const page = pages[history[historyPos]] || pages.home;
    el.location.value = page.url;
    el.loclabel.textContent = "Location:";
  }
  el.location.addEventListener("input", () => {
    el.loclabel.textContent = "Go to:";
  });
  // keep clicks from reaching the terminal's click-to-focus handler
  el.location.addEventListener("click", e => {
    e.stopPropagation();
    closeNsMenu();
  });
  el.location.addEventListener("blur", resetLocation);
  el.location.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.key === "Enter") {
      if (gotoLocation(el.location.value)) el.location.blur();
    } else if (e.key === "Escape") {
      resetLocation();
      el.location.blur();
    }
  });

  let srcWin = null;
  function viewSource() {
    const page = pages[history[historyPos]] || pages.home;
    const body = `<pre class="ns-source">${escHtml(page.html)}</pre>`;
    const title = `Netscape: Source of ${page.url}`;
    if (srcWin) {
      srcWin.el.querySelector(".twm-content").innerHTML = body;
      srcWin.el.querySelector(".twm-title").textContent = title;
      reopenWin(srcWin);
    } else {
      srcWin = makeWindow({
        name: "view-source",
        title,
        x: Math.max(20, Math.round(dw * 0.18)),
        y: 60,
        w: Math.min(560, dw - 80),
        h: Math.min(420, dh - 90),
        minW: 260,
        minH: 160,
        contentHTML: body,
      });
      focusWin(srcWin);
    }
  }

  function docInfo() {
    const page = pages[history[historyPos]] || pages.home;
    showDialog(
      "Document Info",
      `${page.title}\n${page.url}\n\nEncoding: ISO-8859-1\nSecurity: this document was not encrypted.\nNothing was, in 1996.`
    );
  }

  function showHistoryDialog() {
    const lines = [];
    for (let i = history.length - 1; i >= 0; i--) {
      const p = pages[history[i]] || pages.home;
      lines.push(`${i === historyPos ? "&gt;" : "&nbsp;"} ${p.title} &mdash; ${p.url}`);
    }
    showDialog("History", lines.join("\n"));
  }

  function copyLocation() {
    const url = el.location.value;
    const gag = () => {
      el.statusText.textContent = "Copied to the X primary selection. Middle-click to paste. (Not really.)";
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => { el.statusText.textContent = `Copied ${url} to the clipboard.`; },
        gag
      );
    } else {
      gag();
    }
  }

  // ── menu bar ──
  const nsMenus = {
    file: () => [
      { label: "New Web Browser", key: "Alt+N", action: () => showDialog("New Web Browser", "This copy of Netscape is licensed\nfor one (1) window at a time.") },
      { label: "New Mail Message", key: "Alt+M", disabled: true },
      { sep: true },
      { label: "Open Location...", key: "Alt+L", action: openLocation },
      { label: "Open File...", disabled: true },
      { label: "Save As...", key: "Alt+S", action: () => showDialog("Save As", "index.html saved to /dev/null.\n3K freed.") },
      { sep: true },
      { label: "Print...", action: actions.print },
      { sep: true },
      { label: "Close", key: "Alt+W", action: () => iconify(nsWin) },
      { label: "Exit", key: "Alt+Q", action: () => cleanup() },
    ],
    edit: () => [
      { label: "Undo", key: "Alt+Z", disabled: true },
      { sep: true },
      { label: "Cut", key: "Alt+X", disabled: true },
      { label: "Copy", key: "Alt+C", action: copyLocation },
      { label: "Paste", key: "Alt+V", disabled: true },
      { sep: true },
      { label: "Find...", key: "Alt+F", action: actions.find },
      { label: "Find Again", key: "Alt+G", disabled: true },
    ],
    view: () => [
      { label: "Reload", key: "Alt+R", action: actions.reload },
      { label: "Reload Frame", disabled: true },
      { label: "Load Images", key: "Alt+I", disabled: prefs.autoImages, action: actions.images },
      { sep: true },
      { label: "Document Source", action: viewSource },
      { label: "Document Info", action: docInfo },
    ],
    go: () => {
      const items = [
        { label: "Back", key: "Alt+Left", disabled: historyPos <= 0, action: actions.back },
        { label: "Forward", key: "Alt+Right", disabled: historyPos >= history.length - 1, action: actions.fwd },
        { label: "Home", action: actions.home },
        { sep: true },
      ];
      for (let i = history.length - 1; i >= 0; i--) {
        const k = history[i], idx = i;
        items.push({
          label: (pages[k] || pages.home).title,
          checked: i === historyPos,
          action: () => { historyPos = idx; render(k); },
        });
      }
      return items;
    },
    bookmarks: () => [
      { label: "Add Bookmark", key: "Alt+A", action: () => showDialog("Bookmarks", "Bookmark written to ~/.netscape/bookmarks.html\non a floppy disk you will never find again.") },
      { sep: true },
      ...["home", "about", "skills", "experience", "projects", "education", "contact"].map(k => ({
        label: pages[k].title,
        checked: history[historyPos] === k,
        action: () => navigate(k),
      })),
      { sep: true },
      { label: "SourceTube: spaceduck", action: () => window.open("https://source.tube/spaceduck", "_blank", "noopener") },
    ],
    options: () => [
      { label: "General Preferences...", action: () => showDialog("Preferences", "Fonts: fixed.\nColors: gray.\nThese are the correct settings\nand cannot be improved.") },
      { sep: true },
      { label: "Show Toolbar", checked: prefs.toolbar, action: () => togglePref("toolbar") },
      { label: "Show Location", checked: prefs.location, action: () => togglePref("location") },
      { label: "Show Directory Buttons", checked: prefs.directory, action: () => togglePref("directory") },
      { label: "Auto Load Images", checked: prefs.autoImages, action: () => togglePref("autoImages") },
      { sep: true },
      { label: "Save Options", action: () => { el.statusText.textContent = "Options saved to ~/.netscape/preferences."; } },
    ],
    directory: () => [
      { label: "Netscape's Home", action: () => navigate("home") },
      { label: "What's New?", action: () => navigate("projects") },
      { label: "What's Cool?", action: () => navigate("skills") },
      { sep: true },
      { label: "Net Search", action: () => showDialog("Net Search", "AltaVista timed out.\nQuit X and use grep instead.") },
      { label: "People", action: () => navigate("about") },
      { label: "Software", action: () => navigate("projects") },
    ],
    window: () => [
      { label: "Netscape Mail", action: () => showDialog("Netscape Mail", "You have no new mail.\nYou have never had mail here.") },
      { label: "Address Book", disabled: true },
      { label: "History", action: showHistoryDialog },
      { sep: true },
      ...windows.map((w, i) => ({
        label: `${i + 1}  ${w.name}`,
        checked: w.el.classList.contains("focused") && w.el.style.display !== "none",
        action: () => restore(w),
      })),
    ],
    help: () => [
      { label: "About Netscape", action: () => navigate("aboutns") },
      { label: "Release Notes", action: () => showDialog("Release Notes", "3.04Gold (SPACEDUCK build)\n&mdash; The &lt;blink&gt; tag now blinks harder.\n&mdash; Java support removed. You're welcome.") },
      { sep: true },
      { label: "On Security", action: () => showDialog("On Security", "This connection is not encrypted.\nNeither was anything else in 1996.") },
    ],
  };

  let nsMenuEl = null;
  let nsMenuName = null;

  function closeNsMenu() {
    if (nsMenuEl) nsMenuEl.remove();
    nsMenuEl = null;
    nsMenuName = null;
    nsWin.el.querySelectorAll(".ns-menu.open").forEach(m => m.classList.remove("open"));
  }

  function openDropdown(items, x, y, minWidth) {
    closeNsMenu();
    const dd = document.createElement("div");
    dd.className = "ns-dropdown";
    if (minWidth) dd.style.minWidth = minWidth + "px";
    dd.innerHTML = items.map((it, i) => it.sep
      ? '<div class="ns-dd-sep"></div>'
      : `<div class="ns-dd-item${it.disabled ? " disabled" : ""}" data-i="${i}">
           <span class="ns-dd-check">${it.checked ? "&#10003;" : ""}</span>
           <span class="ns-dd-label">${it.label}</span>
           <span class="ns-dd-key">${it.key || ""}</span>
         </div>`).join("");
    dd.addEventListener("click", e => {
      e.stopPropagation();
      const row = e.target.closest(".ns-dd-item");
      if (!row || row.classList.contains("disabled")) return;
      const it = items[+row.dataset.i];
      closeNsMenu();
      if (it.action) it.action();
    });
    desktop.appendChild(dd);
    dd.style.left = clamp(x, 0, desktop.clientWidth - dd.offsetWidth - 2) + "px";
    dd.style.top = clamp(y, 0, desktop.clientHeight - dd.offsetHeight - 2) + "px";
    nsMenuEl = dd;
  }

  const menubar = nsWin.el.querySelector(".ns-menubar");
  function openNsMenuFor(span) {
    const name = span.dataset.menu;
    const r = span.getBoundingClientRect();
    openDropdown(nsMenus[name](), r.left, r.bottom);
    span.classList.add("open");
    nsMenuName = name;
  }
  menubar.addEventListener("click", e => {
    e.stopPropagation();
    const span = e.target.closest(".ns-menu");
    if (!span) return;
    if (nsMenuName === span.dataset.menu) closeNsMenu();
    else openNsMenuFor(span);
  });
  menubar.addEventListener("pointerover", e => {
    const span = e.target.closest(".ns-menu");
    if (span && nsMenuName && nsMenuName !== span.dataset.menu) openNsMenuFor(span);
  });

  navigate("home");

  // ── twm root menu ──
  let menu = null;
  function closeMenu() {
    if (menu) {
      menu.remove();
      menu = null;
    }
  }
  function openMenu(x, y) {
    closeMenu();
    menu = document.createElement("div");
    menu.className = "twm-menu";
    menu.innerHTML = `
      <div class="twm-menu-title">Twm</div>
      <div class="twm-menu-item" data-mi="xterm">xterm</div>
      <div class="twm-menu-item" data-mi="netscape">Netscape</div>
      <div class="twm-menu-item" data-mi="xclock">xclock</div>
      <div class="twm-menu-item" data-mi="xeyes">xeyes</div>
      <div class="twm-menu-item" data-mi="xload">xload</div>
      <div class="twm-menu-item" data-mi="xcalc">xcalc</div>
      <div class="twm-menu-item" data-mi="refresh">Refresh</div>
      <div class="twm-menu-item" data-mi="delete">Delete Window</div>
      <div class="twm-menu-sep"></div>
      <div class="twm-menu-item" data-mi="restart">Restart</div>
      <div class="twm-menu-item" data-mi="exit">Exit</div>
    `;
    desktop.appendChild(menu);
    menu.style.left = clamp(x, 0, desktop.clientWidth - menu.offsetWidth - 2) + "px";
    menu.style.top = clamp(y, 0, desktop.clientHeight - menu.offsetHeight - 2) + "px";
  }

  function flashRoot(color, ms) {
    const flash = document.createElement("div");
    flash.style.cssText = `position:absolute;inset:0;z-index:99999;background:${color};`;
    desktop.appendChild(flash);
    setTimeout(() => flash.remove(), ms);
  }

  const menuActions = {
    xterm: () => spawnXterm(),
    netscape: () => reopenWin(nsWin),
    xclock: openXclock,
    xeyes: openXeyes,
    xload: openXload,
    xcalc: openXcalc,
    refresh: () => flashRoot("#ffffff", REDUCED() ? 0 : 90),
    delete: () => setDeleteMode(true),
    restart: () => flashRoot("#000000", REDUCED() ? 0 : 250),
    exit: () => cleanup(),
  };

  // ── f.delete: the twm way to close a window ──
  // "Delete Window" arms the pirate cursor; the next click kills the window
  // (or icon) under it. Clicking the root desktop — or Esc — disarms it.
  let deleteMode = false;
  function setDeleteMode(v) {
    deleteMode = v;
    session.classList.toggle("x-delete", v);
  }
  function onDeleteClick(e) {
    if (!deleteMode) return;
    // capture phase, so this wins over every widget's own click handler
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    closeNsMenu();
    const winEl = e.target.closest(".twm-win");
    const iconEl = e.target.closest(".twm-icon");
    const win = winEl ? windows.find(w => w.el === winEl)
      : iconEl ? windows.find(w => w.icon === iconEl) : null;
    if (win) destroyWin(win);
    setDeleteMode(false);
  }
  session.addEventListener("click", onDeleteClick, true);

  // ── event wiring ──
  function onClick(e) {
    const item = e.target.closest(".twm-menu-item");
    if (item) {
      const act = menuActions[item.dataset.mi];
      closeMenu();
      act();
      return;
    }
    if (e.target === desktop || e.target.classList.contains("twm-hint")) {
      closeNsMenu();
      openMenu(e.clientX, e.clientY);
      return;
    }
    closeMenu();
    closeNsMenu();

    const btn = e.target.closest("[data-act]");
    if (btn) {
      if (btn.classList.contains("disabled")) return;
      actions[btn.dataset.act](btn);
      return;
    }
    const nav = e.target.closest("[data-page]");
    if (nav) {
      e.preventDefault();
      navigate(nav.dataset.page);
    }
  }
  session.addEventListener("click", onClick);
  desktop.addEventListener("contextmenu", e => {
    if (e.target === desktop) {
      e.preventDefault();
      openMenu(e.clientX, e.clientY);
    }
  });

  function onKey(e) {
    // the classic X server zap — the only keyboard way out, as is proper
    if (e.key === "Backspace" && e.ctrlKey && e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      cleanup();
      return;
    }
    if (e.key !== "Escape") return;
    // editing the location bar or typing in an xterm: their own handlers
    // cancel the edit / blur the input instead
    if (e.target === el.location || e.target.classList.contains("xterm-input")) return;
    e.preventDefault();
    e.stopPropagation();
    if (deleteMode) {
      setDeleteMode(false);
      return;
    }
    if (nsMenuEl) {
      closeNsMenu();
      return;
    }
    if (menu) {
      closeMenu();
      return;
    }
    const dlg = desktop.querySelector(".motif-dialog");
    if (dlg) dlg.remove();
  }
  document.addEventListener("keydown", onKey, true);

  function cleanup() {
    document.removeEventListener("keydown", onKey, true);
    clearInterval(clockTimer);
    clearInterval(loadTimer);
    clearTimeout(progressTimer);
    session.remove();
    addLine("  xinit: connection to X server lost", "line-comment", true);
    addLine("  waiting for X server to shut down... done.", "line-comment", true);
    addLine("", null, false);
    inputLine.style.display = "flex";
    cmdInput.focus();
    scrollToBottom();
  }
}
