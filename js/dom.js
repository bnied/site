// DOM element references, resolved once at module load.
// Safe because modules are deferred — the DOM is parsed before any
// module code runs.

export const output      = document.getElementById("output");
export const cmdInput    = document.getElementById("cmd-input");
export const terminal    = document.getElementById("terminal");
export const inputSizer  = document.getElementById("input-sizer");
export const noiseCanvas = document.getElementById("noise");
