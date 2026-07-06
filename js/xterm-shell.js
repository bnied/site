// xterm-shell.js — pure command dispatch for the startx easter egg's xterm
// window. Reuses the pipe engine for the site's text commands (a single
// command is just a one-stage pipeline) and adds what a shell under X needs:
// exit closes the window, X11 programs error because X is already running,
// and console-only programs refuse to start. No DOM — testable in node.

import { runPipeline } from "./pipeline.js";
import { plainText } from "./sections-model.js";

// Full-screen/console programs from the main terminal that can't render
// inside a little twm window.
const CONSOLE_ONLY = new Set([
  "doom", "top", "htop", "btop", "cmatrix", "sl", "shutdown", "reboot",
  "poweroff", "halt", "ping", "traceroute", "tracert", "resume", "cv",
]);

const X_ALREADY_RUNNING = [
  "Fatal server error:",
  "Server is already active for display 0",
  "        If this server is no longer running, remove /tmp/.X0-lock",
  "        and start again.",
  "",
  "xinit: server error",
];

// Returns { lines?: string[], action?: string } where action is one of
// "exit", "clear", "spawn" (a new xterm), or "open:<app>" (launch the X
// client if it isn't running, else raise its window).
export function xtermRespond(raw, ctx) {
  const cmd = raw.trim().toLowerCase();
  if (cmd === "") return { lines: [] };

  // the fork bomb contains a `|`, so it must be caught before the pipe engine
  if (cmd.replace(/\s/g, "") === ":(){:|:&};:") {
    return { lines: [
      "-bash: fork: retry: Resource temporarily unavailable",
      "-bash: fork: Interrupted system call",
      "(nice try. the duck has ulimits — even under X.)",
    ] };
  }

  if (cmd === "exit" || cmd === "logout") return { action: "exit" };
  if (cmd === "clear" || cmd === "cls") return { action: "clear" };

  // the reason this shell exists: X11 from within twm
  if (cmd === "startx" || cmd === "xinit" || cmd === "x") {
    return { lines: X_ALREADY_RUNNING };
  }
  if (cmd === "twm" || cmd === "dwm" || cmd === "i3" || cmd === "uwm") {
    return { lines: [`${cmd}: another window manager is already running on screen 0?`] };
  }
  if (cmd === "xterm") return { action: "spawn" };
  if (cmd === "xeyes" || cmd === "xclock") return { action: "open:" + cmd };
  if (cmd === "netscape" || cmd === "mosaic") {
    return {
      action: "open:netscape",
      lines: ["netscape: lock file /home/visitor/.netscape/lock exists — raising the running browser."],
    };
  }

  if (CONSOLE_ONLY.has(cmd.split(" ")[0])) {
    return { lines: [
      `${cmd.split(" ")[0]}: cannot open console device (running under X)`,
      "(quit the session — Esc — and run it from the terminal)",
    ] };
  }

  if (cmd === "help" || cmd === "?") {
    return { lines: ctx.helpText.map(l => plainText(l.text)) };
  }
  if (ctx.sections[cmd]) {
    return { lines: ctx.sections[cmd].map(l => plainText(l.text)) };
  }
  if (cmd.startsWith("experience ")) {
    const sub = cmd.slice(11).trim();
    if (ctx.experienceDetail[sub]) {
      return { lines: ctx.experienceDetail[sub].map(l => plainText(l.text)) };
    }
    return { lines: [
      `unknown role: ${sub}`,
      "available: " + ctx.expKeys.join(", "),
    ] };
  }

  if (cmd === "sudo make me a sandwich") return { lines: ["Okay."] };
  if (cmd === "sudo") {
    return { lines: ["usage: sudo <command>", "(not that it will help you here)"] };
  }
  if (cmd.startsWith("sudo ")) {
    return { lines: [
      "visitor is not in the sudoers file.",
      "This incident will be reported.",
    ] };
  }
  if (cmd === "vim" || cmd === "vi") {
    return { lines: [
      "Why would you do this to yourself?",
      "(hint: you can't :q out of this one either)",
    ] };
  }
  if (cmd === "emacs") {
    return { lines: ["A great operating system, lacking only a decent text editor."] };
  }
  if (cmd === "nano") return { lines: ["Finally, a sensible choice."] };
  if (/^:(q|q!|wq|wq!|x)$/.test(cmd)) {
    return { lines: [
      "E492: Not an editor command — you're not in vim.",
      "(I respect the reflex, though.)",
    ] };
  }

  // everything else goes through the pipe engine; unknown commands come
  // back as "<name>: command not found", same as a real shell
  const result = runPipeline(raw, ctx);
  if (result.error) return { lines: [result.error] };
  return { lines: result.lines };
}
