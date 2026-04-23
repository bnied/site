// Visual effects for the CRT aesthetic. Currently: the noise-grain overlay.

import { noiseCanvas } from "./dom.js";

export function initNoise() {
  const ctx = noiseCanvas.getContext("2d");
  let w, h;

  function resize() {
    w = noiseCanvas.width  = noiseCanvas.offsetWidth / 2;
    h = noiseCanvas.height = noiseCanvas.offsetHeight / 2;
  }
  resize();
  window.addEventListener("resize", resize);

  function drawNoise() {
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(drawNoise);
  }
  drawNoise();
}
