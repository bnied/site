(() => {
  "use strict";

  const output     = document.getElementById("output");
  const cmdInput   = document.getElementById("cmd-input");
  const terminal   = document.getElementById("terminal");
  const inputSizer = document.getElementById("input-sizer");
  const noiseCanvas = document.getElementById("noise");
  const pageLoadTime = Date.now();

  // ── Data (loaded from JSON) ──────────────────────────
  let FORTUNES, ASCII_NAME, sections, experienceDetail, helpText;
  let EXP_KEYS, COMMANDS, THEME_NAMES;
  let DATA = {}; // easter-eggs and ascii data

  // ── Cursor sync ──────────────────────────────────────

  function syncCursor() {
    inputSizer.textContent = cmdInput.value || "";
  }

  cmdInput.addEventListener("input", () => {
    syncCursor();
    showTabGhost();
  });

  // ── Noise grain renderer ─────────────────────────────

  function initNoise() {
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

  // ── Constants ─────────────────────────────────────────

  const SEP = "══════════════════════════════════════════════════════════════";
  const SEP_THIN = "──────────────────────────────────────────────────────────────";

  // ── Data loader ──────────────────────────────────────

  function resolveSEP(lines) {
    return lines.map(l => ({
      ...l,
      text: l.text === "SEP" ? SEP : l.text === "SEP_THIN" ? SEP_THIN : l.text,
    }));
  }

  async function loadData() {
    const [sectionsData, expData, helpData, fortunesData, asciiData, eggsData] = await Promise.all([
      fetch("data/sections.json").then(r => r.json()),
      fetch("data/experience.json").then(r => r.json()),
      fetch("data/help.json").then(r => r.json()),
      fetch("data/fortunes.json").then(r => r.json()),
      fetch("data/ascii.json").then(r => r.json()),
      fetch("data/easter-eggs.json").then(r => r.json()),
    ]);

    // Resolve SEP placeholders in all line arrays
    sections = {};
    for (const [k, v] of Object.entries(sectionsData)) {
      sections[k] = resolveSEP(v);
    }

    experienceDetail = {};
    for (const [k, v] of Object.entries(expData)) {
      experienceDetail[k] = resolveSEP(v);
    }

    helpText = resolveSEP(helpData);
    FORTUNES = fortunesData;
    ASCII_NAME = asciiData.name;
    DATA = { ...asciiData, ...eggsData };

    // Derive computed arrays
    EXP_KEYS = Object.keys(experienceDetail);
    THEME_NAMES = ["green", "amber", "blue", "high-contrast", "colorblind"];
    COMMANDS = [
      "about", "skills", "experience", "projects", "education", "contact",
      "all", "clear", "help", "theme",
      ...EXP_KEYS.map(k => "experience " + k),
      ...THEME_NAMES.map(t => "theme " + t),
    ];
  }

  // ── Rendering helpers ────────────────────────────────

  function addLine(text, cls, animate) {
    const div = document.createElement("div");
    div.className = "line" + (cls ? " " + cls : "") + (animate ? " line-enter" : "");
    div.innerHTML = text;
    output.appendChild(div);
  }

  function addLines(lines) {
    lines.forEach(l => addLine(l.text, l.cls, true));
  }

  function scrollToBottom() {
    terminal.scrollTop = terminal.scrollHeight;
  }

  function escapeHTML(str) {
    const el = document.createElement("span");
    el.textContent = str;
    return el.innerHTML;
  }

  function pad(str, len, right) {
    str = String(str);
    if (right) return str.padEnd(len);
    return str.padStart(len);
  }

  // ── Tab completion ───────────────────────────────────

  function getCompletion(partial) {
    if (!partial) return null;
    const lower = partial.toLowerCase();
    const matches = COMMANDS.filter(c => c.startsWith(lower));
    return matches.length === 1 ? matches[0] : null;
  }

  function showTabGhost() {
    const existing = document.getElementById("tab-ghost");
    if (existing) existing.remove();

    const val = cmdInput.value;
    const match = getCompletion(val);
    if (match && val.length > 0 && match !== val.toLowerCase()) {
      const ghost = document.createElement("span");
      ghost.id = "tab-ghost";
      ghost.textContent = match.slice(val.length);
      inputSizer.parentNode.insertBefore(ghost, document.getElementById("cursor"));
    }
  }

  // ── Boot sequence ────────────────────────────────────

  function boot() {
    const POST_DELAY = 1600; // wait for CRT power-on

    // Hide the prompt during the boot sequence
    const inputLine = document.getElementById("input-line");
    if (inputLine) inputLine.style.display = "none";

    const biosLines = DATA.boot || [];

    const profileLines = [];
    ASCII_NAME.forEach(l => profileLines.push({ text: l, cls: "ascii-art", delay: 30 }));

    profileLines.push({ text: "", delay: 50 });
    profileLines.push({ text: "  Site Reliability Engineer", cls: "line-comment", delay: 30 });
    profileLines.push({ text: "  bnied@spaceduck.org", cls: "line-comment", delay: 30 });
    profileLines.push({ text: "", delay: 30 });
    profileLines.push({ text: SEP, cls: "line-separator", delay: 50 });
    profileLines.push({ text: "", delay: 30 });
    profileLines.push({ text: "  Type 'help' for available commands.", cls: "line-ok", delay: 0 });
    profileLines.push({ text: "", delay: 0 });

    const allBootLines = [...biosLines, ...profileLines];

    let i = 0;
    let cumulativeDelay = POST_DELAY;

    function scheduleNext() {
      if (i >= allBootLines.length) {
        // After all boot lines have rendered, reveal the prompt
        setTimeout(() => {
          if (inputLine) inputLine.style.display = "flex";
          scrollToBottom();
          cmdInput.focus();
        }, cumulativeDelay + 150);
        return;
      }
      const line = allBootLines[i];
      const lineDelay = line.delay !== undefined ? line.delay : 35;
      cumulativeDelay += lineDelay;

      setTimeout(() => {
        addLine(line.text, line.cls, false);
        scrollToBottom();
      }, cumulativeDelay);

      i++;
      // Schedule synchronously (all timeouts fire independently)
      scheduleNext();
    }

    scheduleNext();
  }

  // ── Command handling ─────────────────────────────────

  function runCommand(raw) {
    const cmd = raw.trim().toLowerCase();

    addLine("", null, false);
    const promptHTML = document.querySelector("#input-line .prompt").innerHTML;
    addLine(`<span class="prompt">${promptHTML}</span>${escapeHTML(raw)}`, "line-prompt", false);

    if (cmd === "") {
      scrollToBottom();
      return;
    }

    if (cmd === "help" || cmd === "?") {
      addLines(helpText);
    } else if (cmd === "clear" || cmd === "cls") {
      output.innerHTML = "";
      scrollToBottom();
      return;
    } else if (cmd === "all") {
      addLines(sections.about);
      addLines(sections.contact);
      addLines(sections.skills);
      addLines(sections.experience);
      // Show all experience details in the 'all' view
      for (const key of EXP_KEYS) {
        addLines(experienceDetail[key]);
      }
      addLines(sections.projects);
      addLines(sections.education);
    } else if (cmd.startsWith("experience ")) {
      const sub = cmd.slice(11).trim();
      if (experienceDetail[sub]) {
        addLines(experienceDetail[sub]);
      } else {
        addLine(`  unknown role: ${escapeHTML(sub)}`, "line-highlight", true);
        addLine("  available: " + EXP_KEYS.join(", "), "line-comment", true);
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
      } else if (sections[sectionName]) {
        addLines(sections[sectionName]);
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
      const validThemes = ["green", "amber", "blue", "high-contrast", "colorblind"];
      if (validThemes.includes(themeName)) {
        document.documentElement.setAttribute("data-theme", themeName === "green" ? "" : themeName);
        if (themeName === "green") document.documentElement.removeAttribute("data-theme");
        addLine(`  theme set to '${escapeHTML(themeName)}'`, "line-ok", true);
      } else {
        addLine(`  unknown theme: ${escapeHTML(themeName)}`, "line-highlight", true);
        addLine("  available: " + validThemes.join(", "), "line-comment", true);
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
      const elapsed = Math.floor((Date.now() - pageLoadTime) / 1000);
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
      const quote = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
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
      history.slice().reverse().forEach((h, i) => {
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
      addLines(sections.about);
      addLines(sections.skills);
      addLines(sections.contact);
    } else if (cmd.startsWith("traceroute ") || cmd.startsWith("tracert ")) {
      const host = cmd.split(" ").slice(1).join(" ").trim();
      runTraceroute(host);
    } else if (cmd === "traceroute" || cmd === "tracert") {
      addLine("  Usage: traceroute &lt;host&gt;", "line-highlight", true);
      addLine("", null, false);
    } else if (sections[cmd]) {
      addLines(sections[cmd]);
    } else {
      addLine(`  command not found: ${escapeHTML(cmd)}`, "line-highlight", true);
      addLine("  type 'help' for available commands", "line-comment", true);
      addLine("", null, false);
    }

    scrollToBottom();
  }

  // ── neofetch ──────────────────────────────────────────

  function runNeofetch() {
    const uptimeMs = Date.now() - pageLoadTime;
    const uptimeMin = Math.floor(uptimeMs / 60000);
    const uptimeHr = Math.floor(uptimeMin / 60);
    const upStr = uptimeHr > 0 ? `${uptimeHr} hours, ${uptimeMin % 60} mins` : `${uptimeMin} mins`;
    const theme = document.documentElement.getAttribute("data-theme") || "green";

    const artW = 24;
    const ascii = (DATA.neofetch || []).map(l => l.padEnd(artW));

    // Build info from JSON template + dynamic values
    const info = (DATA.neofetchInfo || []).map(item => ({ ...item }));
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

  // ── cmatrix ──────────────────────────────────────────

  function runCmatrix() {
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

  // ── grep ─────────────────────────────────────────────

  function runGrep(pattern) {
    if (!pattern) {
      addLine("  Usage: grep &lt;pattern&gt;", "line-highlight", true);
      addLine("", null, false);
      return;
    }

    const lowerPattern = pattern.toLowerCase();
    let matchCount = 0;

    // Search through all sections + experience details
    const allSections = { ...sections, ...experienceDetail };

    for (const [name, lines] of Object.entries(allSections)) {
      const matches = [];
      lines.forEach(l => {
        // Strip HTML tags for search
        const plainText = l.text.replace(/<[^>]*>/g, "");
        if (plainText.toLowerCase().includes(lowerPattern)) {
          matches.push(plainText);
        }
      });

      if (matches.length > 0) {
        addLine(`  <span class="line-accent">${escapeHTML(name)}:</span>`, null, true);
        matches.forEach(m => {
          // Highlight the match
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

  // ── docker ps ────────────────────────────────────────

  // ── ls ───────────────────────────────────────────────

  function runLs(cmd) {
    // Parse flags from the command (e.g. "ls -lash" -> "lash")
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

    // File listing
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
      // Rough fake: experience/projects are "newest"
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
      // POSIX block size of 1024 (ls -s / -k)
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

      // Determine column widths
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
      // Default compact 3-column layout
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

  function runDockerPs() {
    const containers = DATA.docker || [];

    addLine(`  <span class="line-comment">CONTAINER ID   IMAGE                    STATUS          PORTS                      NAMES</span>`, null, true);
    containers.forEach(c => {
      addLine(`  ${c.id}   ${pad(c.image, 24, true)} ${pad(c.status, 15, true)} ${pad(c.ports, 26, true)} ${c.name}`, null, true);
    });
    addLine("", null, false);
  }

  // ── kubectl get pods ─────────────────────────────────

  function runKubectlPods() {
    const pods = DATA.kubectl || [];

    addLine(`  <span class="line-comment">NAME                            READY   STATUS      RESTARTS   AGE</span>`, null, true);
    pods.forEach(p => {
      const statusCls = p.status === "Running" ? "line-ok" : "line-comment";
      const line = `  ${pad(p.name, 31, true)} ${pad(p.ready, 7, true)} <span class="${statusCls}">${pad(p.status, 11, true)}</span> ${pad(p.restarts, 10, true)} ${p.age}`;
      addLine(line, null, true);
    });
    addLine("", null, false);
  }

  // ── git log ──────────────────────────────────────────

  function runGitLog() {
    const commits = DATA.gitlog || [];

    commits.forEach(c => {
      addLine(`  <span class="line-highlight">${c.hash}</span> - ${escapeHTML(c.msg)}`, null, true);
      addLine(`  <span class="line-comment">  ${c.author}, ${c.date}</span>`, null, true);
      addLine("", null, false);
    });
  }

  // ── traceroute ───────────────────────────────────────

  function runTraceroute(host) {
    const safeHost = escapeHTML(host);
    addLine(`  traceroute to ${safeHost} (93.184.216.34), 15 hops max, 60 byte packets`, "line-system", true);
    scrollToBottom();

    const inputLine = document.getElementById("input-line");
    inputLine.style.display = "none";

    const hops = [
      { n: 1,  host: "gateway.local",           ip: "192.168.1.1" },
      { n: 2,  host: "isp-edge-01.provider.net", ip: "10.0.0.1" },
      { n: 3,  host: "core-rtr-01.provider.net", ip: "72.14.215.85" },
      { n: 4,  host: "ae-5.r01.nycmny17.us",    ip: "154.54.44.169" },
      { n: 5,  host: "* * *",                    ip: null },
      { n: 6,  host: "peer-as13335.1200.nyc1",  ip: "198.32.118.161" },
      { n: 7,  host: "cloudflare-edge.cf",       ip: "104.16.132.229" },
      { n: 8,  host: safeHost,                   ip: "93.184.216.34" },
    ];

    let i = 0;
    let done = false;

    function finish(interrupted) {
      if (done) return;
      done = true;
      document.removeEventListener("keydown", onKey, true);
      if (interrupted) {
        addLine("  ^C", "line-highlight", true);
      }
      addLine("", null, false);
      inputLine.style.display = "flex";
      cmdInput.focus();
      scrollToBottom();
    }

    function nextHop() {
      if (done) return;
      if (i >= hops.length) {
        finish(false);
        return;
      }

      const hop = hops[i];
      if (hop.ip === null) {
        addLine(`  ${pad(hop.n, 2)}  ${hop.host}`, "line-comment", true);
      } else {
        const t1 = (Math.random() * 20 + i * 5).toFixed(3);
        const t2 = (Math.random() * 20 + i * 5).toFixed(3);
        const t3 = (Math.random() * 20 + i * 5).toFixed(3);
        addLine(`  ${pad(hop.n, 2)}  ${pad(hop.host, 28, true)} (${hop.ip})  ${t1} ms  ${t2} ms  ${t3} ms`, null, true);
      }
      scrollToBottom();
      i++;
      setTimeout(nextHop, 600);
    }

    function onKey(e) {
      if (e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
        e.preventDefault();
        finish(true);
      }
    }

    setTimeout(() => {
      if (!done) document.addEventListener("keydown", onKey, true);
    }, 100);

    // Start first hop after a short delay
    setTimeout(nextHop, 400);
  }

  // ── DOOM ─────────────────────────────────────────────

  function runDoom() {
    const inputLine = document.getElementById("input-line");
    inputLine.style.display = "none";

    addLine("", null, false);
    addLine("  ================================================", "line-separator", true);
    addLine("       DOOM v1.9 Shareware -- id Software 1993", "line-accent", true);
    addLine("  ================================================", "line-separator", true);
    addLine("", null, false);
    addLine("  Loading WAD file...", "line-system", true);
    scrollToBottom();

    // Create the DOOM container
    const doomOverlay = document.createElement("div");
    doomOverlay.id = "doom-overlay";
    doomOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 100;
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;

    const exitHint = document.createElement("div");
    exitHint.style.cssText = `
      position: fixed;
      top: 10px;
      right: 16px;
      z-index: 102;
      color: #33ff33;
      font-family: 'Fira Code', monospace;
      font-size: 12px;
      opacity: 0.6;
      pointer-events: none;
    `;
    exitHint.textContent = "Press ESC twice to exit";

    const doomContainer = document.createElement("div");
    doomContainer.id = "doom-container";
    doomContainer.style.cssText = `
      width: 100%;
      height: 100%;
      max-width: 960px;
      max-height: 600px;
    `;

    doomOverlay.appendChild(doomContainer);
    doomOverlay.appendChild(exitHint);
    document.body.appendChild(doomOverlay);

    // Load js-dos
    const jsdosCSS = document.createElement("link");
    jsdosCSS.rel = "stylesheet";
    jsdosCSS.href = "https://v8.js-dos.com/latest/js-dos.css";
    document.head.appendChild(jsdosCSS);

    let dosInstance = null;

    const jsdosScript = document.createElement("script");
    jsdosScript.src = "https://v8.js-dos.com/latest/js-dos.js";
    jsdosScript.onload = () => {
      addLine("  Initializing emulator...", "line-system", true);
      scrollToBottom();

      try {
        dosInstance = Dos(doomContainer, {
          url: "assets/doom.jsdos",
          autoStart: true,
          noCloud: true,
          noNetworking: true,
          kiosk: true,
          theme: "night",
          imageRendering: "pixelated",
          renderAspect: "4/3",
        });
      } catch (err) {
        addLine(`  Error: ${err.message}`, "line-highlight", true);
        cleanup();
      }
    };

    jsdosScript.onerror = () => {
      addLine("  ERROR: Failed to load js-dos emulator", "line-highlight", true);
      addLine("  Check your network connection and try again", "line-comment", true);
      addLine("", null, false);
      cleanup();
    };

    document.head.appendChild(jsdosScript);

    // Track ESC presses for exit
    let escCount = 0;
    let escTimer = null;

    function onEsc(e) {
      if (e.key === "Escape") {
        escCount++;
        if (escCount >= 2) {
          e.preventDefault();
          e.stopPropagation();
          cleanup();
        } else {
          clearTimeout(escTimer);
          escTimer = setTimeout(() => { escCount = 0; }, 800);
        }
      } else {
        escCount = 0;
      }
    }

    document.addEventListener("keydown", onEsc, true);

    function cleanup() {
      document.removeEventListener("keydown", onEsc, true);
      // Stop the js-dos emulator if it's running
      if (dosInstance) {
        try {
          if (typeof dosInstance.stop === "function") {
            dosInstance.stop();
          } else if (typeof dosInstance.then === "function") {
            dosInstance.then(d => d && d.stop && d.stop()).catch(() => {});
          }
        } catch (err) {
          console.warn("Failed to stop DOS:", err);
        }
        dosInstance = null;
      }
      doomOverlay.remove();
      jsdosCSS.remove();
      jsdosScript.remove();
      addLine("", null, false);
      addLine("  Thanks for playing DOOM.", "line-ok", true);
      addLine("", null, false);
      inputLine.style.display = "flex";
      cmdInput.focus();
      scrollToBottom();
    }
  }

  // ── btop ──────────────────────────────────────────────

  function runBtop() {
    const inputLine = document.getElementById("input-line");
    inputLine.style.display = "none";
    const savedOutput = output.innerHTML;
    output.innerHTML = "";

    const btopEl = document.createElement("div");
    btopEl.style.cssText = "white-space:pre;font-size:inherit;line-height:1.4;";
    // Force all text inside btop to normal letter-spacing so fixed-width alignment works
    const btopStyle = document.createElement("style");
    btopStyle.textContent = "#btop-view, #btop-view * { letter-spacing: 0 !important; }";
    document.head.appendChild(btopStyle);
    btopEl.id = "btop-view";
    output.appendChild(btopEl);

    const processes = (DATA.btopProcesses || []).map(p => ({ ...p }));

    const cpuCores = 4;
    const cpuHistory = Array.from({ length: cpuCores }, () => Array(30).fill(0));

    function randBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function cpuBar(pct, width) {
      const filled = Math.round((pct / 100) * width);
      const empty = width - filled;
      const blocks = "█".repeat(filled) + "░".repeat(empty);
      let color = "line-ok";
      if (pct > 70) color = "line-highlight";
      if (pct > 90) color = "line-accent";
      return `<span class="${color}">${blocks}</span>`;
    }

    function memBar(used, total, width) {
      const pct = (used / total) * 100;
      const filled = Math.round((pct / 100) * width);
      const empty = width - filled;
      const blocks = "█".repeat(filled) + "░".repeat(empty);
      return `<span class="line-accent">${blocks}</span>`;
    }

    function sparkline(history) {
      const chars = "▁▂▃▄▅▆▇█";
      return history.map(v => {
        const idx = Math.min(Math.floor((v / 100) * chars.length), chars.length - 1);
        return chars[idx];
      }).join("");
    }



    // Build a fixed-width line, then colorize segments via a helper.
    // This ensures every line is exactly W visible chars between the borders.
    const W = 60;
    const SEP_H = "─".repeat(W);

    function boxLine(text) {
      // text must be exactly W chars of visible content
      return "│" + text + "│";
    }

    function fixedLine(text) {
      // Pad or truncate to exactly W visible chars
      if (text.length > W) return text.slice(0, W);
      return text + " ".repeat(W - text.length);
    }

    function colorize(line, rules) {
      // rules: array of { start, end, cls }
      // Apply spans to character ranges. Process right-to-left to preserve indices.
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
      const uptimeMs = Date.now() - pageLoadTime;
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

      // Header (no box)
      const loadStr = `${randBetween(0.2, 0.8).toFixed(2)} ${randBetween(0.4, 1.0).toFixed(2)} ${randBetween(0.6, 1.4).toFixed(2)}`;
      const headerText = ` btop  ${timeStr}  up ${upStr}  load: ${loadStr}`;
      out.push(colorize(headerText, [
        { start: 0, end: 5, cls: "line-heading" },
        { start: 5, end: headerText.length, cls: "line-comment" },
      ]));

      out.push(`<span class="line-separator">┌${SEP_H}┐</span>`);

      // CPU
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

      // Memory
      const memTitle = fixedLine(" MEMORY");
      out.push(colorize(boxLine(memTitle), [
        { start: 1, end: 8, cls: "line-heading" },
      ]));

      // RAM line
      const memPct = pad(((usedMem / totalMem) * 100).toFixed(0), 3) + "%";
      const memFilled = Math.round((usedMem / totalMem) * barW);
      const memBarStr = "█".repeat(memFilled) + "░".repeat(barW - memFilled);
      const memAfter = ` ${memPct}  ${pad(usedMem, 5)}M / ${totalMem}M`;
      const ramPlain = fixedLine("  RAM   " + memBarStr + memAfter);
      out.push(colorize(boxLine(ramPlain), [
        { start: 9, end: 9 + barW, cls: "line-accent" },
      ]));

      // Swap line
      const swapPct = pad(((usedSwap / totalSwap) * 100).toFixed(0), 3) + "%";
      const swapFilled = Math.round((usedSwap / totalSwap) * barW);
      const swapBarStr = "█".repeat(swapFilled) + "░".repeat(barW - swapFilled);
      const swapAfter = ` ${swapPct}  ${pad(usedSwap, 5)}M / ${totalSwap}M`;
      const swapPlain = fixedLine("  Swap  " + swapBarStr + swapAfter);
      out.push(colorize(boxLine(swapPlain), [
        { start: 9, end: 9 + barW, cls: "line-accent" },
      ]));

      out.push(`<span class="line-separator">├${SEP_H}┤</span>`);

      // Processes
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

  // ── cowsay ────────────────────────────────────────────

  // ── cat pictures ─────────────────────────────────────

  function showCatPicture() {
    const pictures = DATA.catPictures || [];
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

    // Re-scroll after image loads to account for its height
    const img = container.querySelector("img");
    img.addEventListener("load", scrollToBottom);
  }

  function runCowsay(message) {
    const msg = message || "moo";
    const top = "   " + "_".repeat(msg.length + 2);
    const mid = "  < " + escapeHTML(msg) + " >";
    const bot = "   " + "-".repeat(msg.length + 2);
    const cow = [
      top,
      mid,
      bot,
      "          \\   ^__^",
      "           \\  (oo)\\_______",
      "              (__)\\       )\\/\\",
      "                  ||----w |",
      "                  ||     ||",
    ];
    cow.forEach(l => addLine(l, "line-accent", true));
    addLine("", null, false);
  }

  // ── ping (animated) ──────────────────────────────────

  function runPing(host) {
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

  // ── shutdown sequence ─────────────────────────────────

  function runShutdown(reboot) {
    const inputLine = document.getElementById("input-line");
    inputLine.style.display = "none";

    const shutdownLines = [
      { text: "", delay: 200 },
      { text: "  Broadcast message from visitor@bnied.dev", cls: "line-system", delay: 100 },
      { text: "  The system is going down for " + (reboot ? "reboot" : "poweroff") + " NOW!", cls: "line-system", delay: 400 },
      { text: "", delay: 300 },
      { text: "  [  OK  ] Stopped target Timers.", cls: "line-ok", delay: 80 },
      { text: "  [  OK  ] Stopped target Graphical Interface.", cls: "line-ok", delay: 80 },
      { text: "  [  OK  ] Stopped target Multi-User System.", cls: "line-ok", delay: 120 },
      { text: "  [ INFO ] Stopping SSH daemon...", cls: "line-system", delay: 80 },
      { text: "  [  OK  ] Stopped SSH daemon.", cls: "line-ok", delay: 150 },
      { text: "  [ INFO ] Stopping Network Manager...", cls: "line-system", delay: 80 },
      { text: "  [  OK  ] Stopped Network Manager.", cls: "line-ok", delay: 200 },
      { text: "  [ INFO ] Unmounting filesystems...", cls: "line-system", delay: 80 },
      { text: "  [  OK  ] Unmounted /home.", cls: "line-ok", delay: 80 },
      { text: "  [  OK  ] Unmounted /boot.", cls: "line-ok", delay: 80 },
      { text: "  [  OK  ] Reached target Unmount All Filesystems.", cls: "line-ok", delay: 300 },
      { text: "  [  OK  ] Reached target Final Step.", cls: "line-ok", delay: 200 },
      { text: "", delay: 400 },
      { text: reboot ? "  [ INFO ] Rebooting..." : "  [ INFO ] Powering off...", cls: "line-system", delay: 0 },
    ];

    let i = 0;
    let cumulativeDelay = 0;

    function scheduleNext() {
      if (i >= shutdownLines.length) {
        // Fade to black after all lines have rendered
        setTimeout(() => {
          const overlay = document.createElement("div");
          overlay.style.cssText = "position:fixed;inset:0;background:#000;z-index:999;opacity:0;transition:opacity 1.5s;";
          document.body.appendChild(overlay);
          requestAnimationFrame(() => overlay.style.opacity = "1");

          if (reboot) {
            setTimeout(() => {
              overlay.remove();
              output.innerHTML = "";
              inputLine.style.display = "flex";
              boot();
            }, 3000);
          }
        }, cumulativeDelay + 800);
        return;
      }

      const line = shutdownLines[i];
      cumulativeDelay += (line.delay !== undefined ? line.delay : 80);

      setTimeout(() => {
        addLine(line.text, line.cls, true);
        scrollToBottom();
      }, cumulativeDelay);

      i++;
      scheduleNext();
    }

    scheduleNext();
  }

  // ── sl (steam locomotive) ─────────────────────────────

  function runSL() {
    const trainFrames = DATA.train || [[]];

    const trainWidth = 58;
    const termWidth = Math.floor(terminal.clientWidth / 8.4); // approx char width
    const inputLine = document.getElementById("input-line");
    inputLine.style.display = "none";

    const trainContainer = document.createElement("div");
    trainContainer.className = "line";
    trainContainer.style.cssText = "position:relative;height:10.5em;overflow:hidden;white-space:pre;";
    output.appendChild(trainContainer);

    const trainEl = document.createElement("div");
    trainEl.className = "ascii-art";
    trainEl.style.cssText = "position:absolute;top:0;white-space:pre;color:var(--p1);";
    trainContainer.appendChild(trainEl);

    let pos = termWidth;
    let frame = 0;
    const speed = 40;

    const interval = setInterval(() => {
      const currentFrame = trainFrames[frame % trainFrames.length];
      const pad = pos > 0 ? " ".repeat(pos) : "";
      const displayLines = currentFrame.map(line => {
        const shifted = pad + line;
        if (pos < 0) {
          return shifted.slice(Math.abs(pos) > shifted.length ? shifted.length : 0);
        }
        return shifted;
      });
      trainEl.textContent = displayLines.join("\n");
      pos -= 2;
      frame++;

      if (pos < -(trainWidth + 5)) {
        cleanup();
      }
    }, speed);

    function cleanup() {
      clearInterval(interval);
      document.removeEventListener("keydown", onKey, true);
      trainContainer.remove();
      inputLine.style.display = "flex";
      cmdInput.focus();
      scrollToBottom();
    }

    function onKey(e) {
      if (e.key === "q" || e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
        e.preventDefault();
        cleanup();
      }
    }
    document.addEventListener("keydown", onKey, true);

    scrollToBottom();
  }

  // ── Input handling ───────────────────────────────────

  const history = [];
  let historyIdx = -1;

  cmdInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const val = cmdInput.value;
      if (val.trim()) history.unshift(val);
      historyIdx = -1;
      runCommand(val);
      cmdInput.value = "";
      syncCursor();
      clearTabGhost();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = getCompletion(cmdInput.value);
      if (match) {
        cmdInput.value = match;
        syncCursor();
        clearTabGhost();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx < history.length - 1) {
        historyIdx++;
        cmdInput.value = history[historyIdx];
        syncCursor();
        showTabGhost();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        historyIdx--;
        cmdInput.value = history[historyIdx];
      } else {
        historyIdx = -1;
        cmdInput.value = "";
      }
      syncCursor();
      showTabGhost();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      output.innerHTML = "";
    }
  });

  function clearTabGhost() {
    const ghost = document.getElementById("tab-ghost");
    if (ghost) ghost.remove();
  }

  // keep focus on input
  document.addEventListener("click", () => cmdInput.focus());

  // ── Init ─────────────────────────────────────────────
  initNoise();
  loadData().then(() => boot());
})();
