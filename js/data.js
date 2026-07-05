// Data loader. Fetches JSON assets in parallel, resolves SEP placeholders,
// and populates state.js. Called once from main.js before boot.

import { state } from "./state.js";

export const SEP      = "══════════════════════════════════════════════════════════════";
export const SEP_THIN = "──────────────────────────────────────────────────────────────";

export function resolveSEP(lines) {
  return lines.map(l => ({
    ...l,
    text: l.text === "SEP" ? SEP : l.text === "SEP_THIN" ? SEP_THIN : l.text,
  }));
}

export async function loadData() {
  const [sectionsData, expData, helpData, fortunesData, asciiData, eggsData, figletFont] = await Promise.all([
    fetch("data/sections.json").then(r => r.json()),
    fetch("data/experience.json").then(r => r.json()),
    fetch("data/help.json").then(r => r.json()),
    fetch("data/fortunes.json").then(r => r.json()),
    fetch("data/ascii.json").then(r => r.json()),
    fetch("data/easter-eggs.json").then(r => r.json()),
    fetch("data/figlet-font.json").then(r => r.json()),
  ]);

  state.sections = {};
  for (const [k, v] of Object.entries(sectionsData)) {
    state.sections[k] = resolveSEP(v);
  }

  state.experienceDetail = {};
  for (const [k, v] of Object.entries(expData)) {
    state.experienceDetail[k] = resolveSEP(v);
  }

  state.helpText = resolveSEP(helpData);
  state.FORTUNES = fortunesData;
  state.ASCII_NAME = asciiData.name;
  state.DATA = { ...asciiData, ...eggsData, figletFont };

  state.EXP_KEYS = Object.keys(state.experienceDetail);
  state.COMMANDS = [
    "about", "skills", "experience", "projects", "education", "contact",
    "all", "clear", "help", "theme", "crt", "figlet", "lolcat",
    "cat", "echo", "fortune", "cowsay", "neofetch", "ls", "uname", "whoami",
    "pwd", "hostname", "date", "uptime", "history", "doom", "btop", "top",
    "htop", "sl", "cmatrix", "traceroute", "ping", "grep", "man", "ssh",
    "curl", "make", "wget", "reboot", "shutdown", "poweroff", "halt", "exit",
    "logout", "vim", "vi", "emacs", "nano", "sudo", "su", "cd", "rm", "docker",
    "kubectl", "git", "alias", "ps", "free", "df", "yes", "who", "kill",
    "killall", "passwd", "chmod", "chown", "telnet",
    ...state.EXP_KEYS.map(k => "experience " + k),
    ...state.THEME_NAMES.map(t => "theme " + t),
  ];
}
