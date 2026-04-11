(() => {
  "use strict";

  const output     = document.getElementById("output");
  const cmdInput   = document.getElementById("cmd-input");
  const terminal   = document.getElementById("terminal");
  const inputSizer = document.getElementById("input-sizer");
  const noiseCanvas = document.getElementById("noise");
  const pageLoadTime = Date.now();

  const FORTUNES = [
    "It's not DNS. There's no way it's DNS. It was DNS.",
    "There are only two hard things in CS: cache invalidation, naming things, and off-by-one errors.",
    "Monitoring is not observability. But it's a start.",
    "The cloud is just someone else's computer that's on fire.",
    "Have you tried turning it off and on again?",
    "It works on my machine. Ship the machine.",
    "There is no such thing as a temporary fix.",
    "The first rule of SRE: don't page someone who can't fix the problem.",
    "Nines don't matter if users aren't happy.",
    "Everything fails all the time. -- Werner Vogels",
    "Hope is not a strategy.",
    "If you haven't tested your backups, you don't have backups.",
    "There are two types of sysadmins: those who have lost data, and those who will.",
    "chmod 777 is not a fix.",
    "Friends don't let friends write to /dev/null without logging first.",
    "A distributed system is one where a computer you didn't even know existed can break your system.",
    "To err is human; to really foul things up requires root access.",
    "Weeks of coding can save you hours of planning.",
    "The best incident is the one that never happens. The second best is the one you learn from.",
    "Remember: 'rm -rf /' is a career-limiting move.",
  ];

  // ── Cursor sync ──────────────────────────────────────

  function syncCursor() {
    inputSizer.textContent = cmdInput.value || "";
  }

  cmdInput.addEventListener("input", () => {
    syncCursor();
    showTabGhost();
  });

  // ── Noise grain renderer ─────────────────────────────

  function initNoise() {
    const ctx = noiseCanvas.getContext("2d");
    let w, h;

    function resize() {
      w = noiseCanvas.width  = noiseCanvas.offsetWidth / 2;
      h = noiseCanvas.height = noiseCanvas.offsetHeight / 2;
    }
    resize();
    window.addEventListener("resize", resize);

    function drawNoise() {
      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      requestAnimationFrame(drawNoise);
    }
    drawNoise();
  }

  // ── Section data ─────────────────────────────────────

  const SEP = "══════════════════════════════════════════════════════════════";
  const SEP_THIN = "──────────────────────────────────────────────────────────────";

  const ASCII_NAME = [
    " ██████╗ ███████╗███╗   ██╗     ███╗   ██╗██╗███████╗██████╗ ",
    " ██╔══██╗██╔════╝████╗  ██║     ████╗  ██║██║██╔════╝██╔══██╗",
    " ██████╔╝█████╗  ██╔██╗ ██║     ██╔██╗ ██║██║█████╗  ██║  ██║",
    " ██╔══██╗██╔══╝  ██║╚██╗██║     ██║╚██╗██║██║██╔══╝  ██║  ██║",
    " ██████╔╝███████╗██║ ╚████║     ██║ ╚████║██║███████╗██████╔╝",
    " ╚═════╝ ╚══════╝╚═╝  ╚═══╝     ╚═╝  ╚═══╝╚═╝╚══════╝╚═════╝ ",
  ];

  const sections = {
    about: [
      { text: SEP, cls: "line-separator" },
      { text: "  ABOUT", cls: "line-heading" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "  Site Reliability Engineer with over a decade of" },
      { text: "  professional experience building and operating" },
      { text: "  infrastructure at scale." },
      { text: "" },
      { text: "  Experienced. Independent. Results-oriented.", cls: "line-accent" },
      { text: "" },
      { text: "  Certified Kubernetes Administrator (CKA), 2020", cls: "line-highlight" },
      { text: "" },
    ],

    contact: [
      { text: SEP, cls: "line-separator" },
      { text: "  CONTACT", cls: "line-heading" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "  email     bnied@spaceduck.org", cls: "line-accent" },
      { text: "  github    <a href=\"https://github.com/bnied\">github.com/bnied</a>", cls: "line-link" },
      { text: "  linkedin  <a href=\"https://www.linkedin.com/in/bnied\">linkedin.com/in/bnied</a>", cls: "line-link" },
      { text: "" },
    ],

    skills: [
      { text: SEP, cls: "line-separator" },
      { text: "  SKILLS", cls: "line-heading" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "  Kubernetes & Containers", cls: "line-highlight" },
      { text: "Cluster provisioning from scratch, bare metal -> k8s migrations", cls: "line-bullet" },
      { text: "Helm charts, Docker Swarm -> k8s, zero-downtime upgrades", cls: "line-bullet" },
      { text: "Maintaining and repairing clusters for full lifetime", cls: "line-bullet" },
      { text: "Event-driven Kubernetes automation", cls: "line-bullet" },
      { text: "" },
      { text: "  Configuration Management", cls: "line-highlight" },
      { text: "Puppet, Chef, Saltstack", cls: "line-bullet" },
      { text: "" },
      { text: "  Operating Systems", cls: "line-highlight" },
      { text: "RHEL, Oracle Linux, CentOS, Fedora, Ubuntu", cls: "line-bullet" },
      { text: "macOS, FreeBSD, OpenBSD", cls: "line-bullet" },
      { text: "" },
      { text: "  Languages", cls: "line-highlight" },
      { text: "Python, Rust, Ruby", cls: "line-bullet" },
      { text: "C, C++, Objective-C, Kotlin, Swift", cls: "line-bullet" },
      { text: "" },
      { text: "  Hardware & Infrastructure", cls: "line-highlight" },
      { text: "Assembly, configuration, diagnosis, migration, repair, replacement", cls: "line-bullet" },
      { text: "Extensive experience in systems design, development, deployment,", cls: "line-bullet" },
      { text: "    and operations at scale" },
      { text: "" },
    ],

    experience: [
      { text: SEP, cls: "line-separator" },
      { text: "  EXPERIENCE", cls: "line-heading" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "  APPLE                                          2018 - Present", cls: "line-accent" },
      { text: "  SRE // ASE Cassandra                           2021 - Present", cls: "line-highlight" },
      { text: "  SRE // ACI Postgres                            2020 - 2021", cls: "line-highlight" },
      { text: "  SRE // ACI Observability                       2018 - 2020", cls: "line-highlight" },
      { text: "" },
      { text: "  LINKEDIN, INC                                  2016 - 2018", cls: "line-accent" },
      { text: "  Senior Site Reliability Engineer", cls: "line-highlight" },
      { text: "" },
      { text: "  WORK MARKET, INC                               2015 - 2016", cls: "line-accent" },
      { text: "  Senior DevOps Engineer", cls: "line-highlight" },
      { text: "" },
      { text: "  SHUTTERSTOCK, INC                              2013 - 2015", cls: "line-accent" },
      { text: "  Site Reliability Engineer", cls: "line-highlight" },
      { text: "" },
      { text: "  DATAPIPE, INC                                  2008 - 2013", cls: "line-accent" },
      { text: "  Datacenter Technician / Operational Support Engineer", cls: "line-highlight" },
      { text: "" },
      { text: "  For details, run:  experience &lt;role&gt;", cls: "line-comment" },
      { text: "  e.g. 'experience apple-cassandra'", cls: "line-comment" },
      { text: "" },
      { text: "  available roles:", cls: "line-comment" },
      { text: "    apple-cassandra   apple-postgres   apple-observability", cls: "line-comment" },
      { text: "    linkedin          workmarket       shutterstock", cls: "line-comment" },
      { text: "    datapipe", cls: "line-comment" },
      { text: "" },
    ],

    projects: [
      { text: SEP, cls: "line-separator" },
      { text: "  PROJECTS", cls: "line-heading" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "  ls-rust", cls: "line-accent" },
      { text: "  <a href=\"https://github.com/bnied/ls-rust\">github.com/bnied/ls-rust</a>", cls: "line-link" },
      { text: "  An implementation of ls written in Rust." },
      { text: "" },
      { text: "  kernel-ml-aufs", cls: "line-accent" },
      { text: "  <a href=\"https://github.com/bnied/kernel-ml-aufs\">github.com/bnied/kernel-ml-aufs</a>", cls: "line-link" },
      { text: "  Mainline Linux kernel packages for RHEL/CentOS/OEL 7 & 8" },
      { text: "  AUFS storage driver for Docker." },
      { text: "" },
      { text: "  kernel-lt-aufs", cls: "line-accent" },
      { text: "  <a href=\"https://github.com/bnied/kernel-lt-aufs\">github.com/bnied/kernel-lt-aufs</a>", cls: "line-link" },
      { text: "  Longterm support kernel packages for RHEL/CentOS 6 & 7" },
      { text: "  with AUFS support for Docker." },
      { text: "" },
      { text: "  optopus", cls: "line-accent" },
      { text: "  <a href=\"https://github.com/optopus/optopus\">github.com/optopus/optopus</a>", cls: "line-link" },
      { text: "  CMDB for tracking servers and networking equipment." },
      { text: "" },
      { text: "  optopus-ldap-admin", cls: "line-accent" },
      { text: "  <a href=\"https://github.com/optopus/optopus-ldap-admin\">github.com/optopus/optopus-ldap-admin</a>", cls: "line-link" },
      { text: "  Optopus plugin for LDAP administration." },
      { text: "" },
    ],

    education: [
      { text: SEP, cls: "line-separator" },
      { text: "  EDUCATION", cls: "line-heading" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "  Fairleigh Dickinson University          2005 - 2007", cls: "line-accent" },
      { text: "  B.S. in Computer Science" },
      { text: "" },
      { text: "  Sussex County Community College         2003 - 2005", cls: "line-accent" },
      { text: "  A.S. in Computer Science" },
      { text: "" },
    ],
  };

  // ── Experience detail sub-sections ────────────────────

  const experienceDetail = {
    "apple-cassandra": [
      { text: SEP, cls: "line-separator" },
      { text: "  APPLE // ASE Cassandra", cls: "line-heading" },
      { text: "  Site Reliability Engineer                      2021 - Present", cls: "line-highlight" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "Wrote daemon to monitor Cassandra pods in k8s namespaces, track", cls: "line-bullet" },
      { text: "    operational states, and auto-replace pods in inoperative states" },
      { text: "    past pre-configured durations" },
      { text: "Wrote daemon to monitor k8s cluster hosts for issues and auto-replace", cls: "line-bullet" },
      { text: "    running Cassandra pods when hosts have specific conditions or" },
      { text: "    taints past pre-configured durations" },
      { text: "Headed project to migrate entire fleet to new monitoring solution", cls: "line-bullet" },
      { text: "    with better dashboarding, flexible querying, and alerting" },
      { text: "Added code to bespoke Cassandra cqlsh tool to support new container", cls: "line-bullet" },
      { text: "    runtimes and improve overall reliability" },
      { text: "Maintained and updated the group's Slackbot, transforming it from", cls: "line-bullet" },
      { text: "    a skunkworks project to an indispensable tool for on-call operators" },
      { text: "" },
    ],

    "apple-postgres": [
      { text: SEP, cls: "line-separator" },
      { text: "  APPLE // ACI Postgres", cls: "line-heading" },
      { text: "  Site Reliability Engineer                      2020 - 2021", cls: "line-highlight" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "Planned & executed migration of 2000+ customer PostgreSQL", cls: "line-bullet" },
      { text: "    instances to newer version before EOL, coordinating across teams" },
      { text: "Planned & executed effort to offer newer PostgreSQL version", cls: "line-bullet" },
      { text: "    as part of larger upgrade project targeting 6-month rollout" },
      { text: "Devised, wrote, and presented freeze-bypass stability validation", cls: "line-bullet" },
      { text: "    procedure for services during critical periods" },
      { text: "Devised, piloted, and implemented team-level systems to ensure", cls: "line-bullet" },
      { text: "    fair coverage of vital functions with proper visibility" },
      { text: "Ensured prioritization consistency between team and management", cls: "line-bullet" },
      { text: "Improved team documentation, runbooks, procedures, and on-call load", cls: "line-bullet" },
      { text: "Inherited & led org-wide initiative to improve learning resources", cls: "line-bullet" },
      { text: "    for new SREs joining Apple Cloud Services (ACS), spanning" },
      { text: "    multiple teams including SREs, developers, and cloud advocates" },
      { text: "" },
    ],

    "apple-observability": [
      { text: SEP, cls: "line-separator" },
      { text: "  APPLE // ACI Observability", cls: "line-heading" },
      { text: "  Site Reliability Engineer                      2018 - 2020", cls: "line-highlight" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "Technical lead for ACI SRE Observability; set technical direction", cls: "line-bullet" },
      { text: "    for SRE teams around platform operations and migration planning" },
      { text: "Mentored junior team members on coding and code-release practices,", cls: "line-bullet" },
      { text: "    enabling completion of key projects and raising team skill level" },
      { text: "Built, maintained, and serviced self-hosted Kubernetes clusters", cls: "line-bullet" },
      { text: "Planned & executed migration from Docker Swarm to self-hosted k8s;", cls: "line-bullet" },
      { text: "    20+ apps in multiple languages with several data backends" },
      { text: "Created, maintained, and deployed Helm charts for k8s migrations", cls: "line-bullet" },
      { text: "Wrote runbooks and docs on all aspects of Kubernetes ownership:", cls: "line-bullet" },
      { text: "    cluster creation, migration, and repair without downtime" },
      { text: "Maintained fleet of Kubernetes clusters including maintenances,", cls: "line-bullet" },
      { text: "    repair, and zero-downtime upgrades" },
      { text: "Headed initiative to get SREs involved in next-gen telemetry", cls: "line-bullet" },
      { text: "Peer-reviewed code to ensure solutions met requirements", cls: "line-bullet" },
      { text: "Led initiative to reduce operational toil by streamlining alerts,", cls: "line-bullet" },
      { text: "    removing unnecessary alerts, and ensuring clear system visibility" },
      { text: "Supported team as educational resource after departure", cls: "line-bullet" },
      { text: "" },
    ],

    "linkedin": [
      { text: SEP, cls: "line-separator" },
      { text: "  LINKEDIN, INC", cls: "line-heading" },
      { text: "  Senior Site Reliability Engineer               2016 - 2018", cls: "line-highlight" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "Led team building host-level chaos engineering as part of", cls: "line-bullet" },
      { text: "    LinkedIn's Waterbear initiative, improving reliability" },
      { text: "Wrote code for CPU-level and network-level chaos engineering", cls: "line-bullet" },
      { text: "Presented host-level chaos initiative at SaltConf17", cls: "line-bullet" },
      { text: "Led weekly design review meeting in the New York office,", cls: "line-bullet" },
      { text: "    allowing developers to present plans before wider RFC scrutiny" },
      { text: "Contributed code to monitoring system for new and existing services", cls: "line-bullet" },
      { text: "Created solutions for dev teams to monitor service health at a glance", cls: "line-bullet" },
      { text: "Created frontend and API for company-wide log aggregation service", cls: "line-bullet" },
      { text: "Peer-reviewed code to ensure reliability of developer strategies", cls: "line-bullet" },
      { text: "" },
    ],

    "workmarket": [
      { text: SEP, cls: "line-separator" },
      { text: "  WORK MARKET, INC", cls: "line-heading" },
      { text: "  Senior DevOps Engineer                         2015 - 2016", cls: "line-highlight" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "Contributed manifests and modules to Puppet config management tree", cls: "line-bullet" },
      { text: "Contributed code to Fabric tree for admin tasks and deployments", cls: "line-bullet" },
      { text: "Created solutions for easy provisioning of EC2-backed microservices", cls: "line-bullet" },
      { text: "Assisted in automating RDS provisioning and configuration", cls: "line-bullet" },
      { text: "Streamlined AMI creation into single pipeline using Packer", cls: "line-bullet" },
      { text: "    with CIS hardening guidelines" },
      { text: "Created system patching strategy allowing zero-downtime reboots", cls: "line-bullet" },
      { text: "Created and documented procedures for production maintenances", cls: "line-bullet" },
      { text: "Assisted in documenting procedures for rapid Puppet module creation", cls: "line-bullet" },
      { text: "Added Puppet manifests for automatic collectd installation/config", cls: "line-bullet" },
      { text: "Added Puppet code for collectd MySQL metrics collection", cls: "line-bullet" },
      { text: "Started migration from Puppet to newer Saltstack codebase", cls: "line-bullet" },
      { text: "" },
    ],

    "shutterstock": [
      { text: SEP, cls: "line-separator" },
      { text: "  SHUTTERSTOCK, INC", cls: "line-heading" },
      { text: "  Site Reliability Engineer                      2013 - 2015", cls: "line-highlight" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "Contributed manifests and modules to Puppet config management tree", cls: "line-bullet" },
      { text: "Architected solution to scale Puppet beyond single master node", cls: "line-bullet" },
      { text: "Spearheaded Chef-Solo migration for decentralized CM infrastructure", cls: "line-bullet" },
      { text: "Ported Chef cookbooks to Ubuntu 14.04 and CentOS 7", cls: "line-bullet" },
      { text: "Improved automation for DNS record and LDAP account management", cls: "line-bullet" },
      { text: "Created tools to notify users of on-call assignments", cls: "line-bullet" },
      { text: "Maintained Linux provisioning system; created automation for faster", cls: "line-bullet" },
      { text: "    provisioning across larger numbers of servers" },
      { text: "Maintained and improved CMDB and project deployment systems", cls: "line-bullet" },
      { text: "Maintained and improved Jenkins CI; wrote dashboard to separate", cls: "line-bullet" },
      { text: "    good/bad/unbuilt builds into groups and graph them" },
      { text: "Migrated services from older build system to Jenkins-based system", cls: "line-bullet" },
      { text: "" },
    ],

    "datapipe": [
      { text: SEP, cls: "line-separator" },
      { text: "  DATAPIPE, INC", cls: "line-heading" },
      { text: "  Datacenter Technician / Operational Support    2008 - 2013", cls: "line-highlight" },
      { text: SEP, cls: "line-separator" },
      { text: "" },
      { text: "Designed, implemented, and maintained new UNIX provisioning system", cls: "line-bullet" },
      { text: "Tested Linux distributions for hardware compatibility; resolved issues", cls: "line-bullet" },
      { text: "Developed custom client images tailored to specific needs", cls: "line-bullet" },
      { text: "Designed and built remote CD/DVD burning solution for datacenter", cls: "line-bullet" },
      { text: "Implemented and maintained new monitoring system", cls: "line-bullet" },
      { text: "Designed supplemental apps for monitoring; wrote incident integration", cls: "line-bullet" },
      { text: "Implemented and maintained ticketing/CMDB system; expanded as needed", cls: "line-bullet" },
      { text: "Designed and implemented custom maintenance scripts", cls: "line-bullet" },
      { text: "Maintained servers for Development team ensuring stability/uptime", cls: "line-bullet" },
      { text: "Built system to track all server builds in progress", cls: "line-bullet" },
      { text: "Built system to track pulled servers and drive grace period expiry", cls: "line-bullet" },
      { text: "Built system to track inventory through RMA/QA process", cls: "line-bullet" },
      { text: "Assembled server and networking hardware per customer orders", cls: "line-bullet" },
      { text: "Installed Windows and UNIX OSes via PXE with post-install steps", cls: "line-bullet" },
      { text: "Racked/cabled servers, ran power cables, set VLANs on switches", cls: "line-bullet" },
      { text: "Tested Windows and UNIX deployment systems", cls: "line-bullet" },
      { text: "Tested hardware for operating system compatibility", cls: "line-bullet" },
      { text: "" },
    ],
  };

  const EXP_KEYS = Object.keys(experienceDetail);

  const THEME_NAMES = ["green", "amber", "blue", "high-contrast", "colorblind"];

  const COMMANDS = [
    "about", "skills", "experience", "projects", "education", "contact",
    "all", "clear", "help", "theme",
    ...EXP_KEYS.map(k => "experience " + k),
    ...THEME_NAMES.map(t => "theme " + t),
  ];

  const helpText = [
    { text: SEP, cls: "line-separator" },
    { text: "  COMMANDS", cls: "line-heading" },
    { text: SEP, cls: "line-separator" },
    { text: "" },
    { text: "  about         who I am", cls: "line-highlight" },
    { text: "  skills        technical expertise", cls: "line-highlight" },
    { text: "  experience    work history (overview)", cls: "line-highlight" },
    { text: "  experience &lt;company&gt;", cls: "line-highlight" },
    { text: "                drill into a specific role", cls: "line-comment" },
    { text: "  projects      open-source work", cls: "line-highlight" },
    { text: "  education     academic background", cls: "line-highlight" },
    { text: "  contact       reach me", cls: "line-highlight" },
    { text: "  all           show everything", cls: "line-highlight" },
    { text: "  theme         change color theme", cls: "line-highlight" },
    { text: "  clear         clear terminal", cls: "line-highlight" },
    { text: "  help          this message", cls: "line-highlight" },
    { text: "" },
    { text: "  tip: press &lt;Tab&gt; to autocomplete", cls: "line-comment" },
    { text: "" },
  ];

  // ── Rendering helpers ────────────────────────────────

  function addLine(text, cls, animate) {
    const div = document.createElement("div");
    div.className = "line" + (cls ? " " + cls : "") + (animate ? " line-enter" : "");
    div.innerHTML = text;
    output.appendChild(div);
  }

  function addLines(lines) {
    lines.forEach(l => addLine(l.text, l.cls, true));
  }

  function scrollToBottom() {
    terminal.scrollTop = terminal.scrollHeight;
  }

  function escapeHTML(str) {
    const el = document.createElement("span");
    el.textContent = str;
    return el.innerHTML;
  }

  function pad(str, len, right) {
    str = String(str);
    if (right) return str.padEnd(len);
    return str.padStart(len);
  }

  // ── Tab completion ───────────────────────────────────

  function getCompletion(partial) {
    if (!partial) return null;
    const lower = partial.toLowerCase();
    const matches = COMMANDS.filter(c => c.startsWith(lower));
    return matches.length === 1 ? matches[0] : null;
  }

  function showTabGhost() {
    const existing = document.getElementById("tab-ghost");
    if (existing) existing.remove();

    const val = cmdInput.value;
    const match = getCompletion(val);
    if (match && val.length > 0 && match !== val.toLowerCase()) {
      const ghost = document.createElement("span");
      ghost.id = "tab-ghost";
      ghost.textContent = match.slice(val.length);
      inputSizer.parentNode.insertBefore(ghost, document.getElementById("cursor"));
    }
  }

  // ── Boot sequence ────────────────────────────────────

  function boot() {
    const POST_DELAY = 1600; // wait for CRT power-on

    const biosLines = [
      { text: "", cls: "" },
      { text: "  SPACEDUCK BIOS v3.14.159", cls: "line-system" },
      { text: "  (c) 2026 spaceduck.org", cls: "line-system" },
      { text: "", cls: "" },
      { text: "  CPU .......... OK", cls: "line-system", delay: 80 },
      { text: "  Memory ....... 640K ought to be enough", cls: "line-system", delay: 80 },
      { text: "  Disk ......... OK", cls: "line-system", delay: 80 },
      { text: "  Network ...... OK", cls: "line-system", delay: 80 },
      { text: "", cls: "", delay: 200 },
      { text: "  Loading profile...", cls: "line-system", delay: 300 },
      { text: "", cls: "", delay: 100 },
    ];

    const profileLines = [];
    ASCII_NAME.forEach(l => profileLines.push({ text: l, cls: "ascii-art", delay: 30 }));

    profileLines.push({ text: "", delay: 50 });
    profileLines.push({ text: "  Site Reliability Engineer", cls: "line-comment", delay: 30 });
    profileLines.push({ text: "  bnied@spaceduck.org", cls: "line-comment", delay: 30 });
    profileLines.push({ text: "", delay: 30 });
    profileLines.push({ text: SEP, cls: "line-separator", delay: 50 });
    profileLines.push({ text: "", delay: 30 });
    profileLines.push({ text: "  Type 'help' for available commands.", cls: "line-ok", delay: 0 });
    profileLines.push({ text: "", delay: 0 });

    const allBootLines = [...biosLines, ...profileLines];

    let i = 0;
    let cumulativeDelay = POST_DELAY;

    function scheduleNext() {
      if (i >= allBootLines.length) {
        scrollToBottom();
        cmdInput.focus();
        return;
      }
      const line = allBootLines[i];
      const lineDelay = line.delay !== undefined ? line.delay : 35;
      cumulativeDelay += lineDelay;

      setTimeout(() => {
        addLine(line.text, line.cls, false);
        scrollToBottom();
      }, cumulativeDelay);

      i++;
      // Schedule synchronously (all timeouts fire independently)
      scheduleNext();
    }

    scheduleNext();
  }

  // ── Command handling ─────────────────────────────────

  function runCommand(raw) {
    const cmd = raw.trim().toLowerCase();

    addLine("", null, false);
    const promptHTML = document.querySelector("#input-line .prompt").innerHTML;
    addLine(`<span class="prompt">${promptHTML}</span>${escapeHTML(raw)}`, "line-prompt", false);

    if (cmd === "") {
      scrollToBottom();
      return;
    }

    if (cmd === "help" || cmd === "?") {
      addLines(helpText);
    } else if (cmd === "clear" || cmd === "cls") {
      output.innerHTML = "";
      scrollToBottom();
      return;
    } else if (cmd === "all") {
      addLines(sections.about);
      addLines(sections.contact);
      addLines(sections.skills);
      addLines(sections.experience);
      // Show all experience details in the 'all' view
      for (const key of EXP_KEYS) {
        addLines(experienceDetail[key]);
      }
      addLines(sections.projects);
      addLines(sections.education);
    } else if (cmd.startsWith("experience ")) {
      const sub = cmd.slice(11).trim();
      if (experienceDetail[sub]) {
        addLines(experienceDetail[sub]);
      } else {
        addLine(`  unknown role: ${escapeHTML(sub)}`, "line-highlight", true);
        addLine("  available: " + EXP_KEYS.join(", "), "line-comment", true);
        addLine("", null, false);
      }
    } else if (cmd.startsWith("sudo ")) {
      addLine("  visitor is not in the sudoers file.", "line-highlight", true);
      addLine("  This incident will be reported.", "line-highlight", true);
      addLine("", null, false);
    } else if (cmd.startsWith("cat ")) {
      const file = cmd.slice(4).trim();
      const sectionName = file.replace(/\.txt$/, "");
      if (file === "") {
        addLine("  cat: missing operand", "line-highlight", true);
      } else if (sections[sectionName]) {
        addLines(sections[sectionName]);
      } else if (file === ".secrets") {
        addLine("  cat: .secrets: Permission denied", "line-highlight", true);
      } else {
        addLine(`  cat: ${escapeHTML(file)}: No such file or directory`, "line-highlight", true);
      }
      addLine("", null, false);
    } else if (cmd === "cat") {
      addLine("  cat: missing operand", "line-highlight", true);
      addLine("", null, false);
    } else if (cmd.startsWith("rm ")) {
      const args = cmd.slice(3).trim();
      if (args === "-rf /" || args === "-rf /*" || args === "-rf /  " || args === "/") {
        addLine("  rm: it is dangerous to operate recursively on '/'", "line-highlight", true);
        addLine("  rm: use --no-preserve-root to override this failsafe", "line-highlight", true);
      } else if (args === "") {
        addLine("  rm: missing operand", "line-highlight", true);
      } else {
        addLine(`  rm: cannot remove '${escapeHTML(args)}': Permission denied`, "line-highlight", true);
      }
      addLine("", null, false);
    } else if (cmd === "rm") {
      addLine("  rm: missing operand", "line-highlight", true);
      addLine("  Try 'rm --help' for more information.", "line-comment", true);
      addLine("", null, false);
    } else if (cmd.startsWith("echo ")) {
      addLine("  " + escapeHTML(raw.trim().slice(5)), null, true);
      addLine("", null, false);
    } else if (cmd === "echo") {
      addLine("", null, false);
    } else if (cmd === "uname" || cmd === "uname -a") {
      addLine("  bnied.dev 1.0.0 SPACEDUCK-BIOS SMP " + new Date().toUTCString() + " JavaScript/ES2024 browser", null, true);
      addLine("", null, false);
    } else if (cmd === "uname -s") {
      addLine("  bnied.dev", null, true);
      addLine("", null, false);
    } else if (cmd === "uname -r") {
      addLine("  1.0.0", null, true);
      addLine("", null, false);
    } else if (cmd === "uname -m") {
      addLine("  JavaScript/ES2024", null, true);
      addLine("", null, false);
    } else if (cmd.startsWith("theme ")) {
      const themeName = cmd.slice(6).trim();
      const validThemes = ["green", "amber", "blue", "high-contrast", "colorblind"];
      if (validThemes.includes(themeName)) {
        document.documentElement.setAttribute("data-theme", themeName === "green" ? "" : themeName);
        if (themeName === "green") document.documentElement.removeAttribute("data-theme");
        addLine(`  theme set to '${escapeHTML(themeName)}'`, "line-ok", true);
      } else {
        addLine(`  unknown theme: ${escapeHTML(themeName)}`, "line-highlight", true);
        addLine("  available: " + validThemes.join(", "), "line-comment", true);
      }
      addLine("", null, false);
    } else if (cmd === "theme") {
      addLine("  available themes:", "line-comment", true);
      addLine("    green            default phosphor green", "line-highlight", true);
      addLine("    amber            warm amber phosphor", "line-highlight", true);
      addLine("    blue             cool blue phosphor", "line-highlight", true);
      addLine("    high-contrast    maximum readability", "line-highlight", true);
      addLine("    colorblind       deuteranopia-safe palette", "line-highlight", true);
      addLine("", null, false);
      addLine("  usage: theme &lt;name&gt;", "line-comment", true);
      addLine("", null, false);
    } else if (cmd === "whoami") {
      addLine("  visitor", null, true);
      addLine("", null, false);
    } else if (cmd === "pwd") {
      addLine("  /home/visitor", null, true);
      addLine("", null, false);
    } else if (cmd === "hostname" || cmd === "hostname -f") {
      addLine("  bnied.dev", null, true);
      addLine("", null, false);
    } else if (cmd === "date") {
      addLine("  " + new Date().toString(), null, true);
      addLine("", null, false);
    } else if (cmd === "uptime") {
      const elapsed = Math.floor((Date.now() - pageLoadTime) / 1000);
      const hrs = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const secs = elapsed % 60;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const upStr = (hrs > 0 ? hrs + " hr " : "") + mins + " min, " + secs + " sec";
      addLine(`  ${timeStr} up ${upStr}, 1 user, load average: 0.42, 0.69, 1.337`, null, true);
      addLine("", null, false);
    } else if (cmd === "ls" || cmd === "ls -la" || cmd === "ls -l" || cmd === "ls -a") {
      if (cmd.includes("-l")) {
        addLine("  total 42", "line-comment", true);
        addLine("  drwxr-xr-x  2 bnied  staff  4096 Apr 10  2026 .", null, true);
        addLine("  drwxr-xr-x  3 bnied  staff  4096 Apr 10  2026 ..", null, true);
        addLine("  -rw-r--r--  1 bnied  staff  1337 Apr 10  2026 about.txt", "line-accent", true);
        addLine("  -rw-r--r--  1 bnied  staff  2048 Apr 10  2026 contact.txt", "line-accent", true);
        addLine("  -rw-r--r--  1 bnied  staff  4096 Apr 10  2026 experience.txt", "line-accent", true);
        addLine("  -rw-r--r--  1 bnied  staff  3072 Apr 10  2026 skills.txt", "line-accent", true);
        addLine("  -rw-r--r--  1 bnied  staff  2560 Apr 10  2026 projects.txt", "line-accent", true);
        addLine("  -rw-r--r--  1 bnied  staff   512 Apr 10  2026 education.txt", "line-accent", true);
        addLine("  -rwx------  1 bnied  staff     0 Apr 10  2026 .secrets", "line-comment", true);
      } else {
        addLine("  about.txt   contact.txt    experience.txt", "line-accent", true);
        addLine("  skills.txt  projects.txt   education.txt", "line-accent", true);
      }
      addLine("", null, false);
    } else if (cmd.startsWith("cd ")) {
      const dir = cmd.slice(3).trim();
      if (dir === "~" || dir === "/home/visitor" || dir === ".") {
        addLine("", null, false);
      } else {
        addLine(`  bash: cd: ${escapeHTML(dir)}: No such file or directory`, "line-highlight", true);
        addLine("", null, false);
      }
    } else if (cmd === "cd") {
      addLine("", null, false);
    } else if (cmd.startsWith("ping ")) {
      runPing(cmd.slice(5).trim());
    } else if (cmd === "ping") {
      addLine("  ping: usage error: Destination address required", "line-highlight", true);
      addLine("", null, false);
    } else if (cmd === "vim" || cmd === "vi") {
      addLine("  Why would you do this to yourself?", "line-highlight", true);
      addLine("  (hint: you can't :q out of this one either)", "line-comment", true);
      addLine("", null, false);
    } else if (cmd === "emacs") {
      addLine("  A great operating system, lacking only a decent text editor.", "line-highlight", true);
      addLine("", null, false);
    } else if (cmd === "nano") {
      addLine("  Finally, a sensible choice.", "line-ok", true);
      addLine("", null, false);
    } else if (cmd === "exit" || cmd === "logout") {
      addLine("  There is no escape.", "line-highlight", true);
      addLine("  You could try 'shutdown' though...", "line-comment", true);
      addLine("", null, false);
    } else if (cmd.startsWith("man ")) {
      const page = cmd.slice(4).trim();
      addLine(`  No manual entry for ${escapeHTML(page)}`, "line-highlight", true);
      addLine("  (but seriously, RTFM)", "line-comment", true);
      addLine("", null, false);
    } else if (cmd === "man") {
      addLine("  What manual page do you want?", "line-highlight", true);
      addLine("  For example, try 'man man'", "line-comment", true);
      addLine("", null, false);
    } else if (cmd === "fortune") {
      const quote = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
      addLine("  " + quote, "line-accent", true);
      addLine("", null, false);
    } else if (cmd === "cowsay" || cmd.startsWith("cowsay ")) {
      const msg = cmd === "cowsay" ? "moo" : raw.trim().slice(7);
      runCowsay(msg);
    } else if (cmd.startsWith("ssh ")) {
      const host = cmd.slice(4).trim();
      addLine(`  ssh: connect to host ${escapeHTML(host)} port 22: Connection refused`, "line-highlight", true);
      addLine("", null, false);
    } else if (cmd === "ssh") {
      addLine("  usage: ssh [-p port] [user@]hostname", "line-highlight", true);
      addLine("", null, false);
    } else if (cmd.startsWith("curl ")) {
      const url = cmd.slice(5).trim();
      addLine(`  curl: (6) Could not resolve host: ${escapeHTML(url)}`, "line-highlight", true);
      addLine("", null, false);
    } else if (cmd === "curl") {
      addLine("  curl: try 'curl --help' for more information", "line-highlight", true);
      addLine("", null, false);
    } else if (cmd === "make") {
      addLine("  make: *** No targets specified and no makefile found.  Stop.", "line-highlight", true);
      addLine("", null, false);
    } else if (cmd.startsWith("make ")) {
      const target = cmd.slice(5).trim();
      if (target === "love") {
        addLine("  make: *** No rule to make target 'love'.  Stop.", "line-highlight", true);
        addLine("  (but I appreciate the sentiment)", "line-comment", true);
      } else if (target === "coffee" || target === "me a sandwich") {
        addLine("  make: *** No rule to make target '" + escapeHTML(target) + "'.  Stop.", "line-highlight", true);
        addLine("  (try sudo)", "line-comment", true);
      } else {
        addLine(`  make: *** No rule to make target '${escapeHTML(target)}'.  Stop.`, "line-highlight", true);
      }
      addLine("", null, false);
    } else if (cmd === "doom") {
      runDoom();
    } else if (cmd === "top" || cmd === "htop" || cmd === "btop") {
      runBtop();
    } else if (cmd === "shutdown" || cmd === "poweroff" || cmd === "halt" || cmd === "shutdown -h now") {
      runShutdown();
    } else if (cmd === "reboot" || cmd === "shutdown -r now") {
      runShutdown(true);
    } else if (cmd === "sl") {
      runSL();
    } else if (cmd === "neofetch") {
      runNeofetch();
    } else if (cmd === "cmatrix") {
      runCmatrix();
    } else if (cmd === "history") {
      history.slice().reverse().forEach((h, i) => {
        addLine(`  ${pad(i + 1, 4)}  ${escapeHTML(h)}`, null, true);
      });
      addLine("", null, false);
    } else if (cmd.startsWith("grep ")) {
      runGrep(cmd.slice(5).trim());
    } else if (cmd === "grep") {
      addLine("  Usage: grep &lt;pattern&gt;", "line-highlight", true);
      addLine("  Searches resume content for matching text", "line-comment", true);
      addLine("", null, false);
    } else if (cmd.startsWith("wget ")) {
      addLine(`  --${new Date().toISOString()}--`, "line-system", true);
      addLine(`  Resolving ${escapeHTML(cmd.slice(5).trim())}... failed: Name or service not known.`, "line-highlight", true);
      addLine(`  wget: unable to resolve host address '${escapeHTML(cmd.slice(5).trim())}'`, "line-highlight", true);
      addLine("", null, false);
    } else if (cmd === "wget") {
      addLine("  wget: missing URL", "line-highlight", true);
      addLine("  Usage: wget [OPTION]... [URL]...", "line-comment", true);
      addLine("", null, false);
    } else if (cmd.startsWith("apt-get ") || cmd.startsWith("apt ")) {
      addLine("  E: Could not open lock file /var/lib/dpkg/lock-frontend", "line-highlight", true);
      addLine("  E: Unable to acquire the dpkg frontend lock, are you root?", "line-highlight", true);
      addLine("", null, false);
    } else if (cmd === "docker ps" || cmd === "docker ps -a") {
      runDockerPs();
    } else if (cmd.startsWith("docker")) {
      addLine("  Cannot connect to the Docker daemon at unix:///var/run/docker.sock.", "line-highlight", true);
      addLine("  Is the docker daemon running?", "line-comment", true);
      addLine("", null, false);
    } else if (cmd === "kubectl get pods" || cmd === "kubectl get pods -A" || cmd === "kubectl get po") {
      runKubectlPods();
    } else if (cmd.startsWith("kubectl")) {
      addLine("  error: the server doesn't have a resource type \"" + escapeHTML(cmd.split(" ").slice(2).join(" ") || "unknown") + "\"", "line-highlight", true);
      addLine("", null, false);
    } else if (cmd === "git log") {
      runGitLog();
    } else if (cmd.startsWith("git ")) {
      addLine("  fatal: not a git repository (or any parent up to mount point /)", "line-highlight", true);
      addLine("", null, false);
    } else if (cmd.startsWith("alias")) {
      addLine("  nice try.", "line-highlight", true);
      addLine("", null, false);
    } else if (cmd === "whoami --verbose") {
      addLines(sections.about);
      addLines(sections.skills);
      addLines(sections.contact);
    } else if (cmd.startsWith("traceroute ") || cmd.startsWith("tracert ")) {
      const host = cmd.split(" ").slice(1).join(" ").trim();
      runTraceroute(host);
    } else if (cmd === "traceroute" || cmd === "tracert") {
      addLine("  Usage: traceroute &lt;host&gt;", "line-highlight", true);
      addLine("", null, false);
    } else if (sections[cmd]) {
      addLines(sections[cmd]);
    } else {
      addLine(`  command not found: ${escapeHTML(cmd)}`, "line-highlight", true);
      addLine("  type 'help' for available commands", "line-comment", true);
      addLine("", null, false);
    }

    scrollToBottom();
  }

  // ── neofetch ──────────────────────────────────────────

  function runNeofetch() {
    const uptimeMs = Date.now() - pageLoadTime;
    const uptimeMin = Math.floor(uptimeMs / 60000);
    const uptimeHr = Math.floor(uptimeMin / 60);
    const upStr = uptimeHr > 0 ? `${uptimeHr} hours, ${uptimeMin % 60} mins` : `${uptimeMin} mins`;
    const theme = document.documentElement.getAttribute("data-theme") || "green";

    const asciiRaw = [
      "     _______       ",
      "    /       \\      ",
      "   / bnied   \\     ",
      "  /   .dev    \\    ",
      " /_______________\\  ",
      " |  >_  |  >_  |  ",
      " |_____|_____|__|  ",
      " |               | ",
      " |   [{SYSTEM}]  | ",
      " |_______________| ",
      "   /           \\   ",
      "  /             \\  ",
      " /_______._______\\ ",
    ];
    const artW = 24;
    const ascii = asciiRaw.map(l => l.padEnd(artW));

    const info = [
      { label: "visitor", value: "@bnied.dev", cls: "line-heading" },
      { label: "", value: "──────────────────", cls: "line-separator" },
      { label: "OS", value: "SPACEDUCK/Linux x86_64" },
      { label: "Host", value: "bnied.dev" },
      { label: "Kernel", value: "1.0.0-spaceduck" },
      { label: "Uptime", value: upStr },
      { label: "Shell", value: "bnied-sh 1.0" },
      { label: "Terminal", value: "CRT Phosphor P1" },
      { label: "Theme", value: theme },
      { label: "CPU", value: "JavaScript V8 @ 60fps" },
      { label: "Memory", value: "640K / 640K (100%)" },
      { label: "Disk", value: "42K / unlimited" },
      { label: "Font", value: "Fira Code 14px" },
      { label: "Locale", value: navigator.language || "en-US" },
    ];

    const maxLines = Math.max(ascii.length, info.length);
    for (let i = 0; i < maxLines; i++) {
      const artPart = i < ascii.length ? ascii[i] : " ".repeat(23);
      let infoPart = "";
      if (i < info.length) {
        const item = info[i];
        if (item.cls === "line-heading") {
          infoPart = `<span class="line-accent">${escapeHTML(item.label)}</span><span class="line-heading">${escapeHTML(item.value)}</span>`;
        } else if (item.cls === "line-separator") {
          infoPart = `<span class="line-separator">${item.value}</span>`;
        } else {
          infoPart = `<span class="line-accent">${escapeHTML(item.label)}</span>: ${escapeHTML(item.value)}`;
        }
      }
      addLine(`<span class="line-ok">${escapeHTML(artPart)}</span>  ${infoPart}`, null, true);
    }
    addLine("", null, false);
  }

  // ── cmatrix ──────────────────────────────────────────

  function runCmatrix() {
    const inputLine = document.getElementById("input-line");
    inputLine.style.display = "none";
    const savedOutput = output.innerHTML;
    output.innerHTML = "";

    const matrixEl = document.createElement("canvas");
    matrixEl.style.cssText = "width:100%;height:100%;display:block;";
    output.appendChild(matrixEl);

    const ctx = matrixEl.getContext("2d");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*(){}[]|;:<>,.?/~`アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

    let w, h, columns, drops;
    const fontSize = 14;

    function resize() {
      w = matrixEl.width = matrixEl.offsetWidth;
      h = matrixEl.height = matrixEl.offsetHeight;
      columns = Math.floor(w / fontSize);
      drops = Array(columns).fill(1);
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#33ff33";
      ctx.font = fontSize + "px 'Fira Code', monospace";

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = drops[i] === 1 ? "#ffffff" : `rgba(51, 255, 51, ${Math.random() * 0.5 + 0.5})`;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > h && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 40);

    function onKey(e) {
      if (e.key === "q" || e.key === "Q" || e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
        e.preventDefault();
        clearInterval(interval);
        window.removeEventListener("resize", resize);
        document.removeEventListener("keydown", onKey, true);
        output.innerHTML = savedOutput;
        inputLine.style.display = "flex";
        cmdInput.focus();
        scrollToBottom();
      }
    }
    document.addEventListener("keydown", onKey, true);
  }

  // ── grep ─────────────────────────────────────────────

  function runGrep(pattern) {
    if (!pattern) {
      addLine("  Usage: grep &lt;pattern&gt;", "line-highlight", true);
      addLine("", null, false);
      return;
    }

    const lowerPattern = pattern.toLowerCase();
    let matchCount = 0;

    // Search through all sections + experience details
    const allSections = { ...sections, ...experienceDetail };

    for (const [name, lines] of Object.entries(allSections)) {
      const matches = [];
      lines.forEach(l => {
        // Strip HTML tags for search
        const plainText = l.text.replace(/<[^>]*>/g, "");
        if (plainText.toLowerCase().includes(lowerPattern)) {
          matches.push(plainText);
        }
      });

      if (matches.length > 0) {
        addLine(`  <span class="line-accent">${escapeHTML(name)}:</span>`, null, true);
        matches.forEach(m => {
          // Highlight the match
          const regex = new RegExp(`(${escapeHTML(pattern)})`, "gi");
          const highlighted = escapeHTML(m).replace(regex, '<span class="line-heading">$1</span>');
          addLine(`    ${highlighted}`, null, true);
        });
        matchCount += matches.length;
        addLine("", null, false);
      }
    }

    if (matchCount === 0) {
      addLine(`  No matches found for '${escapeHTML(pattern)}'`, "line-comment", true);
      addLine("", null, false);
    } else {
      addLine(`  ${matchCount} match${matchCount === 1 ? "" : "es"} found`, "line-comment", true);
      addLine("", null, false);
    }
  }

  // ── docker ps ────────────────────────────────────────

  function runDockerPs() {
    const containers = [
      { id: "a1b2c3d4e5f6", image: "nginx:alpine",          cmd: '"/docker-entry..."', created: "2 hours ago",  status: "Up 2 hours",    ports: "0.0.0.0:443->443/tcp", name: "web-frontend" },
      { id: "b2c3d4e5f6a7", image: "node:20-slim",          cmd: '"node server.js"',   created: "2 hours ago",  status: "Up 2 hours",    ports: "3000/tcp",              name: "api-server" },
      { id: "c3d4e5f6a7b8", image: "postgres:16",            cmd: '"docker-entry..."',  created: "3 hours ago",  status: "Up 3 hours",    ports: "5432/tcp",              name: "postgres-db" },
      { id: "d4e5f6a7b8c9", image: "redis:7-alpine",        cmd: '"redis-server"',     created: "3 hours ago",  status: "Up 3 hours",    ports: "6379/tcp",              name: "cache" },
      { id: "e5f6a7b8c9d0", image: "prom/prometheus",       cmd: '"/bin/prometh..."',  created: "5 hours ago",  status: "Up 5 hours",    ports: "9090/tcp",              name: "prometheus" },
      { id: "f6a7b8c9d0e1", image: "grafana/grafana",       cmd: '"/run.sh"',          created: "5 hours ago",  status: "Up 5 hours",    ports: "0.0.0.0:3001->3000/tcp", name: "grafana" },
    ];

    addLine(`  <span class="line-comment">CONTAINER ID   IMAGE                    STATUS          PORTS                      NAMES</span>`, null, true);
    containers.forEach(c => {
      addLine(`  ${c.id}   ${pad(c.image, 24, true)} ${pad(c.status, 15, true)} ${pad(c.ports, 26, true)} ${c.name}`, null, true);
    });
    addLine("", null, false);
  }

  // ── kubectl get pods ─────────────────────────────────

  function runKubectlPods() {
    const pods = [
      { name: "cassandra-node-0",        ready: "1/1", status: "Running",   restarts: "0",  age: "14d" },
      { name: "cassandra-node-1",        ready: "1/1", status: "Running",   restarts: "0",  age: "14d" },
      { name: "cassandra-node-2",        ready: "1/1", status: "Running",   restarts: "1",  age: "14d" },
      { name: "cassandra-monitor-0",     ready: "1/1", status: "Running",   restarts: "0",  age: "7d" },
      { name: "slackbot-7f8b9c-x4k2p",  ready: "1/1", status: "Running",   restarts: "0",  age: "3d" },
      { name: "nginx-ingress-5d4c3-abc", ready: "1/1", status: "Running",   restarts: "0",  age: "21d" },
      { name: "prometheus-0",            ready: "1/1", status: "Running",   restarts: "0",  age: "10d" },
      { name: "grafana-6b7c8d-q9w2e",   ready: "1/1", status: "Running",   restarts: "2",  age: "10d" },
      { name: "cqlsh-debug-pod",         ready: "0/1", status: "Completed", restarts: "0",  age: "1d" },
    ];

    addLine(`  <span class="line-comment">NAME                            READY   STATUS      RESTARTS   AGE</span>`, null, true);
    pods.forEach(p => {
      const statusCls = p.status === "Running" ? "line-ok" : "line-comment";
      const line = `  ${pad(p.name, 31, true)} ${pad(p.ready, 7, true)} <span class="${statusCls}">${pad(p.status, 11, true)}</span> ${pad(p.restarts, 10, true)} ${p.age}`;
      addLine(line, null, true);
    });
    addLine("", null, false);
  }

  // ── git log ──────────────────────────────────────────

  function runGitLog() {
    const commits = [
      { hash: "a3f8c21", author: "Benjamin Nied", date: "2026-04-10", msg: "feat: add DOOM easter egg because why not" },
      { hash: "e7b2d44", author: "Benjamin Nied", date: "2026-04-10", msg: "feat: add btop, cmatrix, neofetch commands" },
      { hash: "c1a9f63", author: "Benjamin Nied", date: "2026-04-10", msg: "feat: color themes and tab completion" },
      { hash: "b5d3e87", author: "Benjamin Nied", date: "2026-04-10", msg: "fix: cursor tracking next to typed characters" },
      { hash: "9f4a2c1", author: "Benjamin Nied", date: "2026-04-10", msg: "feat: CRT power-on animation, phosphor glow" },
      { hash: "7e6d8b3", author: "Benjamin Nied", date: "2026-04-10", msg: "feat: interactive terminal with resume data" },
      { hash: "1a2b3c4", author: "Benjamin Nied", date: "2026-04-10", msg: "init: initial commit" },
    ];

    commits.forEach(c => {
      addLine(`  <span class="line-highlight">${c.hash}</span> - ${escapeHTML(c.msg)}`, null, true);
      addLine(`  <span class="line-comment">  ${c.author}, ${c.date}</span>`, null, true);
      addLine("", null, false);
    });
  }

  // ── traceroute ───────────────────────────────────────

  function runTraceroute(host) {
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

    // Start first hop after a short delay
    setTimeout(nextHop, 400);
  }

  // ── DOOM ─────────────────────────────────────────────

  function runDoom() {
    const inputLine = document.getElementById("input-line");
    inputLine.style.display = "none";

    addLine("", null, false);
    addLine("  ================================================", "line-separator", true);
    addLine("       DOOM v1.9 Shareware -- id Software 1993", "line-accent", true);
    addLine("  ================================================", "line-separator", true);
    addLine("", null, false);
    addLine("  Loading WAD file...", "line-system", true);
    scrollToBottom();

    // Create the DOOM container
    const doomOverlay = document.createElement("div");
    doomOverlay.id = "doom-overlay";
    doomOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 100;
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;

    const exitHint = document.createElement("div");
    exitHint.style.cssText = `
      position: fixed;
      top: 10px;
      right: 16px;
      z-index: 102;
      color: #33ff33;
      font-family: 'Fira Code', monospace;
      font-size: 12px;
      opacity: 0.6;
      pointer-events: none;
    `;
    exitHint.textContent = "Press ESC twice to exit";

    const doomContainer = document.createElement("div");
    doomContainer.id = "doom-container";
    doomContainer.style.cssText = `
      width: 100%;
      height: 100%;
      max-width: 960px;
      max-height: 600px;
    `;

    doomOverlay.appendChild(doomContainer);
    doomOverlay.appendChild(exitHint);
    document.body.appendChild(doomOverlay);

    // Load js-dos
    const jsdosCSS = document.createElement("link");
    jsdosCSS.rel = "stylesheet";
    jsdosCSS.href = "https://v8.js-dos.com/latest/js-dos.css";
    document.head.appendChild(jsdosCSS);

    const jsdosScript = document.createElement("script");
    jsdosScript.src = "https://v8.js-dos.com/latest/js-dos.js";
    jsdosScript.onload = () => {
      addLine("  Initializing emulator...", "line-system", true);
      scrollToBottom();

      try {
        const dos = Dos(doomContainer, {
          url: "assets/doom.jsdos",
          autoStart: true,
          noCloud: true,
          noNetworking: true,
          kiosk: true,
          theme: "night",
          imageRendering: "pixelated",
          renderAspect: "4/3",
        });
      } catch (err) {
        addLine(`  Error: ${err.message}`, "line-highlight", true);
        cleanup();
      }
    };

    jsdosScript.onerror = () => {
      addLine("  ERROR: Failed to load js-dos emulator", "line-highlight", true);
      addLine("  Check your network connection and try again", "line-comment", true);
      addLine("", null, false);
      cleanup();
    };

    document.head.appendChild(jsdosScript);

    // Track ESC presses for exit
    let escCount = 0;
    let escTimer = null;

    function onEsc(e) {
      if (e.key === "Escape") {
        escCount++;
        if (escCount >= 2) {
          e.preventDefault();
          e.stopPropagation();
          cleanup();
        } else {
          clearTimeout(escTimer);
          escTimer = setTimeout(() => { escCount = 0; }, 800);
        }
      } else {
        escCount = 0;
      }
    }

    document.addEventListener("keydown", onEsc, true);

    function cleanup() {
      document.removeEventListener("keydown", onEsc, true);
      doomOverlay.remove();
      jsdosCSS.remove();
      addLine("", null, false);
      addLine("  Thanks for playing DOOM.", "line-ok", true);
      addLine("", null, false);
      inputLine.style.display = "flex";
      cmdInput.focus();
      scrollToBottom();
    }
  }

  // ── btop ──────────────────────────────────────────────

  function runBtop() {
    const inputLine = document.getElementById("input-line");
    inputLine.style.display = "none";
    const savedOutput = output.innerHTML;
    output.innerHTML = "";

    const btopEl = document.createElement("div");
    btopEl.style.cssText = "white-space:pre;font-size:inherit;line-height:1.4;";
    // Force all text inside btop to normal letter-spacing so fixed-width alignment works
    const btopStyle = document.createElement("style");
    btopStyle.textContent = "#btop-view, #btop-view * { letter-spacing: 0 !important; }";
    document.head.appendChild(btopStyle);
    btopEl.id = "btop-view";
    output.appendChild(btopEl);

    const processes = [
      { pid: 1,    user: "root",    cpu: 0.0, mem: 0.3, cmd: "systemd" },
      { pid: 42,   user: "bnied",   cpu: 0.0, mem: 0.1, cmd: "sshd: bnied@pts/0" },
      { pid: 137,  user: "bnied",   cpu: 0.0, mem: 0.2, cmd: "/bin/bash" },
      { pid: 314,  user: "bnied",   cpu: 0.0, mem: 1.2, cmd: "node server.js" },
      { pid: 420,  user: "postgres", cpu: 0.0, mem: 3.8, cmd: "postgres: writer" },
      { pid: 421,  user: "postgres", cpu: 0.0, mem: 2.1, cmd: "postgres: autovacuum" },
      { pid: 666,  user: "root",    cpu: 0.0, mem: 0.5, cmd: "[kworker/0:1-events]" },
      { pid: 777,  user: "bnied",   cpu: 0.0, mem: 4.2, cmd: "kubectl proxy" },
      { pid: 888,  user: "bnied",   cpu: 0.0, mem: 1.8, cmd: "python3 slackbot.py" },
      { pid: 999,  user: "cassand", cpu: 0.0, mem: 12.4, cmd: "java -jar cassandra.jar" },
      { pid: 1024, user: "bnied",   cpu: 0.0, mem: 0.8, cmd: "vim runbook.md" },
      { pid: 1337, user: "bnied",   cpu: 0.0, mem: 0.1, cmd: "btop" },
    ];

    const cpuCores = 4;
    const cpuHistory = Array.from({ length: cpuCores }, () => Array(30).fill(0));

    function randBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function cpuBar(pct, width) {
      const filled = Math.round((pct / 100) * width);
      const empty = width - filled;
      const blocks = "█".repeat(filled) + "░".repeat(empty);
      let color = "line-ok";
      if (pct > 70) color = "line-highlight";
      if (pct > 90) color = "line-accent";
      return `<span class="${color}">${blocks}</span>`;
    }

    function memBar(used, total, width) {
      const pct = (used / total) * 100;
      const filled = Math.round((pct / 100) * width);
      const empty = width - filled;
      const blocks = "█".repeat(filled) + "░".repeat(empty);
      return `<span class="line-accent">${blocks}</span>`;
    }

    function sparkline(history) {
      const chars = "▁▂▃▄▅▆▇█";
      return history.map(v => {
        const idx = Math.min(Math.floor((v / 100) * chars.length), chars.length - 1);
        return chars[idx];
      }).join("");
    }



    // Build a fixed-width line, then colorize segments via a helper.
    // This ensures every line is exactly W visible chars between the borders.
    const W = 60;
    const SEP_H = "─".repeat(W);

    function boxLine(text) {
      // text must be exactly W chars of visible content
      return "│" + text + "│";
    }

    function fixedLine(text) {
      // Pad or truncate to exactly W visible chars
      if (text.length > W) return text.slice(0, W);
      return text + " ".repeat(W - text.length);
    }

    function colorize(line, rules) {
      // rules: array of { start, end, cls }
      // Apply spans to character ranges. Process right-to-left to preserve indices.
      let result = line;
      const sorted = [...rules].sort((a, b) => b.start - a.start);
      for (const r of sorted) {
        const before = result.slice(0, r.start);
        const segment = result.slice(r.start, r.end);
        const after = result.slice(r.end);
        result = before + `<span class="${r.cls}">` + segment + "</span>" + after;
      }
      return result;
    }

    function render() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      const uptimeMs = Date.now() - pageLoadTime;
      const uptimeMin = Math.floor(uptimeMs / 60000);
      const uptimeHr = Math.floor(uptimeMin / 60);
      const upStr = uptimeHr > 0 ? `${uptimeHr}h ${uptimeMin % 60}m` : `${uptimeMin}m`;

      const cpuPcts = [];
      for (let i = 0; i < cpuCores; i++) {
        const base = i === 0 ? randBetween(5, 25) : randBetween(1, 15);
        const spike = Math.random() > 0.92 ? randBetween(30, 80) : 0;
        const pct = Math.min(base + spike, 100);
        cpuPcts.push(pct);
        cpuHistory[i].push(pct);
        if (cpuHistory[i].length > 30) cpuHistory[i].shift();
      }

      processes.forEach(p => {
        if (p.pid === 999) {
          p.cpu = randBetween(8, 22);
          p.mem = randBetween(10, 16);
        } else if (p.pid === 777) {
          p.cpu = randBetween(1, 6);
        } else if (p.pid === 888) {
          p.cpu = randBetween(0.5, 3);
        } else if (p.pid === 314) {
          p.cpu = randBetween(0.2, 4);
        } else if (p.pid === 420) {
          p.cpu = randBetween(0.5, 5);
        } else {
          p.cpu = randBetween(0, 1.5);
        }
      });

      const barW = 28;
      const totalMem = 16384;
      const usedMem = Math.floor(randBetween(6800, 7400));
      const totalSwap = 4096;
      const usedSwap = Math.floor(randBetween(120, 280));

      let out = [];

      // Header (no box)
      const loadStr = `${randBetween(0.2, 0.8).toFixed(2)} ${randBetween(0.4, 1.0).toFixed(2)} ${randBetween(0.6, 1.4).toFixed(2)}`;
      const headerText = ` btop  ${timeStr}  up ${upStr}  load: ${loadStr}`;
      out.push(colorize(headerText, [
        { start: 0, end: 5, cls: "line-heading" },
        { start: 5, end: headerText.length, cls: "line-comment" },
      ]));

      out.push(`<span class="line-separator">┌${SEP_H}┐</span>`);

      // CPU
      const cpuTitle = fixedLine(" CPU");
      out.push(colorize(boxLine(cpuTitle), [
        { start: 1, end: 5, cls: "line-heading" },
      ]));

      for (let i = 0; i < cpuCores; i++) {
        const pct = cpuPcts[i];
        const filled = Math.round((pct / 100) * barW);
        const empty = barW - filled;
        const pctStr = pad(pct.toFixed(0), 3) + "%";
        const sparkStr = sparkline(cpuHistory[i]);
        const label = `  Core ${i} `;
        const barStr = "█".repeat(filled) + "░".repeat(empty);
        const after = ` ${pctStr} `;
        const sparkW = W - label.length - barW - after.length;
        const spark = sparkStr.slice(0, Math.max(0, sparkW));
        const plainLine = fixedLine(label + barStr + after + spark);
        const barStart = label.length;
        const barEnd = barStart + barW;
        let barCls = "line-ok";
        if (pct > 70) barCls = "line-highlight";
        if (pct > 90) barCls = "line-accent";
        const sparkStart = barEnd + after.length;
        const sparkEnd = sparkStart + spark.length;
        out.push(colorize(boxLine(plainLine), [
          { start: barStart + 1, end: barEnd + 1, cls: barCls },
          { start: sparkStart + 1, end: sparkEnd + 1, cls: "line-ok" },
        ]));
      }

      out.push(`<span class="line-separator">├${SEP_H}┤</span>`);

      // Memory
      const memTitle = fixedLine(" MEMORY");
      out.push(colorize(boxLine(memTitle), [
        { start: 1, end: 8, cls: "line-heading" },
      ]));

      // RAM line
      const memPct = pad(((usedMem / totalMem) * 100).toFixed(0), 3) + "%";
      const memFilled = Math.round((usedMem / totalMem) * barW);
      const memBarStr = "█".repeat(memFilled) + "░".repeat(barW - memFilled);
      const memAfter = ` ${memPct}  ${pad(usedMem, 5)}M / ${totalMem}M`;
      const ramPlain = fixedLine("  RAM   " + memBarStr + memAfter);
      out.push(colorize(boxLine(ramPlain), [
        { start: 9, end: 9 + barW, cls: "line-accent" },
      ]));

      // Swap line
      const swapPct = pad(((usedSwap / totalSwap) * 100).toFixed(0), 3) + "%";
      const swapFilled = Math.round((usedSwap / totalSwap) * barW);
      const swapBarStr = "█".repeat(swapFilled) + "░".repeat(barW - swapFilled);
      const swapAfter = ` ${swapPct}  ${pad(usedSwap, 5)}M / ${totalSwap}M`;
      const swapPlain = fixedLine("  Swap  " + swapBarStr + swapAfter);
      out.push(colorize(boxLine(swapPlain), [
        { start: 9, end: 9 + barW, cls: "line-accent" },
      ]));

      out.push(`<span class="line-separator">├${SEP_H}┤</span>`);

      // Processes
      const procTitle = fixedLine(" PROCESSES");
      out.push(colorize(boxLine(procTitle), [
        { start: 1, end: 11, cls: "line-heading" },
      ]));

      const hdr = fixedLine(`  ${pad("PID", 5)} ${pad("USER", 8, true)} ${pad("CPU%", 6)} ${pad("MEM%", 6)}  COMMAND`);
      out.push(colorize(boxLine(hdr), [
        { start: 1, end: W + 1, cls: "line-comment" },
      ]));

      const sorted = [...processes].sort((a, b) => b.cpu - a.cpu);
      sorted.forEach(p => {
        const procText = fixedLine(`  ${pad(p.pid, 5)} ${pad(p.user, 8, true)} ${pad(p.cpu.toFixed(1), 6)} ${pad(p.mem.toFixed(1), 6)}  ${p.cmd}`);
        if (p.cpu > 5) {
          out.push(colorize(boxLine(procText), [
            { start: 1, end: W + 1, cls: "line-highlight" },
          ]));
        } else {
          out.push(boxLine(procText));
        }
      });

      out.push(`<span class="line-separator">└${SEP_H}┘</span>`);
      out.push(`<span class="line-comment"> Press 'q' to quit</span>`);

      btopEl.innerHTML = out.join("\n");
      scrollToBottom();
    }

    render();
    const updateInterval = setInterval(render, 1500);

    function onKey(e) {
      if (e.key === "q" || e.key === "Q" || e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
        e.preventDefault();
        clearInterval(updateInterval);
        document.removeEventListener("keydown", onKey, true);
        btopStyle.remove();
        output.innerHTML = savedOutput;
        inputLine.style.display = "flex";
        cmdInput.focus();
        scrollToBottom();
      }
    }

    document.addEventListener("keydown", onKey, true);
  }

  // ── cowsay ────────────────────────────────────────────

  function runCowsay(message) {
    const msg = message || "moo";
    const top = "   " + "_".repeat(msg.length + 2);
    const mid = "  < " + escapeHTML(msg) + " >";
    const bot = "   " + "-".repeat(msg.length + 2);
    const cow = [
      top,
      mid,
      bot,
      "          \\   ^__^",
      "           \\  (oo)\\_______",
      "              (__)\\       )\\/\\",
      "                  ||----w |",
      "                  ||     ||",
    ];
    cow.forEach(l => addLine(l, "line-accent", true));
    addLine("", null, false);
  }

  // ── ping (animated) ──────────────────────────────────

  function runPing(host) {
    const safeHost = escapeHTML(host);
    addLine(`  PING ${safeHost} (127.0.0.1): 56 data bytes`, "line-system", true);
    scrollToBottom();

    const inputLine = document.getElementById("input-line");
    inputLine.style.display = "none";

    let seq = 0;
    let done = false;
    const maxPings = 4;

    function cleanup(interrupted) {
      if (done) return;
      done = true;
      clearInterval(interval);
      document.removeEventListener("keydown", onKey, true);
      if (interrupted) addLine("  ^C", "line-highlight", true);
      addLine("", null, false);
      addLine(`  --- ${safeHost} ping statistics ---`, "line-system", true);
      addLine(`  ${seq} packets transmitted, ${seq} packets received, 0.0% packet loss`, null, true);
      addLine("", null, false);
      inputLine.style.display = "flex";
      cmdInput.focus();
      scrollToBottom();
    }

    function onKey(e) {
      if (e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
        e.preventDefault();
        cleanup(true);
      }
    }

    setTimeout(() => {
      if (!done) document.addEventListener("keydown", onKey, true);
    }, 100);

    const interval = setInterval(() => {
      const time = (Math.random() * 40 + 10).toFixed(3);
      addLine(`  64 bytes from 127.0.0.1: icmp_seq=${seq} ttl=64 time=${time} ms`, null, true);
      scrollToBottom();
      seq++;

      if (seq >= maxPings) {
        cleanup(false);
      }
    }, 1000);
  }

  // ── shutdown sequence ─────────────────────────────────

  function runShutdown(reboot) {
    const inputLine = document.getElementById("input-line");
    inputLine.style.display = "none";

    const shutdownLines = [
      { text: "", delay: 200 },
      { text: "  Broadcast message from visitor@bnied.dev", cls: "line-system", delay: 100 },
      { text: "  The system is going down for " + (reboot ? "reboot" : "poweroff") + " NOW!", cls: "line-system", delay: 400 },
      { text: "", delay: 300 },
      { text: "  [  OK  ] Stopped target Timers.", cls: "line-ok", delay: 80 },
      { text: "  [  OK  ] Stopped target Graphical Interface.", cls: "line-ok", delay: 80 },
      { text: "  [  OK  ] Stopped target Multi-User System.", cls: "line-ok", delay: 120 },
      { text: "  [ INFO ] Stopping SSH daemon...", cls: "line-system", delay: 80 },
      { text: "  [  OK  ] Stopped SSH daemon.", cls: "line-ok", delay: 150 },
      { text: "  [ INFO ] Stopping Network Manager...", cls: "line-system", delay: 80 },
      { text: "  [  OK  ] Stopped Network Manager.", cls: "line-ok", delay: 200 },
      { text: "  [ INFO ] Unmounting filesystems...", cls: "line-system", delay: 80 },
      { text: "  [  OK  ] Unmounted /home.", cls: "line-ok", delay: 80 },
      { text: "  [  OK  ] Unmounted /boot.", cls: "line-ok", delay: 80 },
      { text: "  [  OK  ] Reached target Unmount All Filesystems.", cls: "line-ok", delay: 300 },
      { text: "  [  OK  ] Reached target Final Step.", cls: "line-ok", delay: 200 },
      { text: "", delay: 400 },
      { text: reboot ? "  [ INFO ] Rebooting..." : "  [ INFO ] Powering off...", cls: "line-system", delay: 0 },
    ];

    let i = 0;
    let cumulativeDelay = 0;

    function scheduleNext() {
      if (i >= shutdownLines.length) {
        // Fade to black after all lines have rendered
        setTimeout(() => {
          const overlay = document.createElement("div");
          overlay.style.cssText = "position:fixed;inset:0;background:#000;z-index:999;opacity:0;transition:opacity 1.5s;";
          document.body.appendChild(overlay);
          requestAnimationFrame(() => overlay.style.opacity = "1");

          if (reboot) {
            setTimeout(() => {
              overlay.remove();
              output.innerHTML = "";
              inputLine.style.display = "flex";
              boot();
            }, 3000);
          }
        }, cumulativeDelay + 800);
        return;
      }

      const line = shutdownLines[i];
      cumulativeDelay += (line.delay !== undefined ? line.delay : 80);

      setTimeout(() => {
        addLine(line.text, line.cls, true);
        scrollToBottom();
      }, cumulativeDelay);

      i++;
      scheduleNext();
    }

    scheduleNext();
  }

  // ── sl (steam locomotive) ─────────────────────────────

  function runSL() {
    const trainFrames = [
      [
        "      ====        ________                ___________ ",
        "  _D _|  |_______/        \\__I_I_____===__|_________| ",
        "   |(_)---  |   H\\________/ |   |        =|___ ___|  ",
        "   /     |  |   H  |  |     |   |         ||_| |_||  ",
        "  |      |  |   H  |__--------------------| [___] |  ",
        "  | ________|___H__/__|_____/[][]~\\_______|       |  ",
        "  |/ |   |-----------I_____I [][] []  D   |=======|__ ",
        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ",
        " |/-=|___|=    ||    ||    ||    |_____/~\\___/        ",
        "  \\_/      \\O=====O=====O=====O_/      \\_/           ",
      ],
      [
        "      ====        ________                ___________ ",
        "  _D _|  |_______/        \\__I_I_____===__|_________| ",
        "   |(_)---  |   H\\________/ |   |        =|___ ___|  ",
        "   /     |  |   H  |  |     |   |         ||_| |_||  ",
        "  |      |  |   H  |__--------------------| [___] |  ",
        "  | ________|___H__/__|_____/[][]~\\_______|       |  ",
        "  |/ |   |-----------I_____I [][] []  D   |=======|__ ",
        "__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__ ",
        " |/-=|___|=O=====O=====O=====O   |_____/~\\___/        ",
        "  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/           ",
      ],
    ];

    const trainWidth = 58;
    const termWidth = Math.floor(terminal.clientWidth / 8.4); // approx char width
    const inputLine = document.getElementById("input-line");
    inputLine.style.display = "none";

    const trainContainer = document.createElement("div");
    trainContainer.className = "line";
    trainContainer.style.cssText = "position:relative;height:10.5em;overflow:hidden;white-space:pre;";
    output.appendChild(trainContainer);

    const trainEl = document.createElement("div");
    trainEl.className = "ascii-art";
    trainEl.style.cssText = "position:absolute;top:0;white-space:pre;color:var(--p1);";
    trainContainer.appendChild(trainEl);

    let pos = termWidth;
    let frame = 0;
    const speed = 40;

    const interval = setInterval(() => {
      const currentFrame = trainFrames[frame % trainFrames.length];
      const pad = pos > 0 ? " ".repeat(pos) : "";
      const displayLines = currentFrame.map(line => {
        const shifted = pad + line;
        if (pos < 0) {
          return shifted.slice(Math.abs(pos) > shifted.length ? shifted.length : 0);
        }
        return shifted;
      });
      trainEl.textContent = displayLines.join("\n");
      pos -= 2;
      frame++;

      if (pos < -(trainWidth + 5)) {
        cleanup();
      }
    }, speed);

    function cleanup() {
      clearInterval(interval);
      document.removeEventListener("keydown", onKey, true);
      trainContainer.remove();
      inputLine.style.display = "flex";
      cmdInput.focus();
      scrollToBottom();
    }

    function onKey(e) {
      if (e.key === "q" || e.key === "Escape" || (e.key === "c" && e.ctrlKey)) {
        e.preventDefault();
        cleanup();
      }
    }
    document.addEventListener("keydown", onKey, true);

    scrollToBottom();
  }

  // ── Input handling ───────────────────────────────────

  const history = [];
  let historyIdx = -1;

  cmdInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const val = cmdInput.value;
      if (val.trim()) history.unshift(val);
      historyIdx = -1;
      runCommand(val);
      cmdInput.value = "";
      syncCursor();
      clearTabGhost();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const match = getCompletion(cmdInput.value);
      if (match) {
        cmdInput.value = match;
        syncCursor();
        clearTabGhost();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx < history.length - 1) {
        historyIdx++;
        cmdInput.value = history[historyIdx];
        syncCursor();
        showTabGhost();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        historyIdx--;
        cmdInput.value = history[historyIdx];
      } else {
        historyIdx = -1;
        cmdInput.value = "";
      }
      syncCursor();
      showTabGhost();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      output.innerHTML = "";
    }
  });

  function clearTabGhost() {
    const ghost = document.getElementById("tab-ghost");
    if (ghost) ghost.remove();
  }

  // keep focus on input
  document.addEventListener("click", () => cmdInput.focus());

  // ── Init ─────────────────────────────────────────────
  initNoise();
  boot();
})();
