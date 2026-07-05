import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { netscapePages } from "../js/netscape-html.js";

const sections = JSON.parse(readFileSync(new URL("../data/sections.json", import.meta.url)));
const expData = JSON.parse(readFileSync(new URL("../data/experience.json", import.meta.url)));
const expKeys = Object.keys(expData);
const pages = netscapePages(sections, expData, expKeys);

test("netscapePages builds every page from real site data", () => {
  const keys = ["home", "about", "skills", "experience", "projects", "education", "contact"];
  for (const k of keys) {
    assert.ok(pages[k], `page ${k} exists`);
    assert.ok(pages[k].url.startsWith("http://bnied.dev/"), `page ${k} has a url`);
    assert.ok(pages[k].html.length > 0, `page ${k} has content`);
  }
  // home links to every section page; sections link back home
  for (const k of keys.slice(1)) {
    assert.ok(pages.home.html.includes(`data-page="${k}"`), `home links to ${k}`);
    assert.ok(pages[k].html.includes('data-page="home"'), `${k} links home`);
  }
});

test("home page has its period furniture", () => {
  assert.ok(pages.home.html.includes("ns-construction"));
  assert.ok(pages.home.html.includes("ns-counter"));
  assert.ok(pages.home.html.includes("ns-badge"));
  assert.ok(pages.home.html.includes("ns-blink"));
});

test("skills render as a bordered category table", () => {
  assert.ok(pages.skills.html.includes('<table class="ns-table">'));
  assert.ok(pages.skills.html.includes("<b>Kubernetes & Containers</b>"));
  assert.ok(pages.skills.html.includes("Puppet, Chef, Saltstack"));
});

test("experience splits roles with italic dates and re-flowed bullets", () => {
  const html = pages.experience.html;
  assert.ok(html.includes("<h3>APPLE // ASE Cassandra</h3>"));
  assert.ok(html.includes("<i>Site Reliability Engineer, 2021 - Present</i>"));
  assert.ok(html.includes("<h3>DATAPIPE, INC</h3>"));
  // continuation lines merged into single <li>
  assert.ok(html.includes("<li>Wrote daemon to monitor Cassandra pods in k8s namespaces, track operational states, and auto-replace pods in inoperative states past pre-configured durations</li>"));
  // terminal usage hints never make it in
  assert.ok(!html.includes("For details, run"));
});

test("projects keep real links and blink NEW! on recent work", () => {
  const html = pages.projects.html;
  assert.ok(html.includes('href="https://codeberg.org/bnied/neofsn"'));
  assert.ok(html.includes('<span class="ns-blink">NEW!</span>'));
  assert.ok(html.includes("<h2>Contributions</h2>"));
});

test("contact renders a table with a mailto link", () => {
  const html = pages.contact.html;
  assert.ok(html.includes('href="mailto:bnied@spaceduck.org"'));
  assert.ok(html.includes("<b>Email</b>"));
  assert.ok(html.includes('href="https://codeberg.org/bnied"'));
});
