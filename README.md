# bnied.dev

Personal website with a CRT terminal aesthetic. Visitors interact via a command prompt to explore resume content, run easter eggs, and play DOOM.

## Commands

| Command | Description |
|---------|-------------|
| `about` | Bio and certifications |
| `skills` | Technical expertise |
| `experience` | Work history overview |
| `experience <role>` | Drill into a specific role |
| `projects` | Open-source projects |
| `education` | Academic background |
| `contact` | Email, GitHub, LinkedIn |
| `theme <name>` | Switch color theme (green, amber, blue, high-contrast, colorblind) |
| `figlet <text>` | Render big ASCII banner text |
| `lolcat` | Rainbow-colorize output (best at the end of a pipe) |
| `crt` | CRT effect intensity: `off` / `on` / `max` (persists) |
| `help` | List all commands |

## Easter Eggs

Too many to list. Try some Linux commands and see what happens.

## Pipes

Commands compose with `|` just like a real shell:

```
fortune | cowsay
figlet bnied | lolcat
echo hello | figlet | lolcat
cat about | cowsay
neofetch | lolcat
```

Pipeable commands: `echo`, `fortune`, `cat <section>`, `figlet`, `cowsay`, `lolcat`, `neofetch`, `ls`, `uname`, `whoami`, `pwd`, `hostname`, `date`, `uptime`.

## CRT effects

The phosphor-CRT look has three intensity levels, set with `crt`:

- `crt off` — flat, plain terminal (max readability / low power)
- `crt on` — default: curvature, bloom, glare, scanlines, phosphor afterglow
- `crt max` — adds edge chromatic aberration and an occasional sync-roll

The choice persists across visits (localStorage). All levels honor
`prefers-reduced-motion`: animations freeze, the static look remains, and the
boot sequence collapses to near-instant.

## Tech Stack

- Vanilla HTML, CSS, JavaScript -- no frameworks, no build step
- [Fira Code](https://github.com/tonsky/FiraCode) font
- [js-dos](https://js-dos.com/) for DOOM (loaded on demand)
- Content stored in `data/*.json`, logic split across ES modules in `js/`

## Structure

```
.
├── index.html
├── css/style.css
├── js/
│   ├── main.js              # entry point
│   ├── commands.js          # command dispatch
│   ├── pipeline.js          # pipe engine
│   ├── data.js              # loads JSON assets
│   └── easter-eggs/         # easter-egg handlers
├── data/
│   ├── sections.json        # resume sections
│   ├── experience.json      # per-role details
│   ├── help.json            # command help text
│   ├── fortunes.json        # fortune quotes
│   ├── ascii.json           # ASCII art assets
│   ├── easter-eggs.json     # easter egg data
│   └── figlet-font.json     # block font for figlet
├── assets/
│   └── doom.jsdos           # DOOM shareware bundle
└── img/                     # favicon variants
```

## Running Locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Tests

Pure logic (figlet, cowsay, the pipe engine) has unit tests run by Node's built-in runner — no dependencies, no build:

```bash
node --test
```

## License

Original site code is 2-clause BSD. See [LICENSE.txt](LICENSE.txt) for the full text and third-party attributions.

### Third-party components

- **[Fira Code](https://github.com/tonsky/FiraCode)** -- SIL Open Font License 1.1 (self-hosted in `fonts/`)
- **[js-dos](https://js-dos.com/)** -- GPL v2 (loaded at runtime from CDN)
- **[DOSBox](https://www.dosbox.com/)** -- GPL v2 (bundled inside `assets/doom.jsdos`)
- **DOOM shareware WAD** -- freely distributable shareware, (c) 1993 id Software (bundled inside `assets/doom.jsdos`)
