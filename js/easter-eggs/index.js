// Barrel module re-exporting every easter-egg handler. Consumers
// (commands.js) import from here rather than from each file individually.

export { runBtop } from "./btop.js";
export { runDoom } from "./doom.js";
export { runLs } from "./ls.js";
export { runShutdown } from "./shutdown.js";
export { runSL } from "./sl.js";
export { runCmatrix } from "./cmatrix.js";
export { runDmesg, probeEnvironment } from "./dmesg.js";
export { runTraceroute } from "./traceroute.js";
export { runPing } from "./ping.js";
export {
  runNeofetch,
  runGrep,
  runDockerPs,
  runKubectlPods,
  runGitLog,
  showCatPicture,
  runCowsay,
} from "./misc.js";
