// netscape-html.js — pure generator for the startx easter egg's "graphical
// site". Converts the terminal's section JSON into period-correct mid-90s
// HTML pages (bitmap type, <hr> rules, bordered tables, <blink>, an under-
// construction banner, a hit counter). No DOM access — testable in node.

import { IDENTITY, DATES_RE, plainText, entries as flatten } from "./sections-model.js";

// Section links must survive into the pages, so keep inline HTML.
const entries = block => flatten(block, { keepHtml: true });

// Projects young enough to deserve a blinking NEW! sticker.
const NEW_PROJECTS = new Set(["neofsn", "kfsn"]);

function aboutHtml(sections) {
  const parts = ["<h2>About Me</h2><hr>"];
  for (const e of entries(sections.about)) {
    if (e.cls === "line-heading") continue;
    if (e.cls === "line-highlight") parts.push(`<p><b>${e.text}</b></p>`);
    else if (e.cls === "line-accent") parts.push(`<p><i>${e.text}</i></p>`);
    else parts.push(`<p>${e.text}</p>`);
  }
  return parts.join("\n");
}

function skillsHtml(sections) {
  const rows = [];
  let cat = null;
  let items = [];
  const flush = () => {
    if (cat) rows.push(`<tr><td><b>${cat}</b></td><td>${items.join("<br>")}</td></tr>`);
    cat = null;
    items = [];
  };
  for (const e of entries(sections.skills)) {
    if (e.cls === "line-heading") continue;
    if (e.cls === "line-highlight") {
      flush();
      cat = e.text;
    } else if (e.cls === "line-bullet") {
      items.push(e.text);
    }
  }
  flush();
  return `<h2>Technical Skills</h2><hr>\n<table class="ns-table">${rows.join("")}</table>`;
}

function experienceHtml(experienceDetail, expKeys) {
  const parts = ["<h2>Work Experience</h2><hr>"];
  for (const key of expKeys) {
    const es = entries(experienceDetail[key]);
    const head = es.find(e => e.cls === "line-heading");
    const hl = es.find(e => e.cls === "line-highlight");
    let role = hl ? hl.text : "";
    let dates = "";
    const m = role.match(DATES_RE);
    if (m) {
      role = m[1];
      dates = m[2];
    }
    parts.push(`<h3>${head ? head.text : key}</h3>`);
    parts.push(`<p><i>${role}${dates ? ", " + dates : ""}</i></p>`);
    const bullets = es.filter(e => e.cls === "line-bullet").map(e => `<li>${e.text}</li>`);
    parts.push(`<ul>${bullets.join("")}</ul>`);
  }
  return parts.join("\n");
}

function projectsHtml(sections) {
  const parts = ["<h2>Software Projects</h2><hr>"];
  for (const e of entries(sections.projects)) {
    if (e.cls === "line-heading") {
      if (/contribution/i.test(plainText(e.text))) {
        parts.push("<h2>Contributions</h2><hr>");
      }
    } else if (e.cls === "line-accent") {
      const name = plainText(e.text);
      const sticker = NEW_PROJECTS.has(name) ? ' <span class="ns-blink">NEW!</span>' : "";
      parts.push(`<h3>${e.text}${sticker}</h3>`);
    } else if (e.cls === "line-link") {
      parts.push(`<p class="ns-ext">${e.text}</p>`);
    } else {
      parts.push(`<p>${e.text}</p>`);
    }
  }
  return parts.join("\n");
}

function educationHtml(sections) {
  const parts = ["<h2>Education</h2><hr>"];
  for (const e of entries(sections.education)) {
    if (e.cls === "line-heading") continue;
    if (e.cls === "line-accent") {
      const m = plainText(e.text).match(DATES_RE);
      parts.push(m ? `<h3>${m[1]}</h3><p><i>${m[2]}</i></p>` : `<h3>${e.text}</h3>`);
    } else if (e.cls === "line-comment") {
      parts.push(`<p><i>${e.text}</i></p>`);
    } else {
      parts.push(`<p>${e.text}</p>`);
    }
  }
  return parts.join("\n");
}

function contactHtml(sections) {
  const rows = [];
  for (const e of entries(sections.contact)) {
    if (e.cls === "line-heading") continue;
    const m = plainText(e.text).match(/^(\w+)\s+(.+)$/);
    if (!m) continue;
    const label = m[1][0].toUpperCase() + m[1].slice(1);
    const value = e.text.includes("<a ")
      ? e.text.replace(/^\s*\w+\s+/, "")
      : `<a href="mailto:${m[2]}">${m[2]}</a>`;
    rows.push(`<tr><td><b>${label}</b></td><td>${value}</td></tr>`);
  }
  return [
    "<h2>Contact Information</h2><hr>",
    `<table class="ns-table">${rows.join("")}</table>`,
    "<p><i>PGP key available upon request. Finger me for my .plan.</i></p>",
  ].join("\n");
}

function homeHtml() {
  return [
    "<center>",
    `<h1>~ ${IDENTITY.name} ~</h1>`,
    `<p><i>${IDENTITY.title}</i></p>`,
    '<div class="ns-construction"><b>UNDER CONSTRUCTION SINCE 2008</b></div>',
    "</center>",
    "<hr>",
    "<p>Welcome to my home page on the World Wide Web!</p>",
    "<p>This site is best viewed with Netscape Navigator at 800x600.</p>",
    "<ul>",
    '<li><a href="#" data-page="about">About Me</a></li>',
    '<li><a href="#" data-page="skills">Technical Skills</a></li>',
    '<li><a href="#" data-page="experience">Work Experience</a></li>',
    '<li><a href="#" data-page="projects">Software Projects</a> <span class="ns-blink">NEW!</span></li>',
    '<li><a href="#" data-page="education">Education</a></li>',
    '<li><a href="#" data-page="contact">Contact Information</a></li>',
    "</ul>",
    "<hr>",
    "<center>",
    "<p>You are visitor number</p>",
    '<span class="ns-counter"><span>0</span><span>0</span><span>0</span><span>0</span><span>4</span><span>2</span></span>',
    '<p class="ns-badges">',
    '<span class="ns-badge">Made with vi</span>',
    '<span class="ns-badge ns-badge-n">Netscape NOW!</span>',
    '<span class="ns-badge">Best viewed on a CRT</span>',
    '<span class="ns-badge">Valid HTML 2.0</span>',
    "</p>",
    "</center>",
  ].join("\n");
}

/**
 * Build every page of the graphical site.
 *
 * @returns {Record<string, { title: string, url: string, html: string }>}
 */
export function netscapePages(sections, experienceDetail, expKeys) {
  const pages = {
    home: { title: "Welcome to bnied.dev", url: "http://bnied.dev/index.html", html: homeHtml() },
    about: { title: "About Me", url: "http://bnied.dev/about.html", html: aboutHtml(sections) },
    skills: { title: "Technical Skills", url: "http://bnied.dev/skills.html", html: skillsHtml(sections) },
    experience: {
      title: "Work Experience",
      url: "http://bnied.dev/experience.html",
      html: experienceHtml(experienceDetail, expKeys),
    },
    projects: { title: "Software Projects", url: "http://bnied.dev/projects.html", html: projectsHtml(sections) },
    education: { title: "Education", url: "http://bnied.dev/education.html", html: educationHtml(sections) },
    contact: { title: "Contact Information", url: "http://bnied.dev/contact.html", html: contactHtml(sections) },
  };

  for (const [key, page] of Object.entries(pages)) {
    if (key !== "home") {
      page.html += '\n<hr>\n<p class="ns-footer"><a href="#" data-page="home">Back to Home Page</a></p>';
    }
  }
  return pages;
}
