// textsources.js — pure, DOM-free plain-text generators for terminal commands.
// No imports from dom/render/state; no document/window/navigator/Date.now.
// All time-dependent functions receive `now` (Date) and other env values as
// explicit parameters so they can be tested deterministically and later piped.

// ---------------------------------------------------------------------------
// Simple one-liners
// ---------------------------------------------------------------------------

export function whoamiText() {
  return ["visitor"];
}

export function pwdText() {
  return ["/home/visitor"];
}

export function hostnameText() {
  return ["bnied.dev"];
}

// ---------------------------------------------------------------------------
// uname
// ---------------------------------------------------------------------------

/**
 * @param {string} args  - everything after "uname" (e.g. "", "-a", "-s", "-r", "-m")
 * @param {Date}   now
 * @returns {string[]}
 */
export function unameText(args, now) {
  const flag = args.trim();
  if (flag === "-s") return ["bnied.dev"];
  if (flag === "-r") return ["1.0.0"];
  if (flag === "-m") return ["JavaScript/ES2024"];
  // "" and "-a" both produce the full string; any other unknown flag does too
  return ["bnied.dev 1.0.0 SPACEDUCK-BIOS SMP " + now.toUTCString() + " JavaScript/ES2024 browser"];
}

// ---------------------------------------------------------------------------
// date
// ---------------------------------------------------------------------------

/**
 * @param {Date} now
 * @returns {string[]}
 */
export function dateText(now) {
  return [now.toString()];
}

// ---------------------------------------------------------------------------
// uptime
// ---------------------------------------------------------------------------

/**
 * @param {Date}   now
 * @param {number} pageLoadTime  - epoch ms of page load
 * @returns {string[]}
 */
export function uptimeText(now, pageLoadTime) {
  const elapsed = Math.floor((now.getTime() - pageLoadTime) / 1000);
  const hrs  = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const upStr = (hrs > 0 ? hrs + " hr " : "") + mins + " min, " + secs + " sec";
  return [`${timeStr} up ${upStr}, 1 user, load average: 0.42, 0.69, 1.337`];
}

// ---------------------------------------------------------------------------
// ls
// ---------------------------------------------------------------------------

/**
 * Build ls output rows from a flag/args string (everything after "ls").
 * Returns an array of { text, cls } objects — NO leading two-space indent,
 * NO trailing blank-line entry.
 *
 * @param {string} args  e.g. " -la", "-1", ""
 * @returns {{ text: string, cls: string | null }[]}
 */
export function lsRows(args) {
  const flagStr = args.replace(/[\s-]/g, "");
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

  const rows = [];

  if (longFormat) {
    const totalBlocks = files.reduce((acc, f) => acc + blocks(f.size), 0);
    rows.push({ text: `total ${totalBlocks}`, cls: "line-comment" });

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
      rows.push({ text: `${blockStr}${perms}  ${links} bnied  staff  ${size} ${f.mtime} ${name}`, cls });
    });
  } else if (onePerLine) {
    files.forEach(f => {
      const cls = f.name.startsWith(".") ? "line-comment" : (f.kind === "dir" ? "line-highlight" : "line-accent");
      rows.push({ text: classifyName(f), cls });
    });
  } else {
    const names = files.map(classifyName);
    const colW = Math.max(...names.map(n => n.length)) + 3;
    const cols = 3;
    for (let i = 0; i < names.length; i += cols) {
      const row = names.slice(i, i + cols).map(n => n.padEnd(colW)).join("");
      rows.push({ text: row.trimEnd(), cls: "line-accent" });
    }
  }

  return rows;
}

/**
 * Convenience wrapper: plain text lines only (no cls).
 * @param {string} args
 * @returns {string[]}
 */
export function lsText(args) {
  return lsRows(args).map(r => r.text);
}

// ---------------------------------------------------------------------------
// ps
// ---------------------------------------------------------------------------

/**
 * Render a ps-style process table. First line is the header.
 *
 * @param {{ pid: number, user: string, cpu: number, mem: number, cmd: string }[]} processes
 * @returns {string[]}
 */
export function psText(processes) {
  const lines = ["  PID USER      %CPU %MEM COMMAND"];
  processes.forEach(p => {
    lines.push(
      String(p.pid).padStart(5) + " " +
      p.user.padEnd(9) + " " +
      p.cpu.toFixed(1).padStart(4) + " " +
      p.mem.toFixed(1).padStart(4) + " " +
      p.cmd
    );
  });
  return lines;
}

// ---------------------------------------------------------------------------
// free
// ---------------------------------------------------------------------------

/**
 * @param {string} args  - flags after "free" (ignored; 640K is 640K)
 * @returns {string[]}
 */
export function freeText(args) {
  return [
    "              total        used        free      shared",
    "Mem:           640K        640K          0K          0K",
    "Swap:            0K          0K          0K",
    "",
    "(640K ought to be enough for anybody)",
  ];
}

// ---------------------------------------------------------------------------
// df
// ---------------------------------------------------------------------------

/**
 * @param {string} args  - flags after "df" (ignored; sizes are already human)
 * @returns {string[]}
 */
export function dfText(args) {
  return [
    "Filesystem      Size  Used Avail Use% Mounted on",
    "/dev/duck0       42K   40K    2K  95% /",
    "tmpfs           640K     0  640K   0% /dev/shm",
    "/dev/coffee      12G   12G     0 100% /home/visitor/coffee",
    "cloud:/         8.0E  4.2E  3.8E  53% /mnt/somebody-elses-computer",
  ];
}

// ---------------------------------------------------------------------------
// yes
// ---------------------------------------------------------------------------

const YES_LINES = 15;

/**
 * A mercifully finite `yes`.
 *
 * @param {string} args  - text to repeat (defaults to "y")
 * @returns {string[]}
 */
export function yesText(args) {
  const word = args.trim() || "y";
  const lines = Array(YES_LINES).fill(word);
  lines.push("^C");
  lines.push("(that could have gone on forever — you're welcome)");
  return lines;
}

// ---------------------------------------------------------------------------
// dmesg
// ---------------------------------------------------------------------------

/**
 * Identify browser name/version from a user-agent string.
 * Order matters: Edge and Opera embed "Chrome/", Chrome embeds "Safari/".
 *
 * @param {string} ua
 * @returns {{ name: string, version: string }}
 */
export function parseBrowser(ua) {
  const rules = [
    { name: "Edge",    re: /Edg\/([\d.]+)/ },
    { name: "Opera",   re: /OPR\/([\d.]+)/ },
    { name: "Firefox", re: /Firefox\/([\d.]+)/ },
    { name: "Chrome",  re: /Chrome\/([\d.]+)/ },
    { name: "Safari",  re: /Version\/([\d.]+).*Safari/ },
  ];
  for (const { name, re } of rules) {
    const m = ua.match(re);
    if (m) return { name, version: m[1].split(".")[0] };
  }
  return { name: "Unknown", version: "?" };
}

/**
 * Identify the host OS from a user-agent string.
 *
 * @param {string} ua
 * @returns {string}
 */
export function parseOS(ua) {
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Windows/.test(ua)) return "Windows";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Linux/.test(ua)) return "Linux";
  return "an unidentified OS";
}

/**
 * Render a kernel-boot-log view of the REAL environment the page runs in.
 * Pure: all probed values arrive via `env`; timestamps are deterministic.
 *
 * @param {{
 *   browser:       { name: string, version: string },
 *   os:            string,
 *   cores:         number | undefined,
 *   memoryGB:      number | undefined,
 *   gpu:           string | null,
 *   screenW:       number, screenH: number,
 *   dpr:           number,
 *   colorDepth:    number,
 *   viewportW:     number, viewportH: number,
 *   locale:        string,
 *   timezone:      string,
 *   dark:          boolean,
 *   reducedMotion: boolean,
 *   online:        boolean,
 *   touchPoints:   number,
 *   connection:    string | null,
 *   uptimeSec:     number,
 * }} env
 * @returns {string[]}
 */
export function dmesgText(env) {
  const lines = [];
  let i = 0;
  function push(msg) {
    const t = Math.pow(i, 2.3) * 0.000987;
    lines.push(`[${t.toFixed(6).padStart(12)}] ${msg}`);
    i++;
  }

  push(`SPACEDUCK/Linux version 1.0.0-spaceduck (visitor@bnied.dev) (${env.browser.name} ${env.browser.version})`);
  push("Command line: BOOT_IMAGE=/boot/bnied.dev root=/dev/duck0 ro quiet splash");
  push(`Booting on ${env.os} — yes, this is really your machine`);
  push(env.cores
    ? `smp: Brought up 1 node, ${env.cores} CPUs (JavaScript will use one of them)`
    : "smp: CPU count undisclosed (browser is shy)");
  push(env.memoryGB
    ? `Memory: ~${env.memoryGB}G available to this tab (allegedly)`
    : "Memory: amount undisclosed (browser is shy)");
  push(env.gpu
    ? `fb0: ${env.gpu}`
    : "fb0: generic framebuffer (GPU identity withheld)");
  push(`Console: ${env.screenW}x${env.screenH} physical @${env.dpr}x, ${env.colorDepth}-bit color`);
  push(`Virtual console: ${env.viewportW}x${env.viewportH} viewport`);
  push(`Locale: ${env.locale}, TZ ${env.timezone}`);
  push(`backlight: prefers-color-scheme=${env.dark ? "dark" : "light"}, prefers-reduced-motion=${env.reducedMotion ? "reduce" : "no-preference"}`);
  push(env.touchPoints > 0
    ? `input: touchscreen detected (${env.touchPoints} touch points)`
    : "input: no touchscreen — mouse and keyboard, as nature intended");
  push(`duck0: link ${env.online ? "up" : "DOWN"}${env.connection ? ` (${env.connection})` : ""}, 1000 Mbps full duplex (unverified)`);
  push(`dmesg: read complete. up ${Math.floor(env.uptimeSec)}s. all systems quacking.`);

  return lines;
}

// ---------------------------------------------------------------------------
// neofetch
// ---------------------------------------------------------------------------

/**
 * Render neofetch as plain text (no HTML spans, no indent).
 *
 * @param {{
 *   neofetchAscii: string[],
 *   neofetchInfo:  { label: string, value: string, cls?: string }[],
 *   now:           Date,
 *   pageLoadTime:  number,
 *   theme:         string,
 *   locale:        string,
 * }} ctx
 * @returns {string[]}
 */
export function neofetchText(ctx) {
  const { neofetchAscii, neofetchInfo, now, pageLoadTime, theme, locale } = ctx;

  const uptimeMs  = now.getTime() - pageLoadTime;
  const uptimeMin = Math.floor(uptimeMs / 60000);
  const uptimeHr  = Math.floor(uptimeMin / 60);
  const upStr = uptimeHr > 0
    ? `${uptimeHr} hours, ${uptimeMin % 60} mins`
    : `${uptimeMin} mins`;

  const artW  = 24;
  const ascii = neofetchAscii.map(l => l.padEnd(artW));

  const info = neofetchInfo.map(i => ({ ...i }));
  info.push({ label: "Uptime", value: upStr });
  info.push({ label: "Theme",  value: theme });
  info.push({ label: "Locale", value: locale });

  const maxLines = Math.max(ascii.length, info.length);
  const lines = [];

  for (let i = 0; i < maxLines; i++) {
    const artPart  = i < ascii.length ? ascii[i] : " ".repeat(23);
    let   infoPart = "";
    if (i < info.length) {
      const item = info[i];
      if (item.cls === "line-heading") {
        infoPart = item.label + item.value;
      } else if (item.cls === "line-separator") {
        infoPart = item.value;
      } else {
        infoPart = item.label + ": " + item.value;
      }
    }
    lines.push(artPart + "  " + infoPart);
  }

  return lines;
}
