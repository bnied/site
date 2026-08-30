import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BASE_COMMANDS, REAL_COMMANDS } from "../js/data.js";

const help = JSON.parse(readFileSync(new URL("../data/help.json", import.meta.url)));
const documented = help.filter(l => l.cmd).map(l => l.cmd);

// One direction only. Most commands are deliberately undocumented — the decoys
// are meant to be stumbled into — so help being a subset is the design. What
// must not happen is help advertising a command that no longer exists.
test("help does not document a command that does not exist", () => {
  for (const cmd of documented) {
    assert.ok(BASE_COMMANDS.includes(cmd), `help.json lists '${cmd}', which is not a command`);
  }
});

test("every documented command is offered by did-you-mean", () => {
  for (const cmd of documented) {
    assert.ok(REAL_COMMANDS.includes(cmd), `'${cmd}' is documented but not in REAL_COMMANDS`);
  }
});

test("did-you-mean only suggests real commands", () => {
  for (const cmd of REAL_COMMANDS) {
    assert.ok(BASE_COMMANDS.includes(cmd), `REAL_COMMANDS lists '${cmd}', which is not a command`);
  }
});

test("no duplicates in either list", () => {
  for (const [name, list] of [["BASE_COMMANDS", BASE_COMMANDS], ["REAL_COMMANDS", REAL_COMMANDS]]) {
    assert.equal(new Set(list).size, list.length, `${name} has a duplicate`);
  }
});
