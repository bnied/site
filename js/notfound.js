// Echoes the path the visitor actually asked for into the fake prompt on
// 404.html, so the page reads like the terminal rather than a generic error.
//
// A separate file rather than an inline script: the CSP has no 'unsafe-inline',
// and a hash would have to be kept in sync from inside the nginx config.
document.addEventListener("DOMContentLoaded", () => {
  const el = document.querySelector(".nf-path-echo");
  if (!el) return;
  // textContent, never innerHTML: the path is attacker-controlled in the sense
  // that anyone can put anything in a URL and send someone the link.
  el.textContent = decodeURI(location.pathname).slice(0, 120);
});
