// xcalc.js — pure TI-30-style calculator engine for the startx xcalc window,
// modeled on xcalc(1)'s default mode: AOS operator precedence (y^x over ×÷
// over +−), parentheses, INV-shifted functions, DRG angle modes, and the
// STO/RCL/SUM/EXC memory keys. No DOM — testable in node.
//
// xcalcPress(state, key) -> new state. Read state.display for the readout
// and state.drg / state.inv / state.memSet for the indicator row.

const PREC = { "+": 1, "-": 1, "*": 2, "/": 2, "pow": 3, "root": 3 };
const MAX_DIGITS = 10;
const MAX_PARENS = 15;

export function xcalcInit() {
  return withDisplay({
    entry: "0", value: 0, stack: [], mem: 0,
    drg: "DEG", inv: false, err: false, lastCe: false,
  });
}

export function xcalcPress(s, key) {
  if (s.err && key !== "ce" && key !== "ac") return s;
  const out = dispatch({ ...s, lastCe: false }, key, s.lastCe);
  return withDisplay(out);
}

function dispatch(s, key, wasCe) {
  if (/^[0-9]$/.test(key)) return digit(s, key);
  switch (key) {
    case ".": return decimal(s);
    case "+/-": return negate(s);
    case "ee": return exponent(s);
    case "+": case "-": case "*": case "/": return pushOp(s, key);
    case "pow": return pushOp(s, s.inv ? "root" : "pow");
    case "=": return equals(s);
    case "(": return openParen(s);
    case ")": return closeParen(s);
    case "sqrt": return s.inv ? unary(s, x => x * x) : unary(s, guard(Math.sqrt, x => x >= 0));
    case "sq": return unary(s, x => x * x);
    case "1/x": return unary(s, guard(x => 1 / x, x => x !== 0));
    case "sin": return trig(s, Math.sin, Math.asin);
    case "cos": return trig(s, Math.cos, Math.acos);
    case "tan": return trig(s, Math.tan, Math.atan);
    case "log": return s.inv ? unary(s, x => 10 ** x) : unary(s, guard(Math.log10, x => x > 0));
    case "ln": return s.inv ? unary(s, Math.exp) : unary(s, guard(Math.log, x => x > 0));
    case "fact": return unary(s, factorial);
    case "pi": return { ...s, entry: null, value: Math.PI, inv: false };
    case "e": return { ...s, entry: null, value: Math.E, inv: false };
    case "inv": return { ...s, inv: !s.inv };
    case "drg": return { ...s, drg: { DEG: "RAD", RAD: "GRAD", GRAD: "DEG" }[s.drg] };
    case "sto": return { ...s, mem: cur(s), entry: null, value: cur(s), inv: false };
    case "rcl": return { ...s, entry: null, value: s.mem, inv: false };
    case "sum": return { ...s, mem: s.mem + cur(s), entry: null, value: cur(s), inv: false };
    case "exc": return { ...s, entry: null, value: s.mem, mem: cur(s), inv: false };
    case "ce": return clearEntry(s, wasCe);
    case "ac": return { ...xcalcInit(), mem: s.mem, drg: s.drg };
    default: return s;
  }
}

// ── entry editing ──

function digit(s, d) {
  if (s.entry === null) return { ...s, entry: d };
  const [m, e] = s.entry.split("E");
  if (e !== undefined) {
    const sign = e.startsWith("-") ? "-" : "";
    const digits = (e.replace("-", "") + d).replace(/^0+(?=\d)/, "").slice(-2);
    return { ...s, entry: `${m}E${sign}${digits}` };
  }
  if (m.replace(/[^0-9]/g, "").length >= MAX_DIGITS) return s;
  return { ...s, entry: m === "0" ? d : m + d };
}

function decimal(s) {
  if (s.entry === null) return { ...s, entry: "0." };
  if (s.entry.includes(".") || s.entry.includes("E")) return s;
  return { ...s, entry: s.entry + "." };
}

function negate(s) {
  if (s.entry === null) return { ...s, value: -s.value };
  const [m, e] = s.entry.split("E");
  if (e !== undefined) {
    return { ...s, entry: `${m}E${e.startsWith("-") ? e.slice(1) : "-" + e}` };
  }
  return { ...s, entry: m.startsWith("-") ? m.slice(1) : "-" + m };
}

function exponent(s) {
  const base = s.entry === null ? fmt(s.value) : s.entry;
  if (base.includes("E") || base.includes("e")) return s;
  return { ...s, entry: base + "E0" };
}

function clearEntry(s, wasCe) {
  if (s.err) return { ...s, err: false, entry: "0", value: 0 };
  if (wasCe) return { ...s, stack: [], entry: "0", value: 0 };
  return { ...s, entry: "0", lastCe: true };
}

// ── evaluation ──

function cur(s) {
  return s.entry !== null ? Number(s.entry.replace("E", "e")) : s.value;
}

function apply(a, op, b) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return a / b;
    case "pow": return a ** b;
    case "root": return a ** (1 / b);
  }
}

function pushOp(s, op) {
  let x = cur(s);
  const st = s.stack.slice();
  while (st.length && !st.at(-1).paren && PREC[st.at(-1).op] >= PREC[op]) {
    const t = st.pop();
    x = apply(t.v, t.op, x);
  }
  if (!isFinite(x)) return errState(s);
  st.push({ v: x, op });
  return { ...s, stack: st, entry: null, value: x, inv: false };
}

function equals(s) {
  let x = cur(s);
  for (let i = s.stack.length - 1; i >= 0; i--) {
    if (s.stack[i].paren) continue;
    x = apply(s.stack[i].v, s.stack[i].op, x);
  }
  if (!isFinite(x)) return errState(s);
  return { ...s, stack: [], entry: null, value: x, inv: false };
}

function openParen(s) {
  if (s.stack.filter(t => t.paren).length >= MAX_PARENS) return s;
  return { ...s, stack: [...s.stack, { paren: true }] };
}

function closeParen(s) {
  let x = cur(s);
  const st = s.stack.slice();
  while (st.length && !st.at(-1).paren) {
    const t = st.pop();
    x = apply(t.v, t.op, x);
  }
  if (st.length) st.pop(); // the marker
  if (!isFinite(x)) return errState(s);
  return { ...s, stack: st, entry: null, value: x };
}

// ── functions ──

function unary(s, f) {
  const r = f(cur(s));
  if (r === null || !isFinite(r)) return errState(s);
  return { ...s, entry: null, value: r, inv: false };
}

function guard(f, ok) {
  return x => (ok(x) ? f(x) : null);
}

function trig(s, fwd, inv) {
  const K = { DEG: Math.PI / 180, RAD: 1, GRAD: Math.PI / 200 }[s.drg];
  if (!s.inv) return unary(s, x => fwd(x * K));
  return unary(s, x => {
    const r = inv(x);
    return Number.isNaN(r) ? null : r / K;
  });
}

function factorial(n) {
  if (n < 0 || n !== Math.round(n) || n > 69) return null;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// ── display ──

function errState(s) {
  return { ...s, err: true, entry: null, value: 0, stack: [] };
}

function fmt(n) {
  if (!isFinite(n)) return "Error";
  if (n === 0) return "0";
  if (Math.abs(n) >= 1e10 || Math.abs(n) < 1e-9) {
    return n.toExponential(6).replace(/(\.\d*?)0+e/, "$1e").replace(/\.e/, "e");
  }
  return Number(n.toPrecision(MAX_DIGITS)).toString();
}

function withDisplay(s) {
  return {
    ...s,
    display: s.err ? "Error" : s.entry !== null ? s.entry.replace("E", "e") : fmt(s.value),
    memSet: s.mem !== 0,
  };
}
