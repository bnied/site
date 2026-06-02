import { test } from "node:test";
import assert from "node:assert/strict";
import {
  unameText, whoamiText, pwdText, hostnameText, dateText, uptimeText,
  lsRows, lsText, neofetchText,
} from "../js/textsources.js";

// Fixed reference time for deterministic assertions.
const now = new Date("2026-06-02T15:30:00Z");

test("unameText handles flags", () => {
  assert.equal(whoamiText()[0], "visitor");
  assert.equal(pwdText()[0], "/home/visitor");
  assert.equal(hostnameText()[0], "bnied.dev");
  assert.equal(unameText("-s", now)[0], "bnied.dev");
  assert.equal(unameText("-r", now)[0], "1.0.0");
  assert.equal(unameText("-m", now)[0], "JavaScript/ES2024");
  assert.ok(unameText("", now)[0].startsWith("bnied.dev 1.0.0 SPACEDUCK-BIOS SMP "));
  assert.ok(unameText("-a", now)[0].includes("JavaScript/ES2024 browser"));
});

test("dateText returns the date string", () => {
  assert.deepEqual(dateText(now), [now.toString()]);
});

test("uptimeText reports elapsed time and load average", () => {
  const pageLoadTime = now.getTime() - (3 * 3600 + 5 * 60 + 9) * 1000; // 3h 5m 9s ago
  const line = uptimeText(now, pageLoadTime)[0];
  assert.ok(line.includes("up 3 hr 5 min, 9 sec"));
  assert.ok(line.includes("load average: 0.42, 0.69, 1.337"));
});

test("lsRows returns rows with text and cls; lsText is the plain text", () => {
  const rows = lsRows("");
  assert.ok(rows.length > 0);
  assert.ok(rows.every(r => typeof r.text === "string" && "cls" in r));
  // no leading two-space indent in the row text
  assert.ok(rows.every(r => !r.text.startsWith("  ")));
  assert.deepEqual(lsText(""), rows.map(r => r.text));
});

test("lsRows -la includes the total line and hidden entries", () => {
  const rows = lsRows("-la");
  assert.equal(rows[0].text.startsWith("total "), true);
  const joined = rows.map(r => r.text).join("\n");
  assert.ok(joined.includes(".secrets"));
  assert.ok(joined.includes("-rw-r--r--"));
});

test("neofetchText renders plain ascii + info including uptime/theme/locale", () => {
  const ctx = {
    neofetchAscii: ["DUCK", "QUACK"],
    neofetchInfo: [{ label: "OS", value: "bnied.dev" }],
    now,
    pageLoadTime: now.getTime() - 60000, // 1 min
    theme: "amber",
    locale: "en-GB",
  };
  const lines = neofetchText(ctx);
  const joined = lines.join("\n");
  assert.ok(joined.includes("DUCK"));
  assert.ok(joined.includes("OS: bnied.dev"));
  assert.ok(joined.includes("Theme: amber"));
  assert.ok(joined.includes("Locale: en-GB"));
  assert.ok(joined.includes("Uptime: 1 mins"));
  // plain text — no HTML spans
  assert.ok(!joined.includes("<span"));
});
