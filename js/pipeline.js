// Pipe engine. Splits raw input on `|`, runs the first stage as a source
// (input === null) and each subsequent stage as a filter (input = prior
// stage's plain-text lines). Returns plain text plus a `colorize` flag set
// by lolcat. No DOM — escaping and rainbow rendering happen in commands.js.

import { figletText } from "./figlet.js";
import { cowsayText } from "./cowsay.js";
import {
  unameText, whoamiText, pwdText, hostnameText, dateText, uptimeText, lsText, neofetchText,
  psText, freeText, dfText, yesText, dmesgText,
} from "./textsources.js";

export function hasPipe(raw) {
  return raw.includes("|");
}

// Each handler: (input, args, ctx) => string[] of plain (un-escaped) text.
//   input: null when this stage is the source, else the prior stage's lines.
const PIPEABLE = {
  echo(input, args) {
    return input ?? [args];
  },
  fortune(input, args, ctx) {
    if (input) return input;
    return [ctx.fortunes[Math.floor(Math.random() * ctx.fortunes.length)]];
  },
  cat(input, args, ctx) {
    if (input) return input;
    const name = args.replace(/\.txt$/, "").trim();
    if (name === "resume" && ctx.resumeLines) return ctx.resumeLines;
    const section = ctx.sections[name];
    if (!section) return [`cat: ${args}: No such file or directory`];
    return section.map(l => l.text);
  },
  figlet(input, args, ctx) {
    // explicit args override piped input (mirrors real CLI tools)
    const text = args.length ? args : (input ? input.join(" ") : "");
    return figletText(text, ctx.font);
  },
  cowsay(input, args) {
    // explicit args override piped input (mirrors real CLI tools)
    const msg = args.length ? args : (input ? input.join("\n") : "moo");
    return cowsayText(msg);
  },
  lolcat(input, args) {
    return input ?? (args ? [args] : []);
  },
  uname(input, args, ctx) {
    return unameText(args, ctx.now);
  },
  whoami() {
    return whoamiText();
  },
  pwd() {
    return pwdText();
  },
  hostname() {
    return hostnameText();
  },
  date(input, args, ctx) {
    return dateText(ctx.now);
  },
  uptime(input, args, ctx) {
    return uptimeText(ctx.now, ctx.pageLoadTime);
  },
  ls(input, args) {
    return lsText(args);
  },
  neofetch(input, args, ctx) {
    return neofetchText(ctx);
  },
  ps(input, args, ctx) {
    return psText(ctx.processes || []);
  },
  free(input, args) {
    return freeText(args);
  },
  df(input, args) {
    return dfText(args);
  },
  yes(input, args) {
    return yesText(args);
  },
  dmesg(input, args, ctx) {
    return dmesgText(ctx.env);
  },
};

const COLORIZERS = new Set(["lolcat"]);

export function runPipeline(raw, ctx) {
  const stages = raw.split("|").map(s => s.trim());
  if (stages.some(s => s === "")) {
    return { error: "pipe: syntax error near unexpected token '|'" };
  }
  let lines = null;
  let colorize = false;
  for (const stage of stages) {
    const sp = stage.indexOf(" ");
    const name = (sp === -1 ? stage : stage.slice(0, sp)).toLowerCase();
    const args = sp === -1 ? "" : stage.slice(sp + 1).trim();
    const fn = PIPEABLE[name];
    if (!fn) return { error: `${name}: command not found` };
    if (COLORIZERS.has(name)) colorize = true;
    lines = fn(lines, args, ctx);
  }
  return { lines: lines ?? [], colorize };
}
