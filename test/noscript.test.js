import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndex, noscriptHtml, readSources } from "../tools/gen-noscript.mjs";

test("index.html's noscript block is current with the section data", () => {
  const { html, sections, experience } = readSources();
  assert.equal(
    buildIndex(html, sections, experience), html,
    "index.html is stale — run: node tools/gen-noscript.mjs",
  );
});

test("the fallback carries the resume, with links and lists intact", () => {
  const { sections, experience } = readSources();
  const html = noscriptHtml(sections, experience);
  assert.ok(html.startsWith("<noscript>") && html.endsWith("</noscript>"));
  assert.match(html, /<h1>Benjamin Nied<\/h1>/);
  assert.match(html, /<h2>EXPERIENCE<\/h2>/);
  // every employer and project is reachable without JS
  assert.match(html, /<h3>APPLE <span class="dates">2018 - Present<\/span><\/h3>/);
  assert.match(html, /<h3>neofsn<\/h3>/);
  // bullets are a real list, and links survive as anchors
  assert.match(html, /<ul>\n<li>/);
  assert.match(html, /<a href="https:\/\/source\.tube\/spaceduck">/);
  // taglines and contact rows are emphasis, not structure
  assert.match(html, /<p><strong>Experienced\. Independent\. Results-oriented\.<\/strong><\/p>/);
});

test("prose is escaped but authored anchors are not", () => {
  const html = noscriptHtml(
    {
      about: [
        { text: "  Bare & ampersand, <not a tag>" },
        { text: '  <a href="https://x.test">x.test</a>', cls: "line-link" },
      ],
      contact: [], skills: [], experience: [], projects: [], education: [],
    },
    {},
  );
  assert.match(html, /<p>Bare &amp; ampersand, &lt;not a tag&gt;<\/p>/);
  assert.match(html, /<p class="link"><a href="https:\/\/x\.test">x\.test<\/a><\/p>/);
});
