// ls easter egg — fake directory listing with support for a handful of
// flag combinations (-l, -a, -s, -h, -1, -r, -t, -F).

import { addLine } from "../render.js";

export function runLs(cmd) {
  const parts = cmd.slice(2).trim();
  const flagStr = parts.replace(/[\s-]/g, "");
  const flags = new Set(flagStr);

  const showHidden = flags.has("a");
  const longFormat = flags.has("l");
  const showSize   = flags.has("s");
  const humanSize  = flags.has("h");
  const onePerLine = flags.has("1");
  const reverse    = flags.has("r");
  const byTime     = flags.has("t");
  const classify   = flags.has("F");

  let files = [
    { name: "about.txt",       size: 1337, mtime: "Apr 10  2026", kind: "file" },
    { name: "contact.txt",     size: 2048, mtime: "Apr 10  2026", kind: "file" },
    { name: "experience.txt",  size: 4096, mtime: "Apr 13  2026", kind: "file" },
    { name: "skills.txt",      size: 3072, mtime: "Apr 10  2026", kind: "file" },
    { name: "projects.txt",    size: 2560, mtime: "Apr 13  2026", kind: "file" },
    { name: "education.txt",   size:  512, mtime: "Apr 10  2026", kind: "file" },
  ];

  const hidden = [
    { name: ".",               size: 4096, mtime: "Apr 13  2026", kind: "dir" },
    { name: "..",              size: 4096, mtime: "Apr 10  2026", kind: "dir" },
    { name: ".secrets",        size:    0, mtime: "Apr 10  2026", kind: "file", perms: "-rwx------" },
    { name: ".bash_history",   size:  666, mtime: "Apr 13  2026", kind: "file" },
  ];

  if (showHidden) files = [...hidden, ...files];
  if (byTime) {
    files.sort((a, b) => b.mtime.localeCompare(a.mtime));
  }
  if (reverse) files.reverse();

  function fmtSize(n) {
    if (!humanSize) return String(n);
    if (n < 1024) return n + "B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + "K";
    return (n / 1024 / 1024).toFixed(1) + "M";
  }

  function blocks(n) {
    return Math.max(1, Math.ceil(n / 1024));
  }

  function classifyName(f) {
    if (!classify) return f.name;
    if (f.kind === "dir") return f.name + "/";
    return f.name;
  }

  if (longFormat) {
    const totalBlocks = files.reduce((acc, f) => acc + blocks(f.size), 0);
    addLine(`  total ${totalBlocks}`, "line-comment", true);

    const sizeStrs = files.map(f => fmtSize(f.size));
    const maxSizeW = Math.max(...sizeStrs.map(s => s.length));
    const blockStrs = files.map(f => String(blocks(f.size)));
    const maxBlockW = Math.max(...blockStrs.map(s => s.length));

    files.forEach((f, idx) => {
      const perms = f.perms || (f.kind === "dir" ? "drwxr-xr-x" : "-rw-r--r--");
      const links = f.kind === "dir" ? "2" : "1";
      const size = sizeStrs[idx].padStart(maxSizeW);
      const blockStr = showSize ? blockStrs[idx].padStart(maxBlockW) + " " : "";
      const name = classifyName(f);
      const cls = f.name.startsWith(".") ? "line-comment" : (f.kind === "dir" ? "line-highlight" : "line-accent");
      addLine(`  ${blockStr}${perms}  ${links} bnied  staff  ${size} ${f.mtime} ${name}`, cls, true);
    });
  } else if (onePerLine) {
    files.forEach(f => {
      const cls = f.name.startsWith(".") ? "line-comment" : (f.kind === "dir" ? "line-highlight" : "line-accent");
      addLine("  " + classifyName(f), cls, true);
    });
  } else {
    const names = files.map(classifyName);
    const colW = Math.max(...names.map(n => n.length)) + 3;
    const cols = 3;
    for (let i = 0; i < names.length; i += cols) {
      const row = names.slice(i, i + cols).map(n => n.padEnd(colW)).join("");
      addLine("  " + row.trimEnd(), "line-accent", true);
    }
  }
  addLine("", null, false);
}
