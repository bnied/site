// ping easter egg — fake ICMP echo replies at 1 Hz, up to 4 pings or Esc to abort.

import { cmdInput } from "../dom.js";
import { addLine, escapeHTML, scrollToBottom } from "../render.js";

export function runPing(host) {
  const safeHost = escapeHTML(host);
  addLine(`  PING ${safeHost} (127.0.0.1): 56 data bytes`, "line-system", true);
  scrollToBottom();

  const inputLine = document.getElementById("input-line");
  inputLine.style.display = "none";

  let seq = 0;
  let done = false;
  const maxPings = 4;

  function cleanup(interrupted) {
    if (done) return;
    done = true;
    clearInterval(interval);
    document.removeEventListener("keydown", onKey, true);
    if (interrupted) addLine("  ^C", "line-highlight", true);
    addLine("", null, false);
    addLine(`  --- ${safeHost} ping statistics ---`, "line-system", true);
    addLine(`  ${seq} packets transmitted, ${seq} packets received, 0.0% packet loss`, null, true);
    addLine("", null, false);
    inputLine.style.display = "flex";
    cmdInput.focus();
    scrollToBottom();
  }

  function onKey(e) {
    if (e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
      e.preventDefault();
      cleanup(true);
    }
  }

  setTimeout(() => {
    if (!done) document.addEventListener("keydown", onKey, true);
  }, 100);

  const interval = setInterval(() => {
    const time = (Math.random() * 40 + 10).toFixed(3);
    addLine(`  64 bytes from 127.0.0.1: icmp_seq=${seq} ttl=64 time=${time} ms`, null, true);
    scrollToBottom();
    seq++;

    if (seq >= maxPings) {
      cleanup(false);
    }
  }, 1000);
}
