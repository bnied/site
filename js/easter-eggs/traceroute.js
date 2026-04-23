// traceroute / tracert easter egg — animated fake network hops.

import { cmdInput } from "../dom.js";
import { addLine, escapeHTML, pad, scrollToBottom } from "../render.js";

export function runTraceroute(host) {
  const safeHost = escapeHTML(host);
  addLine(`  traceroute to ${safeHost} (93.184.216.34), 15 hops max, 60 byte packets`, "line-system", true);
  scrollToBottom();

  const inputLine = document.getElementById("input-line");
  inputLine.style.display = "none";

  const hops = [
    { n: 1,  host: "gateway.local",           ip: "192.168.1.1" },
    { n: 2,  host: "isp-edge-01.provider.net", ip: "10.0.0.1" },
    { n: 3,  host: "core-rtr-01.provider.net", ip: "72.14.215.85" },
    { n: 4,  host: "ae-5.r01.nycmny17.us",    ip: "154.54.44.169" },
    { n: 5,  host: "* * *",                    ip: null },
    { n: 6,  host: "peer-as13335.1200.nyc1",  ip: "198.32.118.161" },
    { n: 7,  host: "cloudflare-edge.cf",       ip: "104.16.132.229" },
    { n: 8,  host: safeHost,                   ip: "93.184.216.34" },
  ];

  let i = 0;
  let done = false;

  function finish(interrupted) {
    if (done) return;
    done = true;
    document.removeEventListener("keydown", onKey, true);
    if (interrupted) {
      addLine("  ^C", "line-highlight", true);
    }
    addLine("", null, false);
    inputLine.style.display = "flex";
    cmdInput.focus();
    scrollToBottom();
  }

  function nextHop() {
    if (done) return;
    if (i >= hops.length) {
      finish(false);
      return;
    }

    const hop = hops[i];
    if (hop.ip === null) {
      addLine(`  ${pad(hop.n, 2)}  ${hop.host}`, "line-comment", true);
    } else {
      const t1 = (Math.random() * 20 + i * 5).toFixed(3);
      const t2 = (Math.random() * 20 + i * 5).toFixed(3);
      const t3 = (Math.random() * 20 + i * 5).toFixed(3);
      addLine(`  ${pad(hop.n, 2)}  ${pad(hop.host, 28, true)} (${hop.ip})  ${t1} ms  ${t2} ms  ${t3} ms`, null, true);
    }
    scrollToBottom();
    i++;
    setTimeout(nextHop, 600);
  }

  function onKey(e) {
    if (e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
      e.preventDefault();
      finish(true);
    }
  }

  setTimeout(() => {
    if (!done) document.addEventListener("keydown", onKey, true);
  }, 100);

  setTimeout(nextHop, 400);
}
