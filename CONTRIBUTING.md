# Contributing to InspoSearch

InspoSearch is free, open source, and community-driven. The best way to contribute is by adding new cultural heritage sources — one JSON file, one PR.

---

## Adding a source in ~5 minutes

### 1. Fork and clone

```bash
git clone https://github.com/YOUR-FORK/InspoSearch.git
```

> Upstream: `https://github.com/GI-Synth/InspoSearch`

### 2. Copy the template

```bash
cp insposearch/sources/_template.json insposearch/sources/YOUR-SOURCE-ID.json
```

Source IDs must be lowercase, alphanumeric, and hyphen-separated (e.g. `met`, `rijksmuseum`, `tate-modern`).

### 3. Fill in the fields

Open `insposearch/sources/YOUR-SOURCE-ID.json` and fill in every field. See the [schema reference](#schema-reference) below.

The most important fields:

| Field | What it is |
|---|---|
| `id` | Unique ID — lowercase, no spaces |
| `name` | Display name shown in the UI |
| `description` | One sentence — what's special about this source |
| `domain` | Root domain (used for favicon) |
| `endpoint` | The search API URL |
| `adapter` | Which fetch adapter to use |
| `resultsPath` | Dot-path to the array in the response |
| `imageField` | Field name for full image URL |
| `titleField` | Field name for the title |

### 4. Test it

Open `insposearch/index.html` in your browser (or visit [insposearch.pages.dev](https://insposearch.pages.dev) to compare against production), try at least 3 different search terms, and confirm images load. Check the browser console for errors.

The source should:
- Return at least a few results for common search terms
- Not cause console errors
- Load images that are genuinely embeddable (public domain or CC-licensed content)

### 5. Submit a PR

- Branch name: `source/your-source-id`
- PR title: `Add source: Your Source Name`
- Description: one sentence about the source + example search term that works well

The CI will validate your JSON automatically. If it fails, the error message will tell you exactly what to fix.

---

## Schema reference

### Empty template

```json
{
  "id": "unique-lowercase-id",
  "name": "Display Name",
  "description": "Short description — what makes this source interesting",
  "domain": "example.org",
  "category": ["museums"],
  "region": "europe",
  "keyRequired": false,
  "keyLabel": null,
  "getKeyUrl": null,
  "endpoint": "https://api.example.org/search",
  "adapter": "simple_rest",
  "queryParam": "q",
  "resultsPath": "results",
  "imageField": "thumbnail",
  "thumbField": "thumbnail",
  "titleField": "title",
  "sourceUrlField": "url",
  "imageCount": 100000,
  "corsMode": "direct",
  "active": true,
  "tags": ["keyword1", "keyword2"]
}
```

### Filled example — DigitalCommonwealth

```json
{
  "id": "digital_commonwealth",
  "name": "DigitalCommonwealth",
  "description": "1.5M digitized items from Massachusetts cultural institutions",
  "domain": "digitalcommonwealth.org",
  "category": ["archives", "photos", "historical"],
  "region": "americas",
  "keyRequired": false,
  "keyLabel": null,
  "getKeyUrl": null,
  "endpoint": "https://www.digitalcommonwealth.org/search.json",
  "adapter": "simple_rest",
  "queryParam": "q",
  "extraParams": "per_page={limit}",
  "resultsPath": "data",
  "imageField": "attributes.exemplary_image_ssi",
  "imageUrlTemplate": "https://iiif.digitalcommonwealth.org/iiif/2/{id}/full/400,/0/default.jpg",
  "titleField": "attributes.title_info_primary_tsi",
  "descField": "attributes.institution_name_ssi",
  "imageCount": 1500000,
  "corsMode": "direct",
  "active": true,
  "tags": ["boston", "new england", "libraries", "photographs", "maps"]
}
```

**Notes on this example:**
- `adapter: "simple_rest"` — standard JSON REST API, no IIIF search protocol
- `resultsPath: "data"` — results are under the `data` key in the response
- `imageField` returns an ID string like `"commonwealth:1v53kk76g"`, not a URL → `imageUrlTemplate` constructs the full URL by replacing `{id}`
- `extraParams: "per_page={limit}"` — `{limit}` is substituted with the user's image count slider value at runtime

### Valid categories

`museums` · `art` · `photos` · `nature` · `science` · `archives` · `maps` · `fashion` · `architecture` · `botanical` · `film` · `historical`

### Valid regions

`europe` · `uk` · `americas` · `oceania` · `asia` · `global`

### Valid adapters

| Adapter | Use when |
|---|---|
| `simple_rest` | JSON REST API with configurable field mapping |
| `iiif_search` | IIIF Content Search API (v1 or v2) |
| `met_iiif` | Metropolitan Museum IIIF-style API |
| `wellcome_iiif` | Wellcome Collection IIIF API |
| `sketchfab` | Sketchfab API (3D models + thumbnails) |
| `museum_digital` | museum-digital (md/regional node) style |
| `bodleian` | Bodleian Libraries portal style |
| `bsb` | Bayerische Staatsbibliothek style |
| `cudl` | Cambridge Digital Library style |

### CORS

- `"corsMode": "direct"` — the API allows cross-origin requests (preferred)
- `"corsMode": "proxy"` — requires a CORS proxy (note this in your PR)
- `"corsMode": "cached"` — data is pre-fetched by the nightly CI job and bundled into `insposearch/data/`

If a source blocks direct browser requests, it can't be added without a proxy or the cached data pipeline. Check by opening the API URL in your browser DevTools network tab.

### Key-required sources

If the source needs a free API key:

```json
"keyRequired": true,
"keyLabel": "Trove API Key",
"getKeyUrl": "https://trove.nla.gov.au/about/create-something/using-api"
```

Keys are always stored locally in the user's browser. Never sent anywhere except the source's own API.

---

## Source quality rules

- **Free access only** — no per-query payment required
- **Public domain or CC-licensed content** — all images must be legally embeddable
- **Documented API only** — no scraping
- **CORS must be enabled** — or `corsMode: proxy` with a note
- **Stable endpoint** — not a temporary or beta URL that may disappear

Sources that violate these rules will not be merged.

---

## Other ways to contribute

**Bug reports** — use the [bug report template](.github/ISSUE_TEMPLATE/bug-report.md). Include the browser, search term, and a console screenshot.

**Source requests** — if you know a source should exist but don't have time to add it, open a [source request issue](.github/ISSUE_TEMPLATE/source-request.md).

**UI / code** — open an issue first to discuss the change before building it. InspoSearch has a strong visual identity (dark, monospace, restrained) — patches that don't fit the design language will be declined.

---

## Code style

InspoSearch is intentionally simple. No build step, no bundler, no node_modules.

The app is split into three files:
- `insposearch/index.html` — markup
- `insposearch/style.css` — all styles
- `insposearch/app.js` — all application logic

If you're editing the app code:

- Match the existing code style (semicolons, spacing — just match what's around it)
- CDN libraries already in use: Three.js, html2canvas, Fabric.js, OpenSeadragon, Fuse.js
- No additional external dependencies without discussion
- No TypeScript, no frameworks
- Test in both light and dark mode
- Test on mobile viewport (Chrome DevTools responsive mode)

---

## License

InspoSearch is released under the [AGPL-3.0 License](LICENSE). By contributing, you agree your contribution is released under the same terms.

---

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating. For security issues, see [SECURITY.md](SECURITY.md).
