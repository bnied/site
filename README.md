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
| `help` | List all commands |

## Easter Eggs

Too many to list. Try some Linux commands and see what happens.

## Tech Stack

- Vanilla HTML, CSS, JavaScript -- no frameworks, no build step
- [Fira Code](https://github.com/tonsky/FiraCode) font
- [js-dos](https://js-dos.com/) for DOOM (loaded on demand)
- Content stored in `data/*.json`, logic in `js/script.js`

## Structure

```
.
├── index.html
├── css/style.css
├── js/script.js
├── data/
│   ├── sections.json        # resume sections
│   ├── experience.json      # per-role details
│   ├── help.json            # command help text
│   ├── fortunes.json        # fortune quotes
│   ├── ascii.json           # ASCII art assets
│   └── easter-eggs.json     # easter egg data
├── assets/
│   └── doom.jsdos           # DOOM shareware bundle
└── img/                     # favicon variants
```

## Running Locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## License

Content is personal. Code is MIT.
