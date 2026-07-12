import { test } from "node:test";
import assert from "node:assert/strict";
import { xcalcInit, xcalcPress } from "../js/xcalc.js";

function run(...keys) {
  let s = xcalcInit();
  for (const k of keys) s = xcalcPress(s, k);
  return s;
}
const disp = (...keys) => run(...keys).display;

test("digit entry, decimal point, and the 10-digit cap", () => {
  assert.equal(disp("1", "2", ".", "3"), "12.3");
  assert.equal(disp("0", ".", ".", "5"), "0.5");
  assert.equal(disp(..."12345678901234".split("")), "1234567890");
});

test("basic arithmetic and chaining", () => {
  assert.equal(disp("2", "+", "3", "="), "5");
  assert.equal(disp("7", "-", "1", "0", "="), "-3");
  assert.equal(disp("2", "+", "3", "=", "+", "1", "="), "6");
});

test("AOS precedence: multiplication binds tighter than addition", () => {
  assert.equal(disp("2", "+", "3", "*", "4", "="), "14");
  assert.equal(disp("1", "0", "-", "6", "/", "2", "="), "7");
});

test("y^x binds tightest; INV y^x takes the x-th root", () => {
  assert.equal(disp("2", "*", "2", "pow", "3", "="), "16");
  assert.equal(disp("2", "7", "inv", "pow", "3", "="), "3");
});

test("parentheses override precedence", () => {
  assert.equal(disp("(", "2", "+", "3", ")", "*", "4", "="), "20");
  assert.equal(disp("2", "*", "(", "1", "+", "(", "2", "*", "3", ")", ")", "="), "14");
});

test("square, square root, and reciprocal", () => {
  assert.equal(disp("9", "sqrt"), "3");
  assert.equal(disp("1", "2", "sq"), "144");
  assert.equal(disp("8", "1/x"), "0.125");
});

test("trig respects the DRG mode; INV inverts", () => {
  assert.equal(disp("3", "0", "sin"), "0.5");
  assert.equal(disp("0", ".", "5", "inv", "sin"), "30");
  assert.equal(run("drg").drg, "RAD");
  assert.equal(disp("0", "cos"), "1");
  assert.equal(run("drg", "drg").drg, "GRAD");
  assert.equal(disp("drg", "drg", "1", "0", "0", "sin"), "1");
});

test("log and ln with INV shifts", () => {
  assert.equal(disp("1", "0", "0", "0", "log"), "3");
  assert.equal(disp("3", "inv", "log"), "1000");
  assert.equal(disp("1", "ln"), "0");
  assert.equal(disp("1", "inv", "ln"), "2.718281828");
});

test("pi, e, factorial, and EE exponent entry", () => {
  assert.equal(disp("pi"), "3.141592654");
  assert.equal(disp("5", "fact"), "120");
  assert.equal(disp("1", ".", "5", "ee", "3"), "1.5e3");
  assert.equal(disp("1", ".", "5", "ee", "3", "+", "0", "="), "1500");
  assert.equal(disp("2", "ee", "3", "+/-", "+", "0", "="), "0.002");
});

test("+/- negates entries and results", () => {
  assert.equal(disp("4", "+/-"), "-4");
  assert.equal(disp("2", "+", "3", "=", "+/-"), "-5");
});

test("errors lock the display until CE or AC", () => {
  const err = run("1", "/", "0", "=");
  assert.equal(err.display, "Error");
  assert.equal(xcalcPress(err, "5").display, "Error");
  assert.equal(xcalcPress(err, "ce").display, "0");
  assert.equal(disp("2", "+/-", "sqrt"), "Error");
  assert.equal(disp("3", ".", "5", "fact"), "Error");
  assert.equal(disp("7", "0", "fact"), "Error");
});

test("CE clears the entry once, everything pending twice", () => {
  assert.equal(disp("2", "+", "9", "ce", "3", "="), "5");
  assert.equal(disp("2", "+", "9", "ce", "ce", "3"), "3");
  assert.equal(disp("2", "+", "9", "ce", "ce", "3", "="), "3");
});

test("memory: STO, RCL, SUM, EXC survive AC", () => {
  assert.equal(disp("4", "2", "sto", "ac", "rcl"), "42");
  assert.equal(disp("1", "0", "sto", "5", "sum", "rcl"), "15");
  const s = run("7", "sto", "3", "exc");
  assert.equal(s.display, "7");
  assert.equal(s.mem, 3);
  assert.equal(run("5", "sto").memSet, true);
  assert.equal(run("5").memSet, false);
});

test("AC resets state but keeps memory and angle mode", () => {
  const s = run("9", "sto", "drg", "1", "+", "2", "ac");
  assert.equal(s.display, "0");
  assert.equal(s.mem, 9);
  assert.equal(s.drg, "RAD");
});
