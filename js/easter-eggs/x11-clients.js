// x11-clients.js — the little X clients on the twm root menu: xclock, xeyes,
// xload and xcalc. Each is a singleton that raises its existing window rather
// than opening a second one, matching how they behave from a real root menu.
// The window plumbing comes from x11-wm.js; xcalc's key logic from js/xcalc.js.

import { xcalcInit, xcalcPress } from "../xcalc.js";

export function createClients({ wm, session, dw, dh }) {
  const { windows, makeWindow, reopenWin } = wm;

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
  return {
    openXclock,
    openXeyes,
    openXload,
    openXcalc,
    // The session owns the pointermove listener xeyes tracks, and both the
    // clock and the load chart run on intervals — all three outlive their
    // windows, so the session has to stop them when X goes down.
    destroy() {
      clearInterval(clockTimer);
      clearInterval(loadTimer);
      session.removeEventListener("pointermove", onEyes);
    },
  };
}
