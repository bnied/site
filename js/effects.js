// Visual effects for the CRT aesthetic. Currently: the noise-grain overlay.
// The noise loop pauses when CRT effects are off, and renders a single static
// frame (no animation) when the user prefers reduced motion.

import { noiseCanvas } from "./dom.js";

export function initNoise() {
  const ctx = noiseCanvas.getContext("2d");
  let w, h;
  let running = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    w = noiseCanvas.width  = noiseCanvas.offsetWidth / 2;
    h = noiseCanvas.height = noiseCanvas.offsetHeight / 2;
  }
  resize();
  window.addEventListener("resize", resize);

  function paintFrame() {
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function loop() {
    if (!running) return;
    paintFrame();
    requestAnimationFrame(loop);
  }

  function start() {
    if (document.documentElement.dataset.crt === "off") { stop(); return; }
    if (reduceMotion) { paintFrame(); return; } // one static frame, no loop
    if (!running) { running = true; loop(); }
  }

  function stop() {
    running = false;
    ctx.clearRect(0, 0, w, h);
  }

  window.addEventListener("crtchange", start);
  start();
}
