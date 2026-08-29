// x11-wm.js — the twm side of the startx easter egg: floating windows with
// teal focused titlebars, drag to move, a resize corner, iconify to the root,
// f.delete, and the resurrection trick behind reopenWin. Knows nothing about
// what any window contains. Styling lives in css/style.css under "X11 SESSION".

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// One window manager per session, owning the window list and the z-order.
export function createWm(desktop) {
// ── tiny window manager ──
let zTop = 10;
const windows = [];
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
  return { windows, focusWin, makeWindow, iconify, restore, destroyWin, reopenWin };
}
