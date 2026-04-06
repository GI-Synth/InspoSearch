# InspoSearch — Master Plan

> Last updated: April 6, 2026

---

## Mission

Free, open-source, multi-source visual research engine for cultural heritage.
No accounts. No ads. No server. No paywalls. Forever.

---

## Core Identity

| Attribute | Value |
|-----------|-------|
| URL | https://insposearch.pages.dev |
| Docs | https://insposearch-docs.pages.dev |
| Repo | https://github.com/GI-Synth/InspoSearch |
| License | AGPL-3.0 |
| Hosting | Cloudflare Pages (static) |
| API | Cloudflare Workers (`insposearch-api`) |
| Image proxy | Cloudflare Workers (`insposearch-img`) |
| Sources | 521 active, ~248 no-key |
| Images | 3.2B+ searchable |
| Languages | EN, FR, DE, ES, NL, IT |

---

## Architecture

```
User's browser
  ├── insposearch/index.html  (static, served by CF Pages)
  ├── insposearch/app.js      (bundled from src/ by esbuild)
  ├── insposearch/style.css
  └── insposearch/sw.js       (service worker)

Cloudflare Workers
  ├── insposearch-api          (search proxy, semantic, board sharing, captions)
  │   ├── Workers AI binding   (llama 3.2, uform-gen2)
  │   └── KV: BOARDS           (shared boards, 30-day TTL)
  └── insposearch-img          (image proxy, CORS, resize)

GitHub Actions
  ├── nightly-fetch.yml        (CORS-blocked sources, pushes to side branch)
  ├── lighthouse.yml           (perf/a11y/seo checks)
  └── validate-sources.yml     (source manifest validation)
```

---

## Completed Phases

### P0 — Foundation (done)
- [x] esbuild bundle: `src/main.js` → `insposearch/app.js` (minified, ~395 KB)
- [x] og:image social card
- [x] Image alt text on all cards

### P1 — Search Quality (done)
- [x] License filter (CC0, CC-BY, open)
- [x] Deep pagination (lazy load + load more)
- [x] Spell check / "did you mean" (Datamuse)
- [x] Negative/phrase operators (`-word`, `"exact phrase"`)
- [x] pHash cross-source dedup (hamming distance on perceptual hash)
- [x] Relevance-ranked interleave (source-bucketed, scored, seeded shuffle)

### P2 — Expansion (done)
- [x] 6 new sources (Flickr Commons, Archive, Rijksmuseum, V&A, Gallica, BHL) — already existed
- [x] Wikidata artist panel — already existed
- [x] i18n: EN, FR, DE, ES, NL, IT with runtime locale switching

### P3 — Intelligence Layer (done)
- [x] Workers AI semantic search (llama concept expansion + Datamuse fallback)
- [x] Reverse image search (AI caption → search, Google Lens/TinEye fallback)
- [x] KV public board sharing (`?share=<id>`, 30-day TTL)
- [x] Firefox extension (MV2)

### P4 — Polish (done)
- [x] Cloudflare Web Analytics (active, token wired)
- [x] JSON-LD per artwork (VisualArtwork/ImageObject on panel open)
- [x] NSFW filter (sampled Workers AI caption + keyword regex, opt-in)
- [x] CF Image proxy worker (CORS, resize, 10 MB max, rate limited)
- [x] CI fixes (nightly fetch → side branch, Lighthouse single-pass)

---

## Existing Feature Inventory

### Search
- Explore mode (broad, interleaved) / Exact mode (strict, relevance-ranked)
- Advanced search panel: date range, medium, orientation, region, source category, hex palette
- Keyword expansion via Datamuse
- Keyword pills (clickable, removable)
- Color search: named swatches + hex palette picker
- Local filter: Fuse.js client-side re-filter over loaded results
- Auto-search on settings change
- Search history (last 10, localStorage)

### Display
- Grid view — lazy-loaded cards with IntersectionObserver
- Board view — Fabric.js canvas, drag/arrange/annotate, pop-out window
- 3D constellation — Three.js spatial layout
- Deep zoom — OpenSeadragon IIIF viewer
- B&W / sketch mode overlays
- Source badges on cards with refresh button

### Panel
- Image metadata: title, artist, date, source, license
- Palette extraction (dominant + top colors)
- "Find visually similar" (AI caption → search)
- "View artist" (Wikidata panel with bio, works, links)
- Download, cite, save to board actions
- JSON-LD structured data injection

### AI (opt-in, bring your own key)
- Vision analysis (tag any image)
- Interpret ✦ (cross-reference conceptual threads)
- Research assistant chat (sees current grid)
- Providers: Gemini, Claude, OpenAI, Ollama

### Sources
- 521 active sources across 8 categories
- 20 Europeana sub-collections (DATA_PROVIDER/PROVIDER filtered)
- Dynamic Europeana provider discovery via facet API
- CORS-blocked sources served from nightly-fetched static JSON
- Source manifest: `insposearch/sources.manifest.json`

### Infrastructure
- PWA: service worker + manifest.json
- Chrome extension (MV3) + Firefox extension (MV2)
- Cloudflare Workers API: /health, /sources, /search, /random, /semantic, /caption, /board
- Analytics: Cloudflare Web Analytics
- Tests: 21 vitest unit tests
- Docs site: VitePress at insposearch-docs.pages.dev

---

## Upcoming Opportunities

### Europeana Partnership (call April 9, 2026)
- Contact: Emilija Angelovska, API Partnerships Lead
- Goal: official partnership, higher rate limits, partner key, co-promotion
- See: `EuropeanaReadyPlan.md`

### Cosmos Integration
- cosmos.so — visual inspiration platform, complementary not competitive
- Goal: become Cosmos's discovery layer for cultural heritage
- See: `EuropeanaReadyPlan.md` (Phase 4)

---

## Source Counts (verified from live app)

| Category | Count |
|----------|-------|
| Museums & galleries | 212 |
| Photography | 22 |
| Nature | 20 |
| Historical | 75 |
| Art & design | 58 |
| Archives | varies (overlap) |
| **Total active** | **521** |
| No-key sources | ~248 |
| Key-required sources | ~273 |
