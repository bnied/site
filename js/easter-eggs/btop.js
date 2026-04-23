// btop easter egg — animated system monitor with CPU bars, sparklines,
// memory bars, and a fake process table. Triggered by `top`, `htop`, `btop`.

import { output, cmdInput } from "../dom.js";
import { addLine, pad, scrollToBottom } from "../render.js";
import { state } from "../state.js";

export function runBtop() {
  const inputLine = document.getElementById("input-line");
  inputLine.style.display = "none";
  const savedOutput = output.innerHTML;
  output.innerHTML = "";

  const btopEl = document.createElement("div");
  btopEl.style.cssText = "white-space:pre;font-size:inherit;line-height:1.4;";
  const btopStyle = document.createElement("style");
  btopStyle.textContent = "#btop-view, #btop-view * { letter-spacing: 0 !important; }";
  document.head.appendChild(btopStyle);
  btopEl.id = "btop-view";
  output.appendChild(btopEl);

  const processes = (state.DATA.btopProcesses || []).map(p => ({ ...p }));

  const cpuCores = 4;
  const cpuHistory = Array.from({ length: cpuCores }, () => Array(30).fill(0));

  function randBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function sparkline(hist) {
    const chars = "▁▂▃▄▅▆▇█";
    return hist.map(v => {
      const idx = Math.min(Math.floor((v / 100) * chars.length), chars.length - 1);
      return chars[idx];
    }).join("");
  }

  const W = 60;
  const SEP_H = "─".repeat(W);

  function boxLine(text) {
    return "│" + text + "│";
  }

  function fixedLine(text) {
    if (text.length > W) return text.slice(0, W);
    return text + " ".repeat(W - text.length);
  }

  function colorize(line, rules) {
    let result = line;
    const sorted = [...rules].sort((a, b) => b.start - a.start);
    for (const r of sorted) {
      const before = result.slice(0, r.start);
      const segment = result.slice(r.start, r.end);
      const after = result.slice(r.end);
      result = before + `<span class="${r.cls}">` + segment + "</span>" + after;
    }
    return result;
  }

  function render() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    const uptimeMs = Date.now() - state.pageLoadTime;
    const uptimeMin = Math.floor(uptimeMs / 60000);
    const uptimeHr = Math.floor(uptimeMin / 60);
    const upStr = uptimeHr > 0 ? `${uptimeHr}h ${uptimeMin % 60}m` : `${uptimeMin}m`;

    const cpuPcts = [];
    for (let i = 0; i < cpuCores; i++) {
      const base = i === 0 ? randBetween(5, 25) : randBetween(1, 15);
      const spike = Math.random() > 0.92 ? randBetween(30, 80) : 0;
      const pct = Math.min(base + spike, 100);
      cpuPcts.push(pct);
      cpuHistory[i].push(pct);
      if (cpuHistory[i].length > 30) cpuHistory[i].shift();
    }

    processes.forEach(p => {
      if (p.pid === 999) {
        p.cpu = randBetween(8, 22);
        p.mem = randBetween(10, 16);
      } else if (p.pid === 777) {
        p.cpu = randBetween(1, 6);
      } else if (p.pid === 888) {
        p.cpu = randBetween(0.5, 3);
      } else if (p.pid === 314) {
        p.cpu = randBetween(0.2, 4);
      } else if (p.pid === 420) {
        p.cpu = randBetween(0.5, 5);
      } else {
        p.cpu = randBetween(0, 1.5);
      }
    });

    const barW = 28;
    const totalMem = 16384;
    const usedMem = Math.floor(randBetween(6800, 7400));
    const totalSwap = 4096;
    const usedSwap = Math.floor(randBetween(120, 280));

    let out = [];

    const loadStr = `${randBetween(0.2, 0.8).toFixed(2)} ${randBetween(0.4, 1.0).toFixed(2)} ${randBetween(0.6, 1.4).toFixed(2)}`;
    const headerText = ` btop  ${timeStr}  up ${upStr}  load: ${loadStr}`;
    out.push(colorize(headerText, [
      { start: 0, end: 5, cls: "line-heading" },
      { start: 5, end: headerText.length, cls: "line-comment" },
    ]));

    out.push(`<span class="line-separator">┌${SEP_H}┐</span>`);

    const cpuTitle = fixedLine(" CPU");
    out.push(colorize(boxLine(cpuTitle), [
      { start: 1, end: 5, cls: "line-heading" },
    ]));

    for (let i = 0; i < cpuCores; i++) {
      const pct = cpuPcts[i];
      const filled = Math.round((pct / 100) * barW);
      const empty = barW - filled;
      const pctStr = pad(pct.toFixed(0), 3) + "%";
      const sparkStr = sparkline(cpuHistory[i]);
      const label = `  Core ${i} `;
      const barStr = "█".repeat(filled) + "░".repeat(empty);
      const after = ` ${pctStr} `;
      const sparkW = W - label.length - barW - after.length;
      const spark = sparkStr.slice(0, Math.max(0, sparkW));
      const plainLine = fixedLine(label + barStr + after + spark);
      const barStart = label.length;
      const barEnd = barStart + barW;
      let barCls = "line-ok";
      if (pct > 70) barCls = "line-highlight";
      if (pct > 90) barCls = "line-accent";
      const sparkStart = barEnd + after.length;
      const sparkEnd = sparkStart + spark.length;
      out.push(colorize(boxLine(plainLine), [
        { start: barStart + 1, end: barEnd + 1, cls: barCls },
        { start: sparkStart + 1, end: sparkEnd + 1, cls: "line-ok" },
      ]));
    }

    out.push(`<span class="line-separator">├${SEP_H}┤</span>`);

    const memTitle = fixedLine(" MEMORY");
    out.push(colorize(boxLine(memTitle), [
      { start: 1, end: 8, cls: "line-heading" },
    ]));

    const memPct = pad(((usedMem / totalMem) * 100).toFixed(0), 3) + "%";
    const memFilled = Math.round((usedMem / totalMem) * barW);
    const memBarStr = "█".repeat(memFilled) + "░".repeat(barW - memFilled);
    const memAfter = ` ${memPct}  ${pad(usedMem, 5)}M / ${totalMem}M`;
    const ramPlain = fixedLine("  RAM   " + memBarStr + memAfter);
    out.push(colorize(boxLine(ramPlain), [
      { start: 9, end: 9 + barW, cls: "line-accent" },
    ]));

    const swapPct = pad(((usedSwap / totalSwap) * 100).toFixed(0), 3) + "%";
    const swapFilled = Math.round((usedSwap / totalSwap) * barW);
    const swapBarStr = "█".repeat(swapFilled) + "░".repeat(barW - swapFilled);
    const swapAfter = ` ${swapPct}  ${pad(usedSwap, 5)}M / ${totalSwap}M`;
    const swapPlain = fixedLine("  Swap  " + swapBarStr + swapAfter);
    out.push(colorize(boxLine(swapPlain), [
      { start: 9, end: 9 + barW, cls: "line-accent" },
    ]));

    out.push(`<span class="line-separator">├${SEP_H}┤</span>`);

    const procTitle = fixedLine(" PROCESSES");
    out.push(colorize(boxLine(procTitle), [
      { start: 1, end: 11, cls: "line-heading" },
    ]));

    const hdr = fixedLine(`  ${pad("PID", 5)} ${pad("USER", 8, true)} ${pad("CPU%", 6)} ${pad("MEM%", 6)}  COMMAND`);
    out.push(colorize(boxLine(hdr), [
      { start: 1, end: W + 1, cls: "line-comment" },
    ]));

    const sorted = [...processes].sort((a, b) => b.cpu - a.cpu);
    sorted.forEach(p => {
      const procText = fixedLine(`  ${pad(p.pid, 5)} ${pad(p.user, 8, true)} ${pad(p.cpu.toFixed(1), 6)} ${pad(p.mem.toFixed(1), 6)}  ${p.cmd}`);
      if (p.cpu > 5) {
        out.push(colorize(boxLine(procText), [
          { start: 1, end: W + 1, cls: "line-highlight" },
        ]));
      } else {
        out.push(boxLine(procText));
      }
    });

    out.push(`<span class="line-separator">└${SEP_H}┘</span>`);
    out.push(`<span class="line-comment"> Press 'q' to quit</span>`);

    btopEl.innerHTML = out.join("\n");
    scrollToBottom();
  }

  render();
  const updateInterval = setInterval(render, 1500);

  function onKey(e) {
    if (e.key === "q" || e.key === "Q" || e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
      e.preventDefault();
      clearInterval(updateInterval);
      document.removeEventListener("keydown", onKey, true);
      btopStyle.remove();
      output.innerHTML = savedOutput;
      inputLine.style.display = "flex";
      cmdInput.focus();
      scrollToBottom();
    }
  }

  document.addEventListener("keydown", onKey, true);
}
