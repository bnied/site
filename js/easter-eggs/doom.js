// DOOM easter egg — lazy-loads the self-hosted js-dos emulator (vendor/js-dos)
// and runs the bundled DOOM shareware WAD. Press Esc twice to exit cleanly.

import { cmdInput } from "../dom.js";
import { addLine, scrollToBottom } from "../render.js";

export function runDoom() {
  const inputLine = document.getElementById("input-line");
  inputLine.style.display = "none";

  addLine("", null, false);
  addLine("  ================================================", "line-separator", true);
  addLine("       DOOM v1.9 Shareware -- id Software 1993", "line-accent", true);
  addLine("  ================================================", "line-separator", true);
  addLine("", null, false);
  addLine("  Loading WAD file...", "line-system", true);
  scrollToBottom();

  const doomOverlay = document.createElement("div");
  doomOverlay.id = "doom-overlay";
  doomOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 100;
    background: #000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `;

  const exitHint = document.createElement("div");
  exitHint.style.cssText = `
    position: fixed;
    top: 10px;
    right: 16px;
    z-index: 102;
    color: #33ff33;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    opacity: 0.6;
    pointer-events: none;
  `;
  exitHint.textContent = "Press ESC twice to exit";

  const doomContainer = document.createElement("div");
  doomContainer.id = "doom-container";
  doomContainer.style.cssText = `
    width: 100%;
    height: 100%;
    max-width: 960px;
    max-height: 600px;
  `;

  doomOverlay.appendChild(doomContainer);
  doomOverlay.appendChild(exitHint);
  document.body.appendChild(doomOverlay);

  const jsdosCSS = document.createElement("link");
  jsdosCSS.rel = "stylesheet";
  jsdosCSS.href = "vendor/js-dos/js-dos.css";
  document.head.appendChild(jsdosCSS);

  let dosInstance = null;

  const jsdosScript = document.createElement("script");
  jsdosScript.src = "vendor/js-dos/js-dos.js";
  jsdosScript.onload = () => {
    addLine("  Initializing emulator...", "line-system", true);
    scrollToBottom();

    try {
      dosInstance = Dos(doomContainer, {
        url: "assets/doom.jsdos",
        pathPrefix: "vendor/js-dos/emulators/",
        autoStart: true,
        noCloud: true,
        noNetworking: true,
        kiosk: true,
        theme: "night",
        imageRendering: "pixelated",
        renderAspect: "4/3",
      });
    } catch (err) {
      addLine(`  Error: ${err.message}`, "line-highlight", true);
      cleanup();
    }
  };

  jsdosScript.onerror = () => {
    addLine("  ERROR: Failed to load js-dos emulator", "line-highlight", true);
    addLine("  Check your network connection and try again", "line-comment", true);
    addLine("", null, false);
    cleanup();
  };

  document.head.appendChild(jsdosScript);

  let escCount = 0;
  let escTimer = null;

  function onEsc(e) {
    if (e.key === "Escape") {
      escCount++;
      if (escCount >= 2) {
        e.preventDefault();
        e.stopPropagation();
        cleanup();
      } else {
        clearTimeout(escTimer);
        escTimer = setTimeout(() => { escCount = 0; }, 800);
      }
    } else {
      escCount = 0;
    }
  }

  document.addEventListener("keydown", onEsc, true);

  function cleanup() {
    document.removeEventListener("keydown", onEsc, true);
    if (dosInstance) {
      try {
        if (typeof dosInstance.stop === "function") {
          dosInstance.stop();
        } else if (typeof dosInstance.then === "function") {
          dosInstance.then(d => d && d.stop && d.stop()).catch(() => {});
        }
      } catch (err) {
        console.warn("Failed to stop DOS:", err);
      }
      dosInstance = null;
    }
    doomOverlay.remove();
    jsdosCSS.remove();
    jsdosScript.remove();
    addLine("", null, false);
    addLine("  Thanks for playing DOOM.", "line-ok", true);
    addLine("", null, false);
    inputLine.style.display = "flex";
    cmdInput.focus();
    scrollToBottom();
  }
}
