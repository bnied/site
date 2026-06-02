import { test } from "node:test";
import assert from "node:assert/strict";
import { segmentInfo, commonPrefix, ghostSuggestion, completeInput } from "../js/completion.js";

const CMDS = ["about","cat","cowsay","clear","lolcat","ls","neofetch","figlet",
  "theme","theme amber","theme green","experience","experience datapipe"];

test("segmentInfo splits on the last pipe and leading whitespace", () => {
  assert.deepEqual(segmentInfo("neofetch | lol"), { head: "neofetch |", lead: " ", token: "lol" });
  assert.deepEqual(segmentInfo("lol"), { head: "", lead: "", token: "lol" });
});

test("commonPrefix returns the longest shared prefix", () => {
  assert.equal(commonPrefix(["lolcat","lol"]), "lol");
  assert.equal(commonPrefix(["cat","cowsay","clear"]), "c");
  assert.equal(commonPrefix([]), "");
});

test("ghostSuggestion returns the remainder only for a unique match", () => {
  assert.equal(ghostSuggestion("neof", CMDS), "etch");
  assert.equal(ghostSuggestion("c", CMDS), null);   // ambiguous
  assert.equal(ghostSuggestion("", CMDS), null);
});

test("completeInput completes a unique command and appends a space", () => {
  assert.equal(completeInput("neof", CMDS), "neofetch ");
  assert.equal(completeInput("lo", CMDS), "lolcat ");
});

test("completeInput is pipe-aware", () => {
  assert.equal(completeInput("neofetch | lol", CMDS), "neofetch | lolcat ");
});

test("completeInput fills the common prefix when ambiguous, else null", () => {
  assert.equal(completeInput("l", CMDS), null);          // lolcat/ls common prefix 'l' == token
  assert.equal(completeInput("theme a", CMDS), "theme amber ");
  assert.equal(completeInput("xyz", CMDS), null);        // no match
});
