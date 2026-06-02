// Small easter eggs grouped into one file. Each is self-contained and
// short enough not to warrant a dedicated module.

import { output } from "../dom.js";
import { addLine, escapeHTML, pad, scrollToBottom } from "../render.js";
import { state } from "../state.js";
import { cowsayText } from "../cowsay.js";

export function runNeofetch() {
  const uptimeMs = Date.now() - state.pageLoadTime;
  const uptimeMin = Math.floor(uptimeMs / 60000);
  const uptimeHr = Math.floor(uptimeMin / 60);
  const upStr = uptimeHr > 0 ? `${uptimeHr} hours, ${uptimeMin % 60} mins` : `${uptimeMin} mins`;
  const theme = document.documentElement.getAttribute("data-theme") || "green";

  const artW = 24;
  const ascii = (state.DATA.neofetch || []).map(l => l.padEnd(artW));

  const info = (state.DATA.neofetchInfo || []).map(item => ({ ...item }));
  info.push({ label: "Uptime", value: upStr });
  info.push({ label: "Theme", value: theme });
  info.push({ label: "Locale", value: navigator.language || "en-US" });

  const maxLines = Math.max(ascii.length, info.length);
  for (let i = 0; i < maxLines; i++) {
    const artPart = i < ascii.length ? ascii[i] : " ".repeat(23);
    let infoPart = "";
    if (i < info.length) {
      const item = info[i];
      if (item.cls === "line-heading") {
        infoPart = `<span class="line-accent">${escapeHTML(item.label)}</span><span class="line-heading">${escapeHTML(item.value)}</span>`;
      } else if (item.cls === "line-separator") {
        infoPart = `<span class="line-separator">${item.value}</span>`;
      } else {
        infoPart = `<span class="line-accent">${escapeHTML(item.label)}</span>: ${escapeHTML(item.value)}`;
      }
    }
    addLine(`<span class="line-ok">${escapeHTML(artPart)}</span>  ${infoPart}`, null, true);
  }
  addLine("", null, false);
}

export function runGrep(pattern) {
  if (!pattern) {
    addLine("  Usage: grep &lt;pattern&gt;", "line-highlight", true);
    addLine("", null, false);
    return;
  }

  const lowerPattern = pattern.toLowerCase();
  let matchCount = 0;

  const allSections = { ...state.sections, ...state.experienceDetail };

  for (const [name, lines] of Object.entries(allSections)) {
    const matches = [];
    lines.forEach(l => {
      const plainText = l.text.replace(/<[^>]*>/g, "");
      if (plainText.toLowerCase().includes(lowerPattern)) {
        matches.push(plainText);
      }
    });

    if (matches.length > 0) {
      addLine(`  <span class="line-accent">${escapeHTML(name)}:</span>`, null, true);
      matches.forEach(m => {
        const regex = new RegExp(`(${escapeHTML(pattern)})`, "gi");
        const highlighted = escapeHTML(m).replace(regex, '<span class="line-heading">$1</span>');
        addLine(`    ${highlighted}`, null, true);
      });
      matchCount += matches.length;
      addLine("", null, false);
    }
  }

  if (matchCount === 0) {
    addLine(`  No matches found for '${escapeHTML(pattern)}'`, "line-comment", true);
    addLine("", null, false);
  } else {
    addLine(`  ${matchCount} match${matchCount === 1 ? "" : "es"} found`, "line-comment", true);
    addLine("", null, false);
  }
}

export function runDockerPs() {
  const containers = state.DATA.docker || [];

  addLine(`  <span class="line-comment">CONTAINER ID   IMAGE                    STATUS          PORTS                      NAMES</span>`, null, true);
  containers.forEach(c => {
    addLine(`  ${c.id}   ${pad(c.image, 24, true)} ${pad(c.status, 15, true)} ${pad(c.ports, 26, true)} ${c.name}`, null, true);
  });
  addLine("", null, false);
}

export function runKubectlPods() {
  const pods = state.DATA.kubectl || [];

  addLine(`  <span class="line-comment">NAME                            READY   STATUS      RESTARTS   AGE</span>`, null, true);
  pods.forEach(p => {
    const statusCls = p.status === "Running" ? "line-ok" : "line-comment";
    const line = `  ${pad(p.name, 31, true)} ${pad(p.ready, 7, true)} <span class="${statusCls}">${pad(p.status, 11, true)}</span> ${pad(p.restarts, 10, true)} ${p.age}`;
    addLine(line, null, true);
  });
  addLine("", null, false);
}

export function runGitLog() {
  const commits = state.DATA.gitlog || [];

  commits.forEach(c => {
    addLine(`  <span class="line-highlight">${c.hash}</span> - ${escapeHTML(c.msg)}`, null, true);
    addLine(`  <span class="line-comment">  ${c.author}, ${c.date}</span>`, null, true);
    addLine("", null, false);
  });
}

export function showCatPicture() {
  const pictures = state.DATA.catPictures || [];
  if (pictures.length === 0) {
    addLine("  cat: no pictures available", "line-highlight", true);
    return;
  }
  const src = pictures[Math.floor(Math.random() * pictures.length)];

  const container = document.createElement("div");
  container.className = "line cat-picture";
  container.innerHTML = `<div class="cat-frame"><img src="${src}" alt="a cat" class="cat-img" loading="lazy"></div>`;
  output.appendChild(container);
  scrollToBottom();

  const img = container.querySelector("img");
  img.addEventListener("load", scrollToBottom);
}

export function runCowsay(message) {
  cowsayText(message).forEach(l => addLine(escapeHTML(l), "line-accent", true));
  addLine("", null, false);
}
