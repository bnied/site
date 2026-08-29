// startx easter egg — boots a fake X11 session running twm and hands the
// desktop to four collaborators: x11-wm.js (the window manager), x11-clients.js
// (xclock, xeyes, xload, xcalc), x11-xterm.js (a shell in a window) and
// netscape-app.js (a pre-4.0 Navigator browsing a graphical rendition of this
// site). What is left here is the session itself: the boot banner, the twm root
// menu, f.delete, the global event wiring, and the teardown that puts the
// terminal back. Root menu > Exit (or the classic Ctrl+Alt+Backspace server
// zap) quits; Esc only closes menus and dialogs, as it should. Styling lives in
// css/style.css under "X11 SESSION".

import { cmdInput } from "../dom.js";
import { addLine, scrollToBottom } from "../render.js";
import { state } from "../state.js";
import { netscapePages } from "../netscape-html.js";
import { clamp, createWm } from "./x11-wm.js";
import { createClients } from "./x11-clients.js";
import { createXterm } from "./x11-xterm.js";
import { createNetscape } from "./netscape-app.js";

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
    <div class="twm-hint">click the desktop for the Twm menu &middot; Ctrl+Alt+Backspace kills X</div>
  </div>`;
  document.body.appendChild(session);
  const desktop = session.querySelector(".x-desktop");
  const wm = createWm(desktop);
  const { windows, destroyWin, reopenWin } = wm;

  const dw = desktop.clientWidth;
  const dh = desktop.clientHeight;

  const clients = createClients({ wm, session, dw, dh });

  // File > Exit inside Netscape takes the X server down with it, so the
  // browser gets the session's teardown as a callback.
  const ns = createNetscape({
    wm, desktop, dw, dh, pages,
    reduced: REDUCED,
    onExit: () => cleanup(),
  });

  const spawnXterm = createXterm({
    wm, dw, dh,
    closeMenus,
    openApp: app => {
      if (app === "xeyes") clients.openXeyes();
      else if (app === "xclock") clients.openXclock();
      else if (app === "xload") clients.openXload();
      else if (app === "xcalc") clients.openXcalc();
      else reopenWin(ns.win);
    },
  });

  // Clicking into an xterm, or arming Delete Window, should put away both the
  // root menu and any Netscape dropdown.
  function closeMenus() {
    closeMenu();
    ns.closeNsMenu();
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
    netscape: () => reopenWin(ns.win),
    xclock: clients.openXclock,
    xeyes: clients.openXeyes,
    xload: clients.openXload,
    xcalc: clients.openXcalc,
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
    ns.closeNsMenu();
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
      ns.closeNsMenu();
      openMenu(e.clientX, e.clientY);
      return;
    }
    closeMenu();
    ns.closeNsMenu();

    const btn = e.target.closest("[data-act]");
    if (btn) {
      if (btn.classList.contains("disabled")) return;
      ns.actions[btn.dataset.act](btn);
      return;
    }
    const nav = e.target.closest("[data-page]");
    if (nav) {
      e.preventDefault();
      ns.navigate(nav.dataset.page);
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
    if (e.target === ns.locationEl || e.target.classList.contains("xterm-input")) return;
    e.preventDefault();
    e.stopPropagation();
    if (deleteMode) {
      setDeleteMode(false);
      return;
    }
    if (ns.isMenuOpen()) {
      ns.closeNsMenu();
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
    clients.destroy();
    ns.destroy();
    session.remove();
    addLine("  xinit: connection to X server lost", "line-comment", true);
    addLine("  waiting for X server to shut down... done.", "line-comment", true);
    addLine("", null, false);
    inputLine.style.display = "flex";
    cmdInput.focus();
    scrollToBottom();
  }
}
