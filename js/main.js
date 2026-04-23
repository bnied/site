import { loadData } from "./data.js";
import { initInput } from "./input.js";
import { initNoise } from "./effects.js";
import { boot } from "./boot.js";
import { runCommand } from "./commands.js";

initInput(runCommand);
initNoise();
loadData().then(() => boot());
