# InspoSearch

**A multi-source visual research engine for designers, researchers, artists, and educators.**

Free forever. No accounts. No signups. No paywalls.

→ [Open InspoSearch](insposearch/index.html)

---

![InspoSearch screenshot — dark grid of research images from world museums and archives](docs/screenshot.png)
*screenshot coming soon — open `insposearch/index.html` and search for anything*

---

## What it is

InspoSearch is not an image search engine. It is a multi-source visual research engine — a creative thinking tool that aggregates the open cultural web and makes it explorable, connectable, and inspiring.

Search once and get results from the Met, the V&A, NASA, iNaturalist, the Library of Congress, Gallica, museum-digital, DigitalCommonwealth, and 80+ more — all at once, in a single dark grid. The sources are chosen for depth and diversity, not traffic. You will find things here you would never find on Google Images.

The magic works without AI. AI amplifies it when you want to go deeper.

## How to use it

1. Download or clone this repository
2. Open `insposearch/index.html` in your browser
3. Search for anything

No install. No build step. No server. It opens by double-click.

## Features

- **80+ sources** — world museums, nature archives, historical photography, cultural heritage institutions
- **Exact / Explore modes** — broad serendipitous search or tight keyword matching
- **Board view** — drag images onto a canvas, arrange and annotate
- **Color extraction** — palette pulled from every image
- **AI research assistant** — multi-provider (Gemini, Claude, OpenAI) — opt-in, never required
- **Source filtering** — filter by category, region, key requirement, or custom preset
- **Pop-out board** — open the board in a separate window for dual-screen workflows
- **Export** — save your board as a PNG, export your API keys as JSON
- **Dark mode**

## AI features (optional)

InspoSearch works fully without AI. Add an API key to unlock:

- **Analyse with AI** — deep visual analysis of any image
- **Interpret ✦** — find hidden conceptual connections across selected images  
- **Research assistant** — chat panel that sees your current grid and suggests new search directions

Supported providers: **Google Gemini** (free tier, no key needed to start) · **Anthropic Claude** · **OpenAI GPT-4o** · Any OpenAI-compatible endpoint

Keys are stored locally in your browser. Never sent anywhere except their respective APIs.

## Adding a source

InspoSearch uses a community-contributable source manifest format. Adding a new source is a single JSON file.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide — it takes about 5 minutes.

New sources live in [insposearch/sources/](insposearch/sources/). The manifest merges automatically when your PR is approved.

## Project structure

```
insposearch/
  index.html              — the entire app (HTML + CSS + JS, single file)
  sources/                — community source manifests (JSON)
  sources.manifest.json   — merged manifest (generated)

scripts/
  validate-sources.js     — CI validation script for source manifests

.github/
  workflows/
    validate-sources.yml  — GitHub Actions: validate PRs adding sources
  ISSUE_TEMPLATE/
    source-request.md     — template for requesting new sources
    bug-report.md         — bug report template
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

---

*Built by Malakai. Open source. Free forever.*
