// Pure cowsay bubble builder. No DOM — returns raw (un-escaped) text lines;
// callers escape at render time. Shared by the direct `cowsay` command
// (js/easter-eggs/misc.js) and the pipe engine (js/pipeline.js).

export function cowsayText(message) {
  const msg = message || "moo";
  return [
    "   " + "_".repeat(msg.length + 2),
    "  < " + msg + " >",
    "   " + "-".repeat(msg.length + 2),
    "          \\   ^__^",
    "           \\  (oo)\\_______",
    "              (__)\\       )\\/\\",
    "                  ||----w |",
    "                  ||     ||",
  ];
}
