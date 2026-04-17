# InspoSearch

**The world's open cultural image search — 2487+ sources, 2.5B+ images, one search.**

[![Live](https://img.shields.io/badge/live-insposearch.pages.dev-000?style=flat&logo=cloudflare)](https://insposearch.pages.dev)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat)](LICENSE)
[![Sources](https://img.shields.io/badge/sources-2496%2B-brightgreen?style=flat)](SOURCES.md)
[![Images](https://img.shields.io/badge/images-2.5B%2B-brightgreen?style=flat)](SOURCES.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-contributor%20covenant-purple?style=flat)](CODE_OF_CONDUCT.md)

Free forever. No accounts. No signups. No paywalls. No server.

→ **[Open InspoSearch](https://insposearch.org)**

---

## What it is

InspoSearch is not an image search engine. It is a **multi-source visual research engine** — a creative and scholarly tool that aggregates the open cultural web and makes it explorable, connectable, and inspiring.

Search once and get results from the Met, Rijksmuseum, V&A, NASA, iNaturalist, Europeana, Gallica, museum-digital, DigitalCommonwealth, and 2477+ more — **all at once**, in a unified dark grid. Sources are chosen for depth and diversity, not traffic. You will find things here that do not exist on Google Images.

The magic works without AI. AI amplifies it when you want to go deeper.

---

## Quick start

```bash
# Option 1: Open directly (no install)
# Just open https://insposearch.pages.dev/ in any browser

# Option 2: Serve locally
npm start       # → http://localhost:3000
```

No build step. No dependencies. No server. Opens by double-click.

---

## Features

| Feature | Description |
|---|---|
| **2487+ sources** | World museums, archives, nature databases, libraries, photography |
| **2.5B+ images** | Metropolitan Museum · Rijksmuseum · NASA · iNaturalist · Europeana · Wikimedia · 2482482482482482482482482482482482482482482482482482472472472472477+ more |
| **Exact / Explore modes** | Tight keyword matching or broad serendipitous discovery |
| **Board view** | Drag images to a canvas · arrange · annotate · export as PNG |
| **Deep zoom** | OpenSeadragon IIIF viewer — explore gigapixel museum images |
| **Color extraction** | Dominant palette pulled from every image |
| **3D constellation view** | Three.js spatial layout of results |
| **AI research assistant** | Gemini · Claude · OpenAI · Ollama — opt-in, never required |
| **Source filtering** | Filter by category · region · key requirement · custom preset |
| **Cross-reference mode** | Find conceptual connections across selected images (Interpret ✦) |
| **Pop-out board** | Dual-screen workflow — board opens in a separate window |
| **Export** | Board → PNG · citation text · API key JSON |
| **Dark mode** | Auto-detect + manual override |
| **Offline-ready** | Recent searches cached in localStorage |
| **Keyboard navigation** | Full keyboard support + screen-reader accessible |

---

## AI features (optional)

InspoSearch works fully without AI. Add a key to unlock:

- **Vision analysis** — deep AI reading of any image
- **Interpret ✦** — find hidden conceptual threads across selected images
- **Research assistant** — chat panel that sees your current grid

| Provider | Cost | Notes |
|---|---|---|
| Google Gemini | Free tier (1,500/day) | Best default choice |
| Anthropic Claude | Bring your key | Vision-enabled |
| OpenAI GPT-4o | Bring your key | Vision-enabled |
| Ollama | Free, local | Run models privately |

Keys are stored in your browser's `localStorage` only — never sent to InspoSearch servers (there are none).

---

## Source categories

| Category | Count | Examples |
|---|---|---|
| 🏛️ Museums | 212 | Met · Rijksmuseum · V&A · Louvre · Prado · 200+ more |
| 📷 Photography | 22 | Flickr Commons · Unsplash · Pexels · FSA/OWI |
| 🌿 Nature | 20 | iNaturalist · GBIF · EOL · BHL · Naturalis |
| 📜 Historical | 75 | LOC · Chronicling America · Gallica · Trove |
| 🎨 Art & Design | 58 | WikiArt · Cooper Hewitt · Artsy · museum-digital |
| 🗺️ Maps | 8 | David Rumsey · Old Maps Online |
| 👗 Fashion | 15 | Europeana Fashion · Galliera · Centraal Museum |
| 🔭 Science | 12 | NASA · USGS · NOAA · Hubble |

---

## Adding a source

InspoSearch uses a **community-contributable source manifest** format. Adding a new source is one JSON file and one PR.

See **[CONTRIBUTING.md](CONTRIBUTING.md)** — the full guide takes about 5 minutes.

Sources live in [`insposearch/sources/`](insposearch/sources/). CI validates every PR automatically.

To request a source without writing code: [open a source request issue](https://github.com/GI-Synth/InspoSearch/issues/new?template=source-request.md).

---

## Project structure

```
insposearch/
  index.html              — full app entry point
  app.js                  — all application logic (~11k lines)
  style.css               — all styles (~2.4k lines)
  sources/                — community source manifests (JSON)
  sources.manifest.json   — merged source registry
  data/                   — pre-fetched data for CORS-blocked sources

scripts/
  validate-sources.js     — validates source manifests (CI + local)
  fetch-cors-blocked.js   — nightly fetch for CORS-blocked APIs

.github/
  workflows/
    validate-sources.yml  — validates source PRs
    nightly-fetch.yml     — refreshes cached data nightly
  ISSUE_TEMPLATE/         — bug / feature / source request templates
  PULL_REQUEST_TEMPLATE.md
```

---

## Contributing

- **[CONTRIBUTING.md](CONTRIBUTING.md)** — how to add sources, fix bugs, improve the app
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** — community standards
- **[SECURITY.md](SECURITY.md)** — how to report vulnerabilities
- **[CHANGELOG.md](CHANGELOG.md)** — version history
- **[ROADMAP.md](ROADMAP.md)** — what's next

---

## License

[AGPL-3.0](LICENSE) — free to use and modify; derivatives must remain open source.

---

*InspoSearch — the world's visual heritage, searchable.*

