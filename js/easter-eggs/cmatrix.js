// cmatrix easter egg — falling green rain on a canvas that fills the
// terminal area. Press q/Esc/Ctrl+C to exit.

import { output, cmdInput } from "../dom.js";
import { scrollToBottom } from "../render.js";

export function runCmatrix() {
  const inputLine = document.getElementById("input-line");
  inputLine.style.display = "none";
  const savedOutput = output.innerHTML;
  output.innerHTML = "";

  const matrixEl = document.createElement("canvas");
  matrixEl.style.cssText = "width:100%;height:100%;display:block;";
  output.appendChild(matrixEl);

  const ctx = matrixEl.getContext("2d");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*(){}[]|;:<>,.?/~`アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

  let w, h, columns, drops;
  const fontSize = 14;

  function resize() {
    w = matrixEl.width = matrixEl.offsetWidth;
    h = matrixEl.height = matrixEl.offsetHeight;
    columns = Math.floor(w / fontSize);
    drops = Array(columns).fill(1);
  }
  resize();
  window.addEventListener("resize", resize);

  function draw() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#33ff33";
    ctx.font = fontSize + "px 'Fira Code', monospace";

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillStyle = drops[i] === 1 ? "#ffffff" : `rgba(51, 255, 51, ${Math.random() * 0.5 + 0.5})`;
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > h && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  const interval = setInterval(draw, 40);

  function onKey(e) {
    if (e.key === "q" || e.key === "Q" || e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
      e.preventDefault();
      clearInterval(interval);
      window.removeEventListener("resize", resize);
      document.removeEventListener("keydown", onKey, true);
      output.innerHTML = savedOutput;
      inputLine.style.display = "flex";
      cmdInput.focus();
      scrollToBottom();
    }
  }
  document.addEventListener("keydown", onKey, true);
}
