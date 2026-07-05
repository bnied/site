// startx easter egg — boots a fake X11 session running twm: floating
// windows with teal focused titlebars, draggable/resizable/iconifiable,
// a root menu on the desktop, an xclock, and a pre-4.0 Netscape Navigator
// (Motif widgets, bitmap type) browsing a graphical rendition of this
// site. Esc or root menu > Exit quits back to the terminal.
// Styling lives in css/style.css under "X11 SESSION".

import { cmdInput } from "../dom.js";
import { addLine, scrollToBottom } from "../render.js";
import { state } from "../state.js";
import { netscapePages } from "../netscape-html.js";

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

function launchX() {
  const inputLine = document.getElementById("input-line");
  inputLine.style.display = "none";

  const pages = netscapePages(state.sections, state.experienceDetail, state.EXP_KEYS);

  const session = document.createElement("div");
  session.id = "x-session";
  session.innerHTML = `<div class="x-desktop">
    <div class="twm-hint">click the desktop for the Twm menu &middot; Esc quits</div>
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

  // ── xclock ──
  const dw = desktop.clientWidth;
  const dh = desktop.clientHeight;
  const clockWin = makeWindow({
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
  tickClock();
  const clockTimer = setInterval(tickClock, 1000);

  // ── xeyes ──
  const eyesWin = makeWindow({
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

  function onEyes(e) {
    if (eyesWin.el.style.display === "none") return;
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

  // ── Netscape ──
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
          <span class="ns-menu">File</span><span class="ns-menu">Edit</span><span class="ns-menu">View</span><span class="ns-menu">Go</span><span class="ns-menu">Bookmarks</span><span class="ns-menu">Options</span><span class="ns-menu">Directory</span><span class="ns-menu">Window</span><span class="ns-menu ns-menu-help">Help</span>
        </div>
        <div class="ns-toolbar">
          <button class="ns-btn" data-act="back"><span class="ns-ico">&#9664;</span>Back</button>
          <button class="ns-btn" data-act="fwd"><span class="ns-ico">&#9654;</span>Forward</button>
          <button class="ns-btn" data-act="home"><span class="ns-ico">&#8962;</span>Home</button>
          <button class="ns-btn" data-act="reload"><span class="ns-ico">&#8635;</span>Reload</button>
          <button class="ns-btn" data-act="images"><span class="ns-ico">&#9635;</span>Images</button>
          <button class="ns-btn" data-act="print"><span class="ns-ico">&#9113;</span>Print</button>
          <button class="ns-btn" data-act="find"><span class="ns-ico">&#9906;</span>Find</button>
          <button class="ns-btn" data-act="stop"><span class="ns-ico ns-ico-stop">&#9679;</span>Stop</button>
          <span class="ns-throbber"><span class="ns-star s1"></span><span class="ns-star s2"></span><span class="ns-star s3"></span>N</span>
        </div>
        <div class="ns-locrow">
          <span class="ns-loclabel">Location:</span>
          <input class="ns-location" type="text" readonly value="http://bnied.dev/index.html">
        </div>
        <div class="ns-dirrow">
          <button class="ns-dirbtn" data-page="about">About Me</button>
          <button class="ns-dirbtn" data-page="skills">Skills</button>
          <button class="ns-dirbtn" data-page="experience">Experience</button>
          <button class="ns-dirbtn" data-page="projects">Projects</button>
          <button class="ns-dirbtn" data-page="education">Education</button>
          <button class="ns-dirbtn" data-page="contact">Contact</button>
        </div>
        <div class="ns-content"></div>
        <div class="ns-status">
          <span class="ns-key" title="Insecure connection">&#9911;</span>
          <span class="ns-progress"><span class="ns-progress-fill"></span></span>
          <span class="ns-status-text">Document: Done.</span>
        </div>
      </div>
    `,
  });

  const el = {
    title: nsWin.el.querySelector(".twm-title"),
    content: nsWin.el.querySelector(".ns-content"),
    location: nsWin.el.querySelector(".ns-location"),
    statusText: nsWin.el.querySelector(".ns-status-text"),
    progressFill: nsWin.el.querySelector(".ns-progress-fill"),
  };
  focusWin(nsWin);

  // ── navigation with real Back/Forward history ──
  const history = [];
  let historyPos = -1;
  let progressTimer = null;

  function render(key) {
    const page = pages[key] || pages.home;
    el.content.innerHTML = page.html;
    // real links (codeberg, github, ...) escape the fake browser into a new tab
    el.content.querySelectorAll("a[href]:not([data-page])").forEach(a => {
      a.target = "_blank";
      a.rel = "noopener";
    });
    el.content.scrollTop = 0;
    el.location.value = page.url;
    el.title.textContent = `Netscape: ${page.title}`;

    clearTimeout(progressTimer);
    if (REDUCED()) {
      el.statusText.textContent = "Document: Done.";
      el.progressFill.style.width = "0%";
    } else {
      el.statusText.textContent = "Connect: Host bnied.dev contacted. Waiting for reply...";
      el.progressFill.style.width = "70%";
      progressTimer = setTimeout(() => {
        el.progressFill.style.width = "100%";
        el.statusText.textContent = "Document: Done.";
        progressTimer = setTimeout(() => { el.progressFill.style.width = "0%"; }, 250);
      }, 350);
    }
  }

  function navigate(key) {
    history.splice(historyPos + 1);
    history.push(key);
    historyPos = history.length - 1;
    render(key);
  }
  navigate("home");

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
    print() {
      showDialog("Print", "No printers configured.\n(This is a website inside a website.)");
    },
    find() {
      showDialog("Find", "grep works better. Quit X and try it.");
    },
    stop() {
      el.statusText.textContent = "Transfer interrupted!";
      el.progressFill.style.width = "0%";
    },
  };

  // ── Motif-style modal dialog ──
  function showDialog(title, body) {
    const dlg = document.createElement("div");
    dlg.className = "motif-dialog";
    dlg.innerHTML = `
      <div class="motif-dialog-title">${title}</div>
      <div class="motif-dialog-body">${body.replace(/\n/g, "<br>")}</div>
      <div class="motif-dialog-btns"><button class="ns-btn motif-ok">OK</button></div>
    `;
    desktop.appendChild(dlg);
    dlg.querySelector(".motif-ok").addEventListener("click", () => dlg.remove());
  }

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
      <div class="twm-menu-item" data-mi="netscape">Netscape</div>
      <div class="twm-menu-item" data-mi="xclock">xclock</div>
      <div class="twm-menu-item" data-mi="xeyes">xeyes</div>
      <div class="twm-menu-item" data-mi="refresh">Refresh</div>
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
    netscape: () => restore(nsWin),
    xclock: () => restore(clockWin),
    xeyes: () => restore(eyesWin),
    refresh: () => flashRoot("#ffffff", REDUCED() ? 0 : 90),
    restart: () => flashRoot("#000000", REDUCED() ? 0 : 250),
    exit: () => cleanup(),
  };

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
      openMenu(e.clientX, e.clientY);
      return;
    }
    closeMenu();

    const btn = e.target.closest("[data-act]");
    if (btn) {
      actions[btn.dataset.act]();
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
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cleanup();
    }
  }
  document.addEventListener("keydown", onKey, true);

  function cleanup() {
    document.removeEventListener("keydown", onKey, true);
    clearInterval(clockTimer);
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
