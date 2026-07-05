// dmesg easter egg — a kernel boot log built from the visitor's REAL
// environment (browser, GPU, screen, locale, ...). All formatting lives in
// the pure dmesgText/parseBrowser/parseOS functions in textsources.js; this
// module only probes the browser APIs and renders.

import { addLine, escapeHTML } from "../render.js";
import { state } from "../state.js";
import { dmesgText, parseBrowser, parseOS } from "../textsources.js";

let staticEnv = null;

function probeGPU() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch {
    return null;
  }
}

// Values that cannot change during a page's lifetime are probed once;
// the rest (viewport, online, theme preference, uptime) are read per call.
export function probeEnvironment() {
  if (!staticEnv) {
    const ua = navigator.userAgent || "";
    staticEnv = {
      browser: parseBrowser(ua),
      os: parseOS(ua),
      cores: navigator.hardwareConcurrency,
      memoryGB: navigator.deviceMemory,
      gpu: probeGPU(),
      screenW: screen.width,
      screenH: screen.height,
      colorDepth: screen.colorDepth,
      locale: navigator.language || "en-US",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      touchPoints: navigator.maxTouchPoints || 0,
    };
  }
  return {
    ...staticEnv,
    dpr: window.devicePixelRatio || 1,
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
    dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    online: navigator.onLine,
    connection: navigator.connection?.effectiveType || null,
    uptimeSec: (Date.now() - state.pageLoadTime) / 1000,
  };
}

const TS_RE = /^(\[ *[\d.]+\]) (.*)$/;

export function runDmesg() {
  dmesgText(probeEnvironment()).forEach(line => {
    const m = line.match(TS_RE);
    if (m) {
      addLine(`  <span class="line-comment">${m[1]}</span> ${escapeHTML(m[2])}`, null, true);
    } else {
      addLine("  " + line, null, true);
    }
  });
  addLine("", null, false);
}
