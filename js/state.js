// Shared mutable state. Populated by data.js at boot, read by every module
// that needs it. Also holds values set at module-load time (pageLoadTime).

export const state = {
  // Set at module load
  pageLoadTime: Date.now(),

  // Populated by loadData()
  sections: null,
  experienceDetail: null,
  FORTUNES: null,
  ASCII_NAME: null,
  DATA: {},
  helpText: null,

  // Derived by loadData()
  EXP_KEYS: [],
  COMMANDS: [],

  // Static
  THEME_NAMES: ["green", "amber", "blue", "high-contrast", "colorblind"],

  // Command history (shared between input.js and the `history` command)
  history: [],
};
