// Command dispatch. runCommand reads the raw input, echoes it to the
// output area, and dispatches to the appropriate handler — either an
// inline response (for short commands) or an imported easter-egg module.

import { output } from "./dom.js";
import { addLine, addLines, escapeHTML, pad, scrollToBottom } from "./render.js";
import { state } from "./state.js";
import {
  runBtop, runDoom, runLs, runShutdown, runSL, runCmatrix, runTraceroute, runPing,
  runNeofetch, runGrep, runDockerPs, runKubectlPods, runGitLog, showCatPicture, runCowsay,
} from "./easter-eggs/index.js";
import { hasPipe, runPipeline } from "./pipeline.js";
import { figletText } from "./figlet.js";

const LOLCAT_COL_STEP = 12;
const LOLCAT_ROW_STEP = 20;

function pipelineCtx() {
  return { font: state.DATA.figletFont, fortunes: state.FORTUNES, sections: state.sections };
}

// Wrap each non-space character of a RAW (un-escaped) line in a rainbow span.
function rainbowLine(text, rowIdx, start) {
  let html = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === " ") { html += " "; continue; }
    const hue = Math.round((start + i * LOLCAT_COL_STEP + rowIdx * LOLCAT_ROW_STEP) % 360);
    html += `<span style="color:hsl(${hue},100%,70%)">${escapeHTML(ch)}</span>`;
  }
  return html;
}

function renderPipelineResult(result) {
  if (result.error) {
    addLine("  " + escapeHTML(result.error), "line-highlight", true);
    addLine("", null, false);
    return;
  }
  const start = Math.floor(Math.random() * 360);
  result.lines.forEach((line, i) => {
    if (result.colorize) {
      addLine("  " + rainbowLine(line, i, start), null, true);
    } else {
      addLine("  " + escapeHTML(line), null, true);
    }
  });
  addLine("", null, false);
}

export function runCommand(raw) {
  const cmd = raw.trim().toLowerCase();

  addLine("", null, false);
  const promptHTML = document.querySelector("#input-line .prompt").innerHTML;
  addLine(`<span class="prompt">${promptHTML}</span>${escapeHTML(raw)}`, "line-prompt", false);

  if (cmd === "") {
    scrollToBottom();
    return;
  }

  if (hasPipe(raw)) {
    renderPipelineResult(runPipeline(raw, pipelineCtx()));
    scrollToBottom();
    return;
  }

  if (cmd === "help" || cmd === "?") {
    addLines(state.helpText);
  } else if (cmd === "clear" || cmd === "cls") {
    output.innerHTML = "";
    scrollToBottom();
    return;
  } else if (cmd === "all") {
    addLines(state.sections.about);
    addLines(state.sections.contact);
    addLines(state.sections.skills);
    addLines(state.sections.experience);
    for (const key of state.EXP_KEYS) {
      addLines(state.experienceDetail[key]);
    }
    addLines(state.sections.projects);
    addLines(state.sections.education);
  } else if (cmd.startsWith("experience ")) {
    const sub = cmd.slice(11).trim();
    if (state.experienceDetail[sub]) {
      addLines(state.experienceDetail[sub]);
    } else {
      addLine(`  unknown role: ${escapeHTML(sub)}`, "line-highlight", true);
      addLine("  available: " + state.EXP_KEYS.join(", "), "line-comment", true);
      addLine("", null, false);
    }
  } else if (cmd.startsWith("sudo ")) {
    addLine("  visitor is not in the sudoers file.", "line-highlight", true);
    addLine("  This incident will be reported.", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd.startsWith("cat ")) {
    const file = cmd.slice(4).trim();
    const sectionName = file.replace(/\.txt$/, "");
    if (file === "") {
      addLine("  cat: missing operand", "line-highlight", true);
    } else if (file === "pictures" || file === "picture") {
      showCatPicture();
    } else if (state.sections[sectionName]) {
      addLines(state.sections[sectionName]);
    } else if (file === ".secrets") {
      addLine("  cat: .secrets: Permission denied", "line-highlight", true);
    } else {
      addLine(`  cat: ${escapeHTML(file)}: No such file or directory`, "line-highlight", true);
    }
    addLine("", null, false);
  } else if (cmd === "cat") {
    addLine("  cat: missing operand", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd.startsWith("rm ")) {
    const args = cmd.slice(3).trim();
    if (args === "-rf /" || args === "-rf /*" || args === "-rf /  " || args === "/") {
      addLine("  rm: it is dangerous to operate recursively on '/'", "line-highlight", true);
      addLine("  rm: use --no-preserve-root to override this failsafe", "line-highlight", true);
    } else if (args === "") {
      addLine("  rm: missing operand", "line-highlight", true);
    } else {
      addLine(`  rm: cannot remove '${escapeHTML(args)}': Permission denied`, "line-highlight", true);
    }
    addLine("", null, false);
  } else if (cmd === "rm") {
    addLine("  rm: missing operand", "line-highlight", true);
    addLine("  Try 'rm --help' for more information.", "line-comment", true);
    addLine("", null, false);
  } else if (cmd.startsWith("echo ")) {
    addLine("  " + escapeHTML(raw.trim().slice(5)), null, true);
    addLine("", null, false);
  } else if (cmd === "echo") {
    addLine("", null, false);
  } else if (cmd === "uname" || cmd === "uname -a") {
    addLine("  bnied.dev 1.0.0 SPACEDUCK-BIOS SMP " + new Date().toUTCString() + " JavaScript/ES2024 browser", null, true);
    addLine("", null, false);
  } else if (cmd === "uname -s") {
    addLine("  bnied.dev", null, true);
    addLine("", null, false);
  } else if (cmd === "uname -r") {
    addLine("  1.0.0", null, true);
    addLine("", null, false);
  } else if (cmd === "uname -m") {
    addLine("  JavaScript/ES2024", null, true);
    addLine("", null, false);
  } else if (cmd.startsWith("theme ")) {
    const themeName = cmd.slice(6).trim();
    if (state.THEME_NAMES.includes(themeName)) {
      document.documentElement.setAttribute("data-theme", themeName === "green" ? "" : themeName);
      if (themeName === "green") document.documentElement.removeAttribute("data-theme");
      addLine(`  theme set to '${escapeHTML(themeName)}'`, "line-ok", true);
    } else {
      addLine(`  unknown theme: ${escapeHTML(themeName)}`, "line-highlight", true);
      addLine("  available: " + state.THEME_NAMES.join(", "), "line-comment", true);
    }
    addLine("", null, false);
  } else if (cmd === "theme") {
    addLine("  available themes:", "line-comment", true);
    addLine("    green            default phosphor green", "line-highlight", true);
    addLine("    amber            warm amber phosphor", "line-highlight", true);
    addLine("    blue             cool blue phosphor", "line-highlight", true);
    addLine("    high-contrast    maximum readability", "line-highlight", true);
    addLine("    colorblind       deuteranopia-safe palette", "line-highlight", true);
    addLine("", null, false);
    addLine("  usage: theme &lt;name&gt;", "line-comment", true);
    addLine("", null, false);
  } else if (cmd === "whoami") {
    addLine("  visitor", null, true);
    addLine("", null, false);
  } else if (cmd === "pwd") {
    addLine("  /home/visitor", null, true);
    addLine("", null, false);
  } else if (cmd === "hostname" || cmd === "hostname -f") {
    addLine("  bnied.dev", null, true);
    addLine("", null, false);
  } else if (cmd === "date") {
    addLine("  " + new Date().toString(), null, true);
    addLine("", null, false);
  } else if (cmd === "uptime") {
    const elapsed = Math.floor((Date.now() - state.pageLoadTime) / 1000);
    const hrs = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const upStr = (hrs > 0 ? hrs + " hr " : "") + mins + " min, " + secs + " sec";
    addLine(`  ${timeStr} up ${upStr}, 1 user, load average: 0.42, 0.69, 1.337`, null, true);
    addLine("", null, false);
  } else if (cmd === "ls" || /^ls\s+-[lashFrt1]+$/.test(cmd) || /^ls\s+(-[lashFrt1]+\s+)+-[lashFrt1]+$/.test(cmd)) {
    runLs(cmd);
  } else if (cmd.startsWith("cd ")) {
    const dir = cmd.slice(3).trim();
    if (dir === "~" || dir === "/home/visitor" || dir === ".") {
      addLine("", null, false);
    } else {
      addLine(`  bash: cd: ${escapeHTML(dir)}: No such file or directory`, "line-highlight", true);
      addLine("", null, false);
    }
  } else if (cmd === "cd") {
    addLine("", null, false);
  } else if (cmd.startsWith("ping ")) {
    runPing(cmd.slice(5).trim());
  } else if (cmd === "ping") {
    addLine("  ping: usage error: Destination address required", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd === "vim" || cmd === "vi") {
    addLine("  Why would you do this to yourself?", "line-highlight", true);
    addLine("  (hint: you can't :q out of this one either)", "line-comment", true);
    addLine("", null, false);
  } else if (cmd === "emacs") {
    addLine("  A great operating system, lacking only a decent text editor.", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd === "nano") {
    addLine("  Finally, a sensible choice.", "line-ok", true);
    addLine("", null, false);
  } else if (cmd === "exit" || cmd === "logout") {
    addLine("  There is no escape.", "line-highlight", true);
    addLine("  You could try 'shutdown' though...", "line-comment", true);
    addLine("", null, false);
  } else if (cmd.startsWith("man ")) {
    const page = cmd.slice(4).trim();
    addLine(`  No manual entry for ${escapeHTML(page)}`, "line-highlight", true);
    addLine("  (but seriously, RTFM)", "line-comment", true);
    addLine("", null, false);
  } else if (cmd === "man") {
    addLine("  What manual page do you want?", "line-highlight", true);
    addLine("  For example, try 'man man'", "line-comment", true);
    addLine("", null, false);
  } else if (cmd === "fortune") {
    const quote = state.FORTUNES[Math.floor(Math.random() * state.FORTUNES.length)];
    addLine("  " + quote, "line-accent", true);
    addLine("", null, false);
  } else if (cmd === "cowsay" || cmd.startsWith("cowsay ")) {
    const msg = cmd === "cowsay" ? "moo" : raw.trim().slice(7);
    runCowsay(msg);
  } else if (cmd.startsWith("ssh ")) {
    const host = cmd.slice(4).trim();
    addLine(`  ssh: connect to host ${escapeHTML(host)} port 22: Connection refused`, "line-highlight", true);
    addLine("", null, false);
  } else if (cmd === "ssh") {
    addLine("  usage: ssh [-p port] [user@]hostname", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd.startsWith("curl ")) {
    const url = cmd.slice(5).trim();
    addLine(`  curl: (6) Could not resolve host: ${escapeHTML(url)}`, "line-highlight", true);
    addLine("", null, false);
  } else if (cmd === "curl") {
    addLine("  curl: try 'curl --help' for more information", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd === "make") {
    addLine("  make: *** No targets specified and no makefile found.  Stop.", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd.startsWith("make ")) {
    const target = cmd.slice(5).trim();
    if (target === "love") {
      addLine("  make: *** No rule to make target 'love'.  Stop.", "line-highlight", true);
      addLine("  (but I appreciate the sentiment)", "line-comment", true);
    } else if (target === "coffee" || target === "me a sandwich") {
      addLine("  make: *** No rule to make target '" + escapeHTML(target) + "'.  Stop.", "line-highlight", true);
      addLine("  (try sudo)", "line-comment", true);
    } else {
      addLine(`  make: *** No rule to make target '${escapeHTML(target)}'.  Stop.`, "line-highlight", true);
    }
    addLine("", null, false);
  } else if (cmd === "doom") {
    runDoom();
  } else if (cmd === "top" || cmd === "htop" || cmd === "btop") {
    runBtop();
  } else if (cmd === "shutdown" || cmd === "poweroff" || cmd === "halt" || cmd === "shutdown -h now") {
    runShutdown();
  } else if (cmd === "reboot" || cmd === "shutdown -r now") {
    runShutdown(true);
  } else if (cmd === "sl") {
    runSL();
  } else if (cmd === "neofetch") {
    runNeofetch();
  } else if (cmd === "cmatrix") {
    runCmatrix();
  } else if (cmd === "history") {
    state.history.slice().reverse().forEach((h, i) => {
      addLine(`  ${pad(i + 1, 4)}  ${escapeHTML(h)}`, null, true);
    });
    addLine("", null, false);
  } else if (cmd.startsWith("grep ")) {
    runGrep(cmd.slice(5).trim());
  } else if (cmd === "grep") {
    addLine("  Usage: grep &lt;pattern&gt;", "line-highlight", true);
    addLine("  Searches resume content for matching text", "line-comment", true);
    addLine("", null, false);
  } else if (cmd.startsWith("wget ")) {
    addLine(`  --${new Date().toISOString()}--`, "line-system", true);
    addLine(`  Resolving ${escapeHTML(cmd.slice(5).trim())}... failed: Name or service not known.`, "line-highlight", true);
    addLine(`  wget: unable to resolve host address '${escapeHTML(cmd.slice(5).trim())}'`, "line-highlight", true);
    addLine("", null, false);
  } else if (cmd === "wget") {
    addLine("  wget: missing URL", "line-highlight", true);
    addLine("  Usage: wget [OPTION]... [URL]...", "line-comment", true);
    addLine("", null, false);
  } else if (cmd.startsWith("apt-get ") || cmd.startsWith("apt ")) {
    addLine("  E: Could not open lock file /var/lib/dpkg/lock-frontend", "line-highlight", true);
    addLine("  E: Unable to acquire the dpkg frontend lock, are you root?", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd === "docker ps" || cmd === "docker ps -a") {
    runDockerPs();
  } else if (cmd.startsWith("docker")) {
    addLine("  Cannot connect to the Docker daemon at unix:///var/run/docker.sock.", "line-highlight", true);
    addLine("  Is the docker daemon running?", "line-comment", true);
    addLine("", null, false);
  } else if (cmd === "kubectl get pods" || cmd === "kubectl get pods -A" || cmd === "kubectl get po") {
    runKubectlPods();
  } else if (cmd.startsWith("kubectl")) {
    addLine("  error: the server doesn't have a resource type \"" + escapeHTML(cmd.split(" ").slice(2).join(" ") || "unknown") + "\"", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd === "git log") {
    runGitLog();
  } else if (cmd.startsWith("git ")) {
    addLine("  fatal: not a git repository (or any parent up to mount point /)", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd.startsWith("alias")) {
    addLine("  nice try.", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd === "whoami --verbose") {
    addLines(state.sections.about);
    addLines(state.sections.skills);
    addLines(state.sections.contact);
  } else if (cmd.startsWith("traceroute ") || cmd.startsWith("tracert ")) {
    const host = cmd.split(" ").slice(1).join(" ").trim();
    runTraceroute(host);
  } else if (cmd === "traceroute" || cmd === "tracert") {
    addLine("  Usage: traceroute &lt;host&gt;", "line-highlight", true);
    addLine("", null, false);
  } else if (cmd === "figlet") {
    addLine("  usage: figlet &lt;text&gt;", "line-comment", true);
    addLine("", null, false);
  } else if (cmd.startsWith("figlet ")) {
    renderPipelineResult({ lines: figletText(raw.trim().slice(7), state.DATA.figletFont), colorize: false });
  } else if (cmd === "lolcat") {
    addLine("  usage: lolcat &lt;text&gt;  (or pipe into it, e.g. fortune | lolcat)", "line-comment", true);
    addLine("", null, false);
  } else if (cmd.startsWith("lolcat ")) {
    renderPipelineResult({ lines: [raw.trim().slice(7)], colorize: true });
  } else if (state.sections[cmd]) {
    addLines(state.sections[cmd]);
  } else {
    addLine(`  command not found: ${escapeHTML(cmd)}`, "line-highlight", true);
    addLine("  type 'help' for available commands", "line-comment", true);
    addLine("", null, false);
  }

  scrollToBottom();
}
